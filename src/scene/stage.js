import * as THREE from 'three';
import { isMobile, prefersReducedMotion } from '../device.js';

// Crea il canvas WebGL dentro `container` e fa partire il ciclo di disegno.
// Restituisce null se il browser non supporta WebGL.
export function createStage(container) {
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
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 400);

  // paused ferma il movimento automatico; motion va da 1 a 0 piano piano, così la spirale rallenta
  // invece di bloccarsi di colpo. time è il tempo dell'animazione, che si ferma in pausa.
  const state = {
    paused: prefersReducedMotion,
    motion: prefersReducedMotion ? 0 : 1,
    time: 0,
    visible: true,
    contextLost: false,
  };
  const frameCallbacks = [];

  // Adatta canvas e camera alle dimensioni del contenitore.
  function resize() {
    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(container);
  resize();

  // Non disegna quando la scena è fuori schermo.
  new IntersectionObserver(([entry]) => {
    state.visible = entry.isIntersecting;
  }).observe(container);

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    state.contextLost = true;
  });
  canvas.addEventListener('webglcontextrestored', () => {
    state.contextLost = false;
  });

  // Un fotogramma: aggiorna il tempo, chiama le funzioni della scena e disegna.
  let lastTime = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    if (!state.visible || state.contextLost || document.hidden) return;

    state.motion += ((state.paused ? 0 : 1) - state.motion) * Math.min(1, dt * 3);
    state.time += dt * state.motion;
    frameCallbacks.forEach((callback) => callback(dt, state));
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  return {
    renderer,
    scene,
    camera,
    state,
    onFrame: (callback) => frameCallbacks.push(callback),
  };
}
