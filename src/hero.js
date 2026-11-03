import gsap from 'gsap';
import { assetUrl, categoryLabel, spiralPhotos } from './data.js';
import { prefersReducedMotion } from './device.js';

const PAUSE_ICON =
  '<svg viewBox="0 0 10 10" aria-hidden="true"><rect x="1" y="1" width="3" height="8" fill="currentColor"/><rect x="6" y="1" width="3" height="8" fill="currentColor"/></svg>';
const PLAY_ICON = '<svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 1l7 4-7 4z" fill="currentColor"/></svg>';

// Divide il titolo in lettere e le fa entrare una alla volta, poi fa comparire il resto del testo.
export function animateTitle(hero) {
  const title = hero.querySelector('.hero-title');
  const text = title.textContent.trim();

  // I lettori di schermo leggono il titolo intero, non le singole lettere.
  title.setAttribute('aria-label', text);
  title.innerHTML = text
    .split(' ')
    .map((word) => {
      const letters = [...word].map((letter) => `<span class="ch">${letter}</span>`).join('');
      return `<span class="word" aria-hidden="true">${letters}</span>`;
    })
    .join(' ');

  if (prefersReducedMotion) return;

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

// Pulsante per mettere in pausa e riprendere l'animazione della spirale.
export function setupPauseButton(button, stage) {
  if (!stage) {
    button.remove();
    return;
  }

  function update() {
    const paused = stage.state.paused;
    const label = paused ? 'Riprendi animazione' : 'Pausa animazione';
    button.innerHTML = `${paused ? PLAY_ICON : PAUSE_ICON}<span>${label}</span>`;
    button.setAttribute('aria-pressed', String(paused));
  }

  button.addEventListener('click', () => {
    stage.state.paused = !stage.state.paused;
    update();
  });
  update();
}

// Etichetta con il nome del progetto che segue il puntatore sopra una foto della spirale.
export function photoLabel(element) {
  let currentProject = null;

  return {
    show(project, x, y) {
      if (project !== currentProject) {
        currentProject = project;
        const place = project.place ? ` · ${project.place}` : '';
        element.innerHTML = `<small>${categoryLabel(project.category)}${place}</small>${project.title}`;
      }
      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
      element.classList.add('is-on');
    },
    hide() {
      currentProject = null;
      element.classList.remove('is-on');
    },
  };
}

// Se il browser non supporta WebGL, al posto della spirale mette un collage di foto ferme.
export function showFallbackCollage(hero) {
  const collage = document.createElement('div');
  collage.className = 'hero-fallback';
  collage.setAttribute('aria-hidden', 'true');
  collage.innerHTML = spiralPhotos(8)
    .map((photo) => `<img src="${assetUrl(photo.srcset[800])}" alt="" loading="lazy" />`)
    .join('');
  hero.prepend(collage);
}
