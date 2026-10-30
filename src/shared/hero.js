import gsap from 'gsap';
import { asset, categoryById, heroPhotos } from './data.js';

export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isMobile = matchMedia('(max-width: 700px)').matches;

// Titolo lettera per lettera: il testo resta leggibile ai lettori di schermo.
export function introTitle(hero) {
  const title = hero.querySelector('[data-split]');
  const text = title.textContent.trim();
  title.setAttribute('aria-label', text);
  title.innerHTML = text
    .split(' ')
    .map((w) => `<span class="word" aria-hidden="true">${[...w].map((c) => `<span class="ch">${c}</span>`).join('')}</span>`)
    .join(' ');
  if (reducedMotion) return;
  gsap.from(title.querySelectorAll('.ch'), {
    yPercent: 60,
    opacity: 0,
    filter: 'blur(10px)',
    duration: 1.2,
    ease: 'power3.out',
    stagger: 0.04,
    delay: 0.35,
  });
  gsap.from(hero.querySelectorAll('[data-reveal]'), {
    y: 16,
    opacity: 0,
    filter: 'blur(6px)',
    duration: 1,
    ease: 'power3.out',
    stagger: 0.1,
    delay: 0.9,
  });
}

const PAUSE = '<svg viewBox="0 0 10 10" aria-hidden="true"><rect x="1" y="1" width="3" height="8" fill="currentColor"/><rect x="6" y="1" width="3" height="8" fill="currentColor"/></svg>';
const PLAY = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1l7 4-7 4z" fill="currentColor"/></svg>';

export function motionToggle(hero, stage) {
  const button = hero.querySelector('.motion-toggle');
  if (!button || !stage) return button?.remove();
  const render = () => {
    const paused = stage.state.paused;
    button.innerHTML = `${paused ? PLAY : PAUSE}<span>${paused ? 'Riprendi animazione' : 'Pausa animazione'}</span>`;
    button.setAttribute('aria-pressed', String(paused));
  };
  button.addEventListener('click', () => {
    stage.state.paused = !stage.state.paused;
    render();
  });
  render();
}

// Etichetta che segue il puntatore sopra una foto della scena.
export function hoverLabel() {
  const el = document.createElement('div');
  el.className = 'hero-label';
  el.setAttribute('aria-hidden', 'true');
  document.body.append(el);
  let current = null;
  return {
    show(project, x, y) {
      if (current !== project) {
        current = project;
        const cat = categoryById[project.category].label;
        el.innerHTML = `<small>${cat}${project.place ? ' · ' + project.place : ''}</small>${project.title}`;
      }
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.classList.add('is-on');
    },
    hide() {
      current = null;
      el.classList.remove('is-on');
    },
  };
}

// Collage statico per i browser senza WebGL.
export function fallbackCollage(hero) {
  const box = document.createElement('div');
  box.className = 'hero-fallback';
  box.setAttribute('aria-hidden', 'true');
  box.innerHTML = heroPhotos(8)
    .map((p) => `<img src="${asset(p.srcset[800])}" alt="" loading="lazy" />`)
    .join('');
  hero.prepend(box);
}
