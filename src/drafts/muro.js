// Bozza C · Muro: una parete infinita di foto su una superficie concava,
// che scorre da sola e si trascina. Le colonne salgono e scendono in
// direzioni opposte; dietro al titolo le foto si sfocano.
import * as THREE from 'three';
import gsap from 'gsap';
import { createStage, trackPointer, isUiTarget } from '../three/stage.js';
import { makeCard, loadCards, cssColor, clamp01, smoothstep, seeded } from '../three/cards.js';
import { heroPhotos } from '../shared/data.js';
import { renderSections, goToProject } from '../shared/sections.js';
import { introTitle, motionToggle, hoverLabel, fallbackCollage, isMobile, reducedMotion } from '../shared/hero.js';

const hero = document.querySelector('#hero');
const wrap = (v, size) => ((((v + size / 2) % size) + size) % size) - size / 2;

function buildWall({ scene, camera, renderer, state, onFrame }) {
  const rand = seeded(3);
  const bg = cssColor('--bg');
  camera.position.set(0, 0, 10);
  const COLW = isMobile ? 1.3 : 1.4;
  const GAP = 0.16;
  const COLS = Math.max(5, Math.ceil((camera.aspect * 7.8 + 3.2) / (COLW + GAP)));
  const WIDTH = COLS * (COLW + GAP);
  const MIN_H = 16;
  const K = 0.042; // curvatura orizzontale: i bordi vengono verso di te
  const KY = 0.03;

  const photos = heroPhotos(isMobile ? 32 : 56);
  const columns = [];
  const cards = [];
  let n = 0;
  for (let c = 0; c < COLS; c++) {
    let y = 0;
    const items = [];
    while (y < MIN_H) {
      const photo = photos[(n++ * 7 + c) % photos.length];
      const h = COLW / (photo.w / photo.h);
      const card = makeCard(photo, { height: h, fog: bg, radius: 0.025 / h, segments: 6 });
      card.col = c;
      card.y0 = y + h / 2;
      card.hover = 0;
      scene.add(card.mesh);
      items.push(card);
      cards.push(card);
      y += h + GAP;
    }
    columns.push({ height: y, items, dir: c % 2 ? 1 : -1, speed: 0.08 + rand() * 0.08 });
  }
  loadCards(cards, renderer, 480);

  const intro = { k: reducedMotion ? 1 : 0 };
  if (!reducedMotion) gsap.to(intro, { k: 1, duration: 2.6, ease: 'power2.out', delay: 0.15 });

  // Trascinamento con inerzia. touch-action: pan-y lascia lo scroll verticale al browser.
  const offset = { x: 0, y: 0, vx: 0, vy: 0 };
  let drag = null;
  const worldPerPx = () => (2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360)) / state.height;
  hero.addEventListener('pointerdown', (e) => {
    if (isUiTarget(e.target)) return;
    drag = { x: e.clientX, y: e.clientY, moved: 0, id: e.pointerId };
  });
  window.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const k = worldPerPx();
    const dx = (e.clientX - drag.x) * k;
    const dy = (e.clientY - drag.y) * k;
    drag.moved += Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y);
    drag.x = e.clientX;
    drag.y = e.clientY;
    offset.x += dx;
    offset.y -= dy;
    offset.vx = dx * 60;
    offset.vy = -dy * 60;
    hero.classList.toggle('is-dragging', drag.moved > 6);
  });
  const end = () => {
    if (drag && drag.moved < 6 && hovered) goToProject(hovered.photo.project.slug);
    drag = null;
    hero.classList.remove('is-dragging');
  };
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', () => {
    drag = null;
    hero.classList.remove('is-dragging');
  });

  const pointer = trackPointer(hero);
  const label = hoverLabel();
  const raycaster = new THREE.Raycaster();
  let hovered = null;

  onFrame((dt, s) => {
    if (!drag) {
      offset.x += (offset.vx * dt) + dt * 0.28 * s.motion;
      offset.y += offset.vy * dt;
      const decay = Math.exp(-dt * 3.5);
      offset.vx *= decay;
      offset.vy *= decay;
    }
    const m = pointer.ease(0.05);
    camera.position.x = m.x * 0.45;
    camera.position.y = m.y * 0.3;
    camera.lookAt(0, 0, 0);

    raycaster.setFromCamera(pointer.ndc, camera);
    const pickable = cards.filter((c) => c.ready && c.uniforms.uAlpha.value > 0.6).map((c) => c.mesh);
    const hit = drag && drag.moved > 6 ? null : raycaster.intersectObjects(pickable, false)[0];
    hovered = hit ? cards.find((c) => c.mesh === hit.object) : null;
    if (hovered) label.show(hovered.photo.project, pointer.clientX, pointer.clientY);
    else label.hide();
    hero.style.cursor = drag && drag.moved > 6 ? 'grabbing' : hovered ? 'pointer' : 'grab';

    for (const col of columns) {
      const shift = s.time * col.speed * col.dir + offset.y;
      for (const c of col.items) {
        if (!c.ready) continue;
        const x = wrap(c.col * (COLW + GAP) + offset.x, WIDTH);
        const y = wrap(c.y0 + shift, col.height);
        const z = K * x * x + KY * y * y;
        c.mesh.position.set(x, y, z);
        c.mesh.rotation.set(Math.atan(2 * KY * y), -Math.atan(2 * K * x), 0);
        c.hover += ((c === hovered ? 1 : 0) - c.hover) * Math.min(1, dt * 8);

        // Dietro al titolo: sfocate e più chiare, così il testo si legge.
        const e = (x / (isMobile ? 2.6 : 4.4)) ** 2 + (y / 2.5) ** 2;
        const behind = 1 - smoothstep(0.55, 1.35, e);
        const appear = clamp01((intro.k * 16 - Math.hypot(x, y)) / 3);
        const u = c.uniforms;
        u.uAlpha.value = appear;
        u.uBlur.value = (behind * 0.016 + (1 - appear) * 0.02) * (1 - c.hover);
        u.uFogMix.value = behind * 0.6 * (1 - c.hover);
        u.uAber.value = 0.006 + c.hover * 0.02;
        u.uBulge.value += ((c === hovered ? 0.1 : 0) - u.uBulge.value) * Math.min(1, dt * 6);
        if (c === hovered) u.uPress.value.set((hit.uv.x - 0.5) * c.aspect, hit.uv.y - 0.5);
        c.mesh.scale.setScalar(c.height * (0.9 + 0.1 * appear) * (1 + 0.07 * c.hover));
        c.mesh.renderOrder = c.hover > 0.02 ? 10 : 0;
      }
    }
  });
}

renderSections(document.querySelector('#content'));
introTitle(hero);
const stage = createStage(hero.querySelector('.hero-stage'), { fov: 40 });
motionToggle(hero, stage);
if (stage) buildWall(stage);
else fallbackCollage(hero);
