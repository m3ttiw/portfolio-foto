import * as THREE from 'three';
import { isMobile, reducedMotion } from '../shared/hero.js';

// Renderer, camera e ciclo di disegno condivisi dalle bozze.
// Il ciclo si ferma fuori viewport, con la tab nascosta e se il contesto
// WebGL viene perso. "paused" ferma solo il movimento automatico: le
// interazioni col puntatore restano attive.
export function createStage(container, { fov = 35 } = {}) {
  const canvas = document.createElement('canvas');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch {
    document.documentElement.classList.add('no-webgl');
    return null;
  }
  container.append(canvas);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 400);
  const state = {
    paused: reducedMotion,
    reduced: reducedMotion,
    motion: reducedMotion ? 0 : 1, // 0..1, scende piano quando metti in pausa
    time: 0,
    width: 1,
    height: 1,
    visible: true,
    lost: false,
  };
  const frameFns = [];
  const resizeFns = [];

  const resize = () => {
    state.width = container.clientWidth || 1;
    state.height = container.clientHeight || 1;
    renderer.setSize(state.width, state.height, false);
    camera.aspect = state.width / state.height;
    camera.updateProjectionMatrix();
    resizeFns.forEach((fn) => fn(state.width, state.height));
  };
  new ResizeObserver(resize).observe(container);
  resize();

  new IntersectionObserver(([entry]) => (state.visible = entry.isIntersecting)).observe(container);
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    state.lost = true;
  });
  canvas.addEventListener('webglcontextrestored', () => (state.lost = false));

  let last = performance.now();
  const loop = (now) => {
    requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (!state.visible || state.lost || document.hidden) return;
    state.motion += ((state.paused ? 0 : 1) - state.motion) * Math.min(1, dt * 3);
    state.time += dt * state.motion;
    frameFns.forEach((fn) => fn(dt, state));
    renderer.render(scene, camera);
  };
  requestAnimationFrame(loop);

  return {
    renderer,
    scene,
    camera,
    canvas,
    state,
    onFrame: (fn) => frameFns.push(fn),
    onResize: (fn) => {
      resizeFns.push(fn);
      fn(state.width, state.height);
    },
  };
}

// Puntatore relativo a un elemento: ndc per il raycaster, client per le etichette.
export function trackPointer(el) {
  const p = { ndc: new THREE.Vector2(9, 9), x: 0, y: 0, clientX: 0, clientY: 0, inside: false, smooth: new THREE.Vector2() };
  const update = (e) => {
    const r = el.getBoundingClientRect();
    p.clientX = e.clientX;
    p.clientY = e.clientY;
    p.inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    // Sopra testi, pulsanti e header le foto della scena non reagiscono.
    p.overUi = Boolean(e.target.closest?.('.hero-copy > *, .site-header, .motion-toggle, .draft-switch, .travel-hud'));
    p.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    p.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    const active = p.inside && !p.overUi;
    p.ndc.set(active ? p.x : 9, active ? p.y : 9);
  };
  window.addEventListener('pointermove', update, { passive: true });
  window.addEventListener('pointerdown', update, { passive: true });
  document.addEventListener('pointerleave', () => {
    p.inside = false;
    p.ndc.set(9, 9);
  });
  p.ease = (k = 0.06) => {
    p.smooth.x += ((p.inside ? p.x : 0) - p.smooth.x) * k;
    p.smooth.y += ((p.inside ? p.y : 0) - p.smooth.y) * k;
    return p.smooth;
  };
  return p;
}

// Il click sulla scena vale solo se non è su un link o un pulsante della hero.
export const isUiTarget = (target) => Boolean(target.closest('a, button, input, select, textarea, label'));
