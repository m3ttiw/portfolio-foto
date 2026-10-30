// Bozza B · Corridoio: scrollando la camera attraversa una fila di foto
// sospese in profondità. Quella a fuoco è nitida, le lontane si perdono
// nella nebbia color carta.
import * as THREE from 'three';
import gsap from 'gsap';
import { createStage, trackPointer, isUiTarget } from '../three/stage.js';
import { makeCard, loadCards, cssColor, clamp01, smoothstep, seeded } from '../three/cards.js';
import { categoryById, heroPhotos } from '../shared/data.js';
import { renderSections, goToProject } from '../shared/sections.js';
import { introTitle, motionToggle, hoverLabel, fallbackCollage, isMobile, reducedMotion } from '../shared/hero.js';

const hero = document.querySelector('#hero');

function buildCorridor({ scene, camera, renderer, onFrame }) {
  const rand = seeded(5);
  const bg = cssColor('--bg');
  const N = isMobile ? 22 : 30;
  const SPACING = 3.2;
  const FOCUS = 5.2;
  const zStart = 6.5;
  const zEnd = -(N - 1) * SPACING + FOCUS;

  const cards = heroPhotos(N).map((photo, i) => {
    const side = i % 2 === 0 ? -1 : 1;
    const card = makeCard(photo, { height: (isMobile ? 1.6 : 2.05) * (0.85 + rand() * 0.3), fog: bg, radius: 0.012 });
    card.base = new THREE.Vector3(
      side * (isMobile ? 0.45 + rand() * 0.45 : 1.45 + rand() * 1.5),
      (rand() - 0.5) * (isMobile ? 2.0 : 1.5),
      -i * SPACING,
    );
    card.mesh.rotation.y = -side * 0.16;
    card.mesh.rotation.z = (rand() - 0.5) * 0.05;
    card.mesh.position.copy(card.base);
    card.index = i;
    card.hover = 0;
    card.phase = rand() * Math.PI * 2;
    card.uniforms.uWave.value = 0.025;
    scene.add(card.mesh);
    return card;
  });
  loadCards(cards, renderer, 800);

  const copy = hero.querySelector('.hero-copy');
  const hint = hero.querySelector('.hero-hint');
  const hud = hero.querySelector('.travel-hud');
  const hudCount = hud.querySelector('.travel-count');
  const hudTitle = hud.querySelector('.travel-title');
  const hudBar = hud.querySelector('.travel-bar i');

  const intro = { k: reducedMotion ? 1 : 0 };
  if (!reducedMotion) gsap.to(intro, { k: 1, duration: 2.4, ease: 'power2.out', delay: 0.2 });

  const pointer = trackPointer(hero);
  const label = hoverLabel();
  const raycaster = new THREE.Raycaster();
  let hovered = null;
  let progress = 0;
  let current = -1;

  const scrollProgress = () => {
    if (reducedMotion) return 0;
    const r = hero.getBoundingClientRect();
    return clamp01(-r.top / Math.max(1, r.height - window.innerHeight));
  };

  onFrame((dt, s) => {
    progress += (scrollProgress() - progress) * Math.min(1, dt * 5);
    const travel = zStart + (zEnd - zStart) * progress;
    const m = pointer.ease(0.05);
    camera.position.set(m.x * 0.5, m.y * 0.35, travel + Math.sin(s.time * 0.5) * 0.25);
    camera.lookAt(m.x * 0.2, m.y * 0.15, travel - 10);

    copy.style.opacity = String(1 - smoothstep(0.01, 0.07, progress));
    copy.style.transform = `translateY(${-progress * 600}px)`;
    hint.style.opacity = copy.style.opacity;
    hud.classList.toggle('is-on', progress > 0.05 && progress < 0.985);
    hudBar.style.transform = `scaleX(${progress})`;

    raycaster.setFromCamera(pointer.ndc, camera);
    const pickable = cards.filter((c) => c.ready && c.uniforms.uAlpha.value > 0.6).map((c) => c.mesh);
    const hit = raycaster.intersectObjects(pickable, false)[0];
    hovered = hit ? cards.find((c) => c.mesh === hit.object) : null;
    if (hovered) label.show(hovered.photo.project, pointer.clientX, pointer.clientY);
    else label.hide();
    hero.style.cursor = hovered ? 'pointer' : '';

    let best = null;
    let bestD = Infinity;
    for (const c of cards) {
      if (!c.ready) continue;
      const u = c.uniforms;
      c.mesh.position.y = c.base.y + Math.sin(s.time * 0.6 + c.phase) * 0.06;
      c.hover += ((c === hovered ? 1 : 0) - c.hover) * Math.min(1, dt * 8);
      const ahead = camera.position.z - c.base.z; // distanza davanti alla camera
      const off = Math.abs(ahead - FOCUS);
      const appear = clamp01(intro.k * 1.6 - c.index * 0.05);
      u.uTime.value = s.time;
      u.uAlpha.value = smoothstep(1.4, 3.4, ahead) * appear;
      u.uBlur.value = Math.min(0.026, off * 0.0026) * (1 - c.hover);
      u.uFogMix.value = clamp01((ahead - 8) / 30) * 0.92 * (1 - c.hover);
      u.uAber.value = 0.006 + c.hover * 0.02;
      u.uBulge.value += ((c === hovered ? 0.18 : 0) - u.uBulge.value) * Math.min(1, dt * 6);
      if (c === hovered) u.uPress.value.set((hit.uv.x - 0.5) * c.aspect, hit.uv.y - 0.5);
      c.mesh.scale.setScalar(c.height * (1 + 0.05 * c.hover));
      if (ahead > 0.5 && off < bestD) {
        bestD = off;
        best = c;
      }
    }
    if (best && best.index !== current) {
      current = best.index;
      const p = best.photo.project;
      hudCount.textContent = `${String(current + 1).padStart(2, '0')} / ${N}`;
      hudTitle.textContent = `${p.title} · ${categoryById[p.category].label}`;
    }
  });

  hero.addEventListener('click', (e) => {
    if (hovered && !isUiTarget(e.target)) goToProject(hovered.photo.project.slug);
  });
}

renderSections(document.querySelector('#content'));
introTitle(hero);
const stage = createStage(hero.querySelector('.hero-stage'), { fov: isMobile ? 58 : 46 });
motionToggle(hero, stage);
if (stage) buildCorridor(stage);
else fallbackCollage(hero);
