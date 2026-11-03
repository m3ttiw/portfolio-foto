import * as THREE from 'three';
import gsap from 'gsap';
import { spiralPhotos } from '../data.js';
import { isMobile, prefersReducedMotion } from '../device.js';
import { photoLabel } from '../hero.js';
import { createCard, hexToVector, loadCardTextures } from './card.js';

// Forma della spirale: tre bracci, poco più di un giro, dal raggio R0 al raggio R1.
const ARMS = 3;
const TURNS = 1.1;
const R0 = 2.4;
const R1 = isMobile ? 8 : 11;

// Colori delle comete che corrono lungo i bracci: viola, lavanda, indaco.
const COMET_COLORS = ['#8b5cf6', '#c4b5fd', '#6366f1'];
const LINE_COLOR = '#f3ede6';

// Costruisce la spirale di foto nella scena. Al click su una foto chiama onPhotoClick(progetto).
export function createSpiral({ scene, camera, renderer, onFrame }, hero, { onPhotoClick }) {
  const random = seededRandom(11);
  const background = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();

  camera.position.set(0, 0, isMobile ? 21 : 17);
  const focusDistance = camera.position.length();

  // Il disco è inclinato all'indietro e ruota piano su sé stesso.
  const disc = new THREE.Group();
  disc.rotation.x = -1.0;
  scene.add(disc);
  const arms = createArms();
  disc.add(arms, createDust(random), createRings());

  // Le card stanno lungo i bracci, alternandosi tra un braccio e l'altro.
  const photos = spiralPhotos(isMobile ? 21 : 36);
  const cardsPerArm = Math.ceil(photos.length / ARMS);
  const cards = photos.map((photo, i) => {
    const arm = i % ARMS;
    const t = (Math.floor(i / ARMS) + 0.5 + (random() - 0.5) * 0.7) / cardsPerArm;
    const [x, y, radius] = spiralPoint(arm, t);
    const height = (isMobile ? 1.1 : 1.25) * (0.7 + random() * 0.55) * (0.8 + t * 0.6);
    const card = createCard(photo, { height, fogColor: background });
    card.local = new THREE.Vector3(x + (random() - 0.5) * 0.8, y + (random() - 0.5) * 0.8, (random() - 0.5) * 0.8);
    card.radius = radius;
    card.phase = random() * Math.PI * 2;
    card.hover = 0;
    card.world = new THREE.Vector3();
    scene.add(card.mesh);
    return card;
  });
  loadCardTextures(cards, renderer);

  // All'avvio un'onda parte dal centro e scopre card e bracci.
  const intro = { wave: 0 };
  if (prefersReducedMotion) intro.wave = R1 + 4;
  else gsap.to(intro, { wave: R1 + 4, duration: 3.4, ease: 'power2.inOut', delay: 0.15 });

  const pointer = followPointer(hero);
  const label = photoLabel(document.querySelector('.hero-label'));
  const raycaster = new THREE.Raycaster();
  const screenPosition = new THREE.Vector3();
  let hovered = null;
  let spin = 0;

  onFrame((dt, state) => {
    // Rotazione, più lenta quando il puntatore è su una foto. La camera segue un po' il puntatore.
    spin += dt * 0.05 * state.motion * (hovered ? 0.2 : 1);
    disc.rotation.z = spin;
    const smooth = pointer.smoothed(0.05);
    camera.position.x = smooth.x * 1.6;
    camera.position.y = smooth.y * 1.0;
    camera.lookAt(0, 0, 0);
    disc.updateMatrixWorld();
    arms.material.uniforms.uTime.value = state.time;
    arms.material.uniforms.uWave.value = intro.wave;

    // Quale foto c'è sotto il puntatore?
    raycaster.setFromCamera(pointer.ndc, camera);
    const visibleMeshes = cards.filter((c) => c.ready && c.uniforms.uAlpha.value > 0.6).map((c) => c.mesh);
    const hit = raycaster.intersectObjects(visibleMeshes, false)[0];
    hovered = hit ? cards.find((c) => c.mesh === hit.object) : null;
    if (hovered) label.show(hovered.photo.project, pointer.clientX, pointer.clientY);
    else label.hide();
    hero.style.cursor = hovered ? 'pointer' : '';

    for (const card of cards) {
      if (card.ready) updateCard(card, dt, state.time, hit);
    }
  });

  // Posizione, sfocatura, trasparenza e dimensione di una card in questo fotogramma.
  function updateCard(card, dt, time, hit) {
    card.world.copy(card.local);
    card.world.z += Math.sin(time * 0.7 + card.phase) * 0.18;
    card.world.applyMatrix4(disc.matrixWorld);
    card.mesh.position.copy(card.world);
    card.mesh.quaternion.copy(camera.quaternion); // sempre rivolta verso la camera
    card.hover += ((card === hovered ? 1 : 0) - card.hover) * Math.min(1, dt * 8);

    // depth < 0: più vicina del centro; depth > 0: più lontana.
    const depth = camera.position.distanceTo(card.world) - focusDistance;
    const reveal = clamp01((intro.wave - card.radius) / 2.2);

    // Dietro al titolo le foto si fanno da parte: più sfocate e più tenui.
    screenPosition.copy(card.world).project(camera);
    const distanceFromCenter = (screenPosition.x / 0.5) ** 2 + (screenPosition.y / 0.42) ** 2;
    const behindTitle = (1 - smoothstep(0.45, 1.25, distanceFromCenter)) * (1 - card.hover);

    const u = card.uniforms;
    u.uAlpha.value = reveal * (1 - clamp01((depth - 4) / 14) * 0.45) * (1 - behindTitle * 0.65);
    u.uBlur.value =
      Math.min(0.03, Math.abs(depth) * 0.003 + behindTitle * 0.012) * (1 - card.hover) + (1 - reveal) * 0.03;
    u.uFogMix.value = clamp01(depth / 13) * 0.8 * (1 - card.hover);
    u.uAber.value = 0.008 + card.hover * 0.025;
    u.uFrame.value = card.hover * 0.5;
    u.uBulge.value += ((card === hovered ? 0.12 : 0) - u.uBulge.value) * Math.min(1, dt * 6);
    if (card === hovered) u.uPress.value.set((hit.uv.x - 0.5) * card.aspect, hit.uv.y - 0.5);
    card.mesh.scale.setScalar(card.height * (0.55 + 0.45 * reveal) * (1 + 0.14 * card.hover));
    card.mesh.renderOrder = card.hover > 0.02 ? 10 : 0; // la foto sotto il puntatore sta davanti
  }

  hero.addEventListener('click', (event) => {
    const onButtonOrLink = event.target.closest('a, button, input, select, textarea, label');
    if (hovered && !onButtonOrLink) onPhotoClick(hovered.photo.project);
  });
}

// Punto del braccio `arm` a una frazione `t` (da 0 a 1) della sua lunghezza.
function spiralPoint(arm, t) {
  const radius = R0 + (R1 - R0) * t;
  const angle = arm * ((Math.PI * 2) / ARMS) + t * TURNS * Math.PI * 2;
  return [radius * Math.cos(angle), radius * Math.sin(angle), radius];
}

const armsVertexShader = /* glsl */ `
  attribute vec2 aNormal;
  attribute float aSide;
  attribute float aT;
  attribute float aArm;
  uniform float uTime;
  uniform float uWave;
  uniform vec3 uComet[3];
  varying float vGlow;
  varying float vSide;
  varying float vReveal;
  varying vec3 vComet;

  void main() {
    // Due comete per braccio corrono verso l'esterno, ogni braccio sfasato dagli altri.
    float d = fract(aT * 2.0 - uTime * 0.11 + aArm * 0.37);
    float s = d - 0.5;
    float width = 0.045 * (s < 0.0 ? 1.8 : 0.5);
    float glow = exp(-0.5 * (s / width) * (s / width));
    glow *= smoothstep(0.03, 0.16, aT);
    float reveal = clamp((uWave - length(position.xy)) / 2.0, 0.0, 1.0);
    vGlow = glow * reveal;
    vSide = aSide;
    vReveal = reveal;
    vComet = aArm < 0.5 ? uComet[0] : (aArm < 1.5 ? uComet[1] : uComet[2]);
    vec3 p = position;
    p.xy += aNormal * aSide * (0.03 + 0.16 * vGlow) * 0.5;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const armsFragmentShader = /* glsl */ `
  uniform vec3 uLine;
  varying float vGlow;
  varying float vSide;
  varying float vReveal;
  varying vec3 vComet;

  void main() {
    float edge = 1.0 - smoothstep(0.35, 1.0, abs(vSide));
    vec3 color = mix(uLine, vComet, clamp(vGlow, 0.0, 1.0));
    gl_FragColor = vec4(color, (0.16 * vReveal + 1.0 * vGlow) * edge);
  }
`;

// I tre bracci della spirale: nastri sottili su cui corrono le comete colorate.
function createArms() {
  const SEGMENTS = 280;
  const positions = [];
  const normals = [];
  const sides = [];
  const along = [];
  const armIndex = [];
  const indices = [];

  for (let arm = 0; arm < ARMS; arm++) {
    for (let i = 0; i <= SEGMENTS; i++) {
      const t = i / SEGMENTS;
      const [x, y] = spiralPoint(arm, t);
      const [nextX, nextY] = spiralPoint(arm, t + 0.001);
      const length = Math.hypot(nextX - x, nextY - y);
      const normalX = -(nextY - y) / length;
      const normalY = (nextX - x) / length;

      // Due vertici per punto, uno per lato del nastro.
      for (const side of [-1, 1]) {
        positions.push(x, y, 0);
        normals.push(normalX, normalY);
        sides.push(side);
        along.push(t);
        armIndex.push(arm);
      }
      if (i < SEGMENTS) {
        const first = (arm * (SEGMENTS + 1) + i) * 2;
        indices.push(first, first + 1, first + 2, first + 1, first + 3, first + 2);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('aNormal', new THREE.Float32BufferAttribute(normals, 2));
  geometry.setAttribute('aSide', new THREE.Float32BufferAttribute(sides, 1));
  geometry.setAttribute('aT', new THREE.Float32BufferAttribute(along, 1));
  geometry.setAttribute('aArm', new THREE.Float32BufferAttribute(armIndex, 1));
  geometry.setIndex(indices);

  const material = new THREE.ShaderMaterial({
    vertexShader: armsVertexShader,
    fragmentShader: armsFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uWave: { value: 0 },
      uLine: { value: hexToVector(LINE_COLOR) },
      uComet: { value: COMET_COLORS.map(hexToVector) },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  return new THREE.Mesh(geometry, material);
}

// Puntini fermi sul disco, appena visibili, come polvere di stelle.
function createDust(random) {
  const points = [];
  for (let i = 0; i < 700; i++) {
    const radius = R0 + Math.sqrt(random()) * (R1 + 2);
    const angle = random() * Math.PI * 2;
    points.push(radius * Math.cos(angle), radius * Math.sin(angle), (random() - 0.5) * 1.5);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
  const material = new THREE.PointsMaterial({ color: 0xf3ede6, size: 0.03, transparent: true, opacity: 0.35, depthWrite: false });
  return new THREE.Points(geometry, material);
}

// Tre cerchi sottili attorno al centro del disco.
function createRings() {
  const group = new THREE.Group();
  for (const scale of [0.42, 0.78, 1.12]) {
    const points = [];
    for (let i = 0; i < 160; i++) {
      const angle = (i / 160) * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(angle) * R1 * scale, Math.sin(angle) * R1 * scale, 0));
    }
    const material = new THREE.LineBasicMaterial({ color: 0xf3ede6, transparent: true, opacity: 0.07, depthWrite: false });
    group.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), material));
  }
  return group;
}

// Segue il puntatore sopra la hero. ndc sono le coordinate per il raycaster (da -1 a 1);
// sopra testi, pulsanti e header valgono "fuori", così le foto lì sotto non reagiscono.
function followPointer(element) {
  const pointer = {
    ndc: new THREE.Vector2(9, 9),
    x: 0,
    y: 0,
    clientX: 0,
    clientY: 0,
    inside: false,
    smooth: new THREE.Vector2(),
  };

  function update(event) {
    const rect = element.getBoundingClientRect();
    pointer.clientX = event.clientX;
    pointer.clientY = event.clientY;
    pointer.inside =
      event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
    const overText = Boolean(event.target.closest?.('.hero-copy > *, .site-header, .motion-toggle'));
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    const active = pointer.inside && !overText;
    pointer.ndc.set(active ? pointer.x : 9, active ? pointer.y : 9);
  }

  window.addEventListener('pointermove', update, { passive: true });
  window.addEventListener('pointerdown', update, { passive: true });
  document.addEventListener('pointerleave', () => {
    pointer.inside = false;
    pointer.ndc.set(9, 9);
  });

  // Posizione del puntatore addolcita: si avvicina a quella vera di una frazione per fotogramma.
  pointer.smoothed = (amount) => {
    pointer.smooth.x += ((pointer.inside ? pointer.x : 0) - pointer.smooth.x) * amount;
    pointer.smooth.y += ((pointer.inside ? pointer.y : 0) - pointer.smooth.y) * amount;
    return pointer.smooth;
  };
  return pointer;
}

// Numeri casuali sempre uguali a partire dallo stesso seme: la spirale è identica a ogni visita.
function seededRandom(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(from, to, value) {
  const t = clamp01((value - from) / (to - from));
  return t * t * (3 - 2 * t);
}
