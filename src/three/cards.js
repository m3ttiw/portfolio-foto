import * as THREE from 'three';
import { asset } from '../shared/data.js';

// Colore esadecimale -> vec3 nello spazio sRGB, così com'è.
// Le texture non vengono convertite (NoColorSpace) e lo shader scrive i
// valori senza conversioni: i colori della foto arrivano a schermo identici.
export const srgb = (hex) => {
  const n = parseInt(hex.replace('#', ''), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

export const cssColor = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

const loader = new THREE.TextureLoader();
const textures = new Map();

// Una texture per file, condivisa dalle card che mostrano la stessa foto.
export function loadTexture(src, renderer) {
  if (!textures.has(src)) {
    textures.set(
      src,
      new Promise((resolve) =>
        loader.load(
          asset(src),
          (tex) => {
            tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
            resolve(tex);
          },
          undefined,
          () => resolve(null),
        ),
      ),
    );
  }
  return textures.get(src);
}

const vertexShader = /* glsl */ `
  uniform vec2 uPress;     // punto sotto il puntatore, in unità della card
  uniform float uBulge;    // quanto la card si gonfia verso la camera lì
  uniform float uAspect;
  uniform float uTime;
  uniform float uWave;     // leggera ondulazione, come un foglio
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 p = position;
    float d = length(p.xy - uPress);
    p.z += uBulge * exp(-d * d * 7.0);
    p.z += sin(p.x * 2.2 + p.y * 1.3 + uTime * 0.9) * uWave;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uAspect;
  uniform float uBlur;      // raggio di sfocatura in uv
  uniform float uAlpha;
  uniform float uAber;      // aberrazione cromatica ai bordi
  uniform float uRadius;    // raggio degli angoli, in altezze della card
  uniform vec3 uFog;
  uniform float uFogMix;
  uniform float uGray;
  uniform float uFrame;
  uniform vec3 uFrameCol;
  varying vec2 vUv;

  const vec2 TAPS[12] = vec2[12](
    vec2(-0.326, -0.406), vec2(-0.840, -0.074), vec2(-0.696, 0.457),
    vec2(-0.203, 0.621), vec2(0.962, -0.195), vec2(0.473, -0.480),
    vec2(0.519, 0.767), vec2(0.185, -0.893), vec2(0.507, 0.064),
    vec2(0.896, 0.412), vec2(-0.322, -0.933), vec2(-0.792, -0.598)
  );

  float roundedBox(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  void main() {
    vec3 col;
    if (uBlur > 0.0006) {
      // Disco di Poisson ruotato per pixel, sopra un livello di mipmap già
      // sfocato: una sfocatura larga con pochi campioni.
      float a = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.545) * 6.2832;
      mat2 rot = mat2(cos(a), -sin(a), sin(a), cos(a));
      float bias = clamp(log2(1.0 + uBlur * 260.0), 0.0, 5.0);
      vec2 k = vec2(1.0 / uAspect, 1.0) * uBlur;
      vec3 acc = texture2D(uMap, vUv, bias).rgb;
      for (int i = 0; i < 12; i++) {
        acc += texture2D(uMap, clamp(vUv + rot * TAPS[i] * k, 0.002, 0.998), bias).rgb;
      }
      col = acc / 13.0;
    } else {
      vec2 d = vUv - 0.5;
      vec2 shift = d * dot(d, d) * 4.0 * uAber;
      col = vec3(
        texture2D(uMap, vUv + shift).r,
        texture2D(uMap, vUv).g,
        texture2D(uMap, vUv - shift).b
      );
    }
    col = mix(col, vec3(dot(col, vec3(0.299, 0.587, 0.114))), uGray);
    col = mix(col, uFog, uFogMix);

    // Angoli arrotondati con bordo antialias e cornice sottile sullo stesso bordo.
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
    float sd = roundedBox(p, vec2(uAspect, 1.0) * 0.5, uRadius);
    float fw = max(fwidth(sd), 1e-5);
    float mask = 1.0 - smoothstep(-fw, fw, sd);
    float frame = (1.0 - smoothstep(fw * 0.5, fw * 1.8, abs(sd + fw * 1.4))) * uFrame;
    col = mix(col, uFrameCol, frame);

    gl_FragColor = vec4(col, mask * uAlpha);
  }
`;

// Una foto come piano alto 1 e largo come il suo rapporto d'aspetto.
export function makeCard(photo, { height = 1, segments = 14, fog = '#000000', radius = 0.035 } = {}) {
  const aspect = photo.w / photo.h;
  const geometry = new THREE.PlaneGeometry(aspect, 1, segments, segments);
  const uniforms = {
    uMap: { value: null },
    uAspect: { value: aspect },
    uBlur: { value: 0 },
    uAlpha: { value: 0 },
    uAber: { value: 0.012 },
    uRadius: { value: radius },
    uFog: { value: srgb(fog) },
    uFogMix: { value: 0 },
    uGray: { value: 0 },
    uFrame: { value: 0 },
    uFrameCol: { value: srgb('#ffffff') },
    uPress: { value: new THREE.Vector2(99, 99) },
    uBulge: { value: 0 },
    uTime: { value: 0 },
    uWave: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.scale.setScalar(height);
  mesh.visible = false;
  return { mesh, uniforms, photo, aspect, height, ready: false };
}

// Carica le texture in ordine, poche alla volta: le prime card compaiono subito.
export async function loadCards(cards, renderer, size = 480, parallel = 6) {
  let next = 0;
  const worker = async () => {
    while (next < cards.length) {
      const card = cards[next++];
      const tex = await loadTexture(card.photo.srcset[size], renderer);
      if (!tex) continue;
      card.uniforms.uMap.value = tex;
      card.ready = true;
      card.mesh.visible = true;
    }
  };
  await Promise.all(Array.from({ length: parallel }, worker));
}

// Numeri casuali ripetibili: la composizione resta uguale a ogni visita.
export function seeded(seed = 1) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const smoothstep = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
