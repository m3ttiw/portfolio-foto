import * as THREE from 'three';
import { assetUrl } from '../data.js';

// Converte un colore "#rrggbb" in un vettore per lo shader, senza correzioni di colore:
// le texture sono lette così come sono, quindi le foto arrivano a schermo con i loro colori.
export function hexToVector(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

const vertexShader = /* glsl */ `
  uniform vec2 uPress;   // punto sotto il puntatore
  uniform float uBulge;  // quanto la card si gonfia verso la camera in quel punto
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 p = position;
    float d = length(p.xy - uPress);
    p.z += uBulge * exp(-d * d * 7.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uAspect;
  uniform float uBlur;    // sfocatura di profondità
  uniform float uAlpha;
  uniform float uAber;    // aberrazione cromatica ai bordi
  uniform float uRadius;  // raggio degli angoli
  uniform vec3 uFog;      // colore dello sfondo, per le card lontane
  uniform float uFogMix;
  uniform float uFrame;   // cornice bianca quando la card è sotto il puntatore
  varying vec2 vUv;

  // Punti attorno al pixel da cui prendere il colore per sfocare.
  const vec2 TAPS[12] = vec2[12](
    vec2(-0.326, -0.406), vec2(-0.840, -0.074), vec2(-0.696, 0.457),
    vec2(-0.203, 0.621), vec2(0.962, -0.195), vec2(0.473, -0.480),
    vec2(0.519, 0.767), vec2(0.185, -0.893), vec2(0.507, 0.064),
    vec2(0.896, 0.412), vec2(-0.322, -0.933), vec2(-0.792, -0.598)
  );

  // Distanza dal bordo di un rettangolo con gli angoli arrotondati.
  float roundedBox(vec2 p, vec2 size, float radius) {
    vec2 q = abs(p) - size + radius;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  }

  void main() {
    vec3 color;
    if (uBlur > 0.0006) {
      // Sfocatura: media di 13 punti, ruotati in modo diverso per ogni pixel.
      float angle = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.545) * 6.2832;
      mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
      float bias = clamp(log2(1.0 + uBlur * 260.0), 0.0, 5.0);
      vec2 radius = vec2(1.0 / uAspect, 1.0) * uBlur;
      vec3 sum = texture2D(uMap, vUv, bias).rgb;
      for (int i = 0; i < 12; i++) {
        sum += texture2D(uMap, clamp(vUv + rotation * TAPS[i] * radius, 0.002, 0.998), bias).rgb;
      }
      color = sum / 13.0;
    } else {
      // Foto nitida: rosso e blu leggermente spostati verso i bordi.
      vec2 d = vUv - 0.5;
      vec2 shift = d * dot(d, d) * 4.0 * uAber;
      color = vec3(
        texture2D(uMap, vUv + shift).r,
        texture2D(uMap, vUv).g,
        texture2D(uMap, vUv - shift).b
      );
    }
    color = mix(color, uFog, uFogMix);

    // Angoli arrotondati e cornice sottile sullo stesso bordo.
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
    float edge = roundedBox(p, vec2(uAspect, 1.0) * 0.5, uRadius);
    float pixel = max(fwidth(edge), 1e-5);
    float inside = 1.0 - smoothstep(-pixel, pixel, edge);
    float frame = (1.0 - smoothstep(pixel * 0.5, pixel * 1.8, abs(edge + pixel * 1.4))) * uFrame;
    color = mix(color, vec3(1.0), frame);

    gl_FragColor = vec4(color, inside * uAlpha);
  }
`;

// Crea una card per una foto: un piano alto 1 e largo quanto il rapporto della foto,
// poi scalato a `height`. La texture si carica dopo, con loadCardTextures.
export function createCard(photo, { height, fogColor }) {
  const aspect = photo.w / photo.h;
  const uniforms = {
    uMap: { value: null },
    uAspect: { value: aspect },
    uBlur: { value: 0 },
    uAlpha: { value: 0 },
    uAber: { value: 0.012 },
    uRadius: { value: 0.035 },
    uFog: { value: hexToVector(fogColor) },
    uFogMix: { value: 0 },
    uFrame: { value: 0 },
    uPress: { value: new THREE.Vector2(99, 99) },
    uBulge: { value: 0 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(aspect, 1, 14, 14), material);
  mesh.scale.setScalar(height);
  mesh.visible = false;
  return { mesh, uniforms, photo, aspect, height, ready: false };
}

// Carica le foto delle card (versione da 480 px), sei alla volta e in ordine,
// così le prime card compaiono subito. Ogni card diventa visibile appena ha la sua foto.
export async function loadCardTextures(cards, renderer) {
  const loader = new THREE.TextureLoader();
  const maxAnisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  let next = 0;

  async function loadNext() {
    while (next < cards.length) {
      const card = cards[next++];
      const texture = await loader.loadAsync(assetUrl(card.photo.srcset[480])).catch(() => null);
      if (!texture) continue;
      texture.anisotropy = maxAnisotropy;
      card.uniforms.uMap.value = texture;
      card.ready = true;
      card.mesh.visible = true;
    }
  }

  await Promise.all([loadNext(), loadNext(), loadNext(), loadNext(), loadNext(), loadNext()]);
}
