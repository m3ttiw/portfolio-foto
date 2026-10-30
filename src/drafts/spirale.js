// Bozza A · Spirale: le foto fluttuano su tre bracci di una galassia
// inclinata che ruota piano. Profondità di campo nello shader, comete di
// luce lungo i bracci, onda radiale che scopre la scena all'avvio.
import * as THREE from 'three';
import gsap from 'gsap';
import { createStage, trackPointer, isUiTarget } from '../three/stage.js';
import { makeCard, loadCards, srgb, cssColor, clamp01, smoothstep, seeded } from '../three/cards.js';
import { heroPhotos } from '../shared/data.js';
import { renderSections, goToProject } from '../shared/sections.js';
import { introTitle, motionToggle, hoverLabel, fallbackCollage, isMobile } from '../shared/hero.js';

const hero = document.querySelector('#hero');
const ARMS = 3;
const TURNS = 1.1;
const R0 = 2.4;
const R1 = isMobile ? 8 : 11;

function spiralPoint(arm, t) {
  const r = R0 + (R1 - R0) * t;
  const th = arm * ((Math.PI * 2) / ARMS) + t * TURNS * Math.PI * 2;
  return [r * Math.cos(th), r * Math.sin(th), r];
}

const ribbonVertex = /* glsl */ `
  attribute vec2 aN;
  attribute float aSide;
  attribute float aT;
  attribute float aArm;
  uniform float uTime;
  uniform float uWave;
  uniform vec3 uPulse[3];
  varying float vG;
  varying float vSide;
  varying float vReveal;
  varying vec3 vPulse;

  void main() {
    // Le comete corrono verso l'esterno; ogni braccio è sfasato.
    float d = fract(aT * 2.0 - uTime * 0.11 + aArm * 0.37);
    float s = d - 0.5;
    float sig = 0.045 * (s < 0.0 ? 1.8 : 0.5);
    float g = exp(-0.5 * (s / sig) * (s / sig));
    g *= smoothstep(0.03, 0.16, aT);
    float reveal = clamp((uWave - length(position.xy)) / 2.0, 0.0, 1.0);
    vG = g * reveal;
    vSide = aSide;
    vReveal = reveal;
    vPulse = aArm < 0.5 ? uPulse[0] : (aArm < 1.5 ? uPulse[1] : uPulse[2]);
    vec3 p = position;
    p.xy += aN * aSide * (0.03 + 0.16 * vG) * 0.5;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const ribbonFragment = /* glsl */ `
  uniform vec3 uBase;
  varying float vG;
  varying float vSide;
  varying float vReveal;
  varying vec3 vPulse;

  void main() {
    float edge = 1.0 - smoothstep(0.35, 1.0, abs(vSide));
    vec3 col = mix(uBase, vPulse, clamp(vG, 0.0, 1.0));
    gl_FragColor = vec4(col, (0.16 * vReveal + 1.0 * vG) * edge);
  }
`;

function ribbons() {
  const SEG = 280;
  const pos = [];
  const normal = [];
  const side = [];
  const along = [];
  const arm = [];
  const index = [];
  for (let a = 0; a < ARMS; a++) {
    for (let i = 0; i <= SEG; i++) {
      const t = i / SEG;
      const [x, y] = spiralPoint(a, t);
      const [x2, y2] = spiralPoint(a, t + 0.001);
      const len = Math.hypot(x2 - x, y2 - y);
      const nx = -(y2 - y) / len;
      const ny = (x2 - x) / len;
      for (const s of [-1, 1]) {
        pos.push(x, y, 0);
        normal.push(nx, ny);
        side.push(s);
        along.push(t);
        arm.push(a);
      }
      if (i < SEG) {
        const b = (a * (SEG + 1) + i) * 2;
        index.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aN', new THREE.Float32BufferAttribute(normal, 2));
  g.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 1));
  g.setAttribute('aT', new THREE.Float32BufferAttribute(along, 1));
  g.setAttribute('aArm', new THREE.Float32BufferAttribute(arm, 1));
  g.setIndex(index);
  const material = new THREE.ShaderMaterial({
    vertexShader: ribbonVertex,
    fragmentShader: ribbonFragment,
    uniforms: {
      uTime: { value: 0 },
      uWave: { value: 0 },
      uBase: { value: srgb('#f3ede6') },
      // Viola, lavanda e indaco: i colori preferiti di Alessia.
      uPulse: { value: [srgb('#8b5cf6'), srgb('#c4b5fd'), srgb('#6366f1')] },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Mesh(g, material);
}

// Polvere: punti fermi sul disco, appena visibili.
function dust(rand) {
  const pts = [];
  for (let i = 0; i < 700; i++) {
    const r = R0 + Math.sqrt(rand()) * (R1 + 2);
    const th = rand() * Math.PI * 2;
    pts.push(r * Math.cos(th), r * Math.sin(th), (rand() - 0.5) * 1.5);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return new THREE.Points(
    g,
    new THREE.PointsMaterial({ color: 0xf3ede6, size: 0.03, transparent: true, opacity: 0.35, depthWrite: false }),
  );
}

function rings() {
  const group = new THREE.Group();
  for (const k of [0.42, 0.78, 1.12]) {
    const pts = [];
    for (let i = 0; i < 160; i++) {
      const a = (i / 160) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * R1 * k, Math.sin(a) * R1 * k, 0));
    }
    group.add(
      new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0xf3ede6, transparent: true, opacity: 0.07, depthWrite: false }),
      ),
    );
  }
  return group;
}

function buildSpiral({ scene, camera, renderer, onFrame }) {
  const rand = seeded(11);
  const bg = cssColor('--bg');
  camera.position.set(0, 0, isMobile ? 21 : 17);
  const focus = camera.position.length();

  const disc = new THREE.Group();
  disc.rotation.x = -1.0;
  scene.add(disc);
  const ribbon = ribbons();
  disc.add(ribbon, dust(rand), rings());

  const photos = heroPhotos(isMobile ? 21 : 36);
  const perArm = Math.ceil(photos.length / ARMS);
  const cards = photos.map((photo, i) => {
    const arm = i % ARMS;
    const t = (Math.floor(i / ARMS) + 0.5 + (rand() - 0.5) * 0.7) / perArm;
    const [x, y, r] = spiralPoint(arm, t);
    const card = makeCard(photo, { height: (isMobile ? 1.1 : 1.25) * (0.7 + rand() * 0.55) * (0.8 + t * 0.6), fog: bg });
    card.local = new THREE.Vector3(x + (rand() - 0.5) * 0.8, y + (rand() - 0.5) * 0.8, (rand() - 0.5) * 0.8);
    card.r = r;
    card.phase = rand() * Math.PI * 2;
    card.hover = 0;
    card.world = new THREE.Vector3();
    scene.add(card.mesh);
    return card;
  });
  loadCards(cards, renderer, 480);

  const intro = { wave: 0 };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) intro.wave = R1 + 4;
  else gsap.to(intro, { wave: R1 + 4, duration: 3.4, ease: 'power2.inOut', delay: 0.15 });

  const pointer = trackPointer(hero);
  const label = hoverLabel();
  const raycaster = new THREE.Raycaster();
  let hovered = null;
  let spin = 0;
  const ndc = new THREE.Vector3();

  onFrame((dt, s) => {
    spin += dt * 0.05 * s.motion * (hovered ? 0.2 : 1);
    disc.rotation.z = spin;
    const m = pointer.ease(0.05);
    camera.position.x = m.x * 1.6;
    camera.position.y = m.y * 1.0;
    camera.lookAt(0, 0, 0);
    disc.updateMatrixWorld();
    ribbon.material.uniforms.uTime.value = s.time;
    ribbon.material.uniforms.uWave.value = intro.wave;

    raycaster.setFromCamera(pointer.ndc, camera);
    const pickable = cards.filter((c) => c.ready && c.uniforms.uAlpha.value > 0.6).map((c) => c.mesh);
    const hit = raycaster.intersectObjects(pickable, false)[0];
    hovered = hit ? cards.find((c) => c.mesh === hit.object) : null;
    if (hovered) label.show(hovered.photo.project, pointer.clientX, pointer.clientY);
    else label.hide();
    hero.style.cursor = hovered ? 'pointer' : '';

    for (const c of cards) {
      if (!c.ready) continue;
      c.world.copy(c.local);
      c.world.z += Math.sin(s.time * 0.7 + c.phase) * 0.18;
      c.world.applyMatrix4(disc.matrixWorld);
      c.mesh.position.copy(c.world);
      c.mesh.quaternion.copy(camera.quaternion);
      c.hover += ((c === hovered ? 1 : 0) - c.hover) * Math.min(1, dt * 8);

      const depth = camera.position.distanceTo(c.world) - focus; // < 0 vicina, > 0 lontana
      const reveal = clamp01((intro.wave - c.r) / 2.2);
      // Dietro al titolo le foto si fanno da parte: più sfocate e più tenui.
      ndc.copy(c.world).project(camera);
      const behind = (1 - smoothstep(0.45, 1.25, (ndc.x / 0.5) ** 2 + (ndc.y / 0.42) ** 2)) * (1 - c.hover);
      const u = c.uniforms;
      u.uTime.value = s.time;
      u.uAlpha.value = reveal * (1 - clamp01((depth - 4) / 14) * 0.45) * (1 - behind * 0.65);
      u.uBlur.value = Math.min(0.03, Math.abs(depth) * 0.003 + behind * 0.012) * (1 - c.hover) + (1 - reveal) * 0.03;
      u.uFogMix.value = clamp01(depth / 13) * 0.8 * (1 - c.hover);
      u.uAber.value = 0.008 + c.hover * 0.025;
      u.uFrame.value = c.hover * 0.5;
      u.uBulge.value += ((c === hovered ? 0.12 : 0) - u.uBulge.value) * Math.min(1, dt * 6);
      if (c === hovered) u.uPress.value.set((hit.uv.x - 0.5) * c.aspect, hit.uv.y - 0.5);
      c.mesh.scale.setScalar(c.height * (0.55 + 0.45 * reveal) * (1 + 0.14 * c.hover));
      c.mesh.renderOrder = c.hover > 0.02 ? 10 : 0;
    }
  });

  hero.addEventListener('click', (e) => {
    if (hovered && !isUiTarget(e.target)) goToProject(hovered.photo.project.slug);
  });
}

renderSections(document.querySelector('#content'));
introTitle(hero);
const stage = createStage(hero.querySelector('.hero-stage'), { fov: 30 });
motionToggle(hero, stage);
if (stage) buildSpiral(stage);
else fallbackCollage(hero);
if (import.meta.env.DEV) window.__stage = stage;
