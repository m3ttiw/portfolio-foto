import { setupContactForm } from './contact.js';
import { setupEasterEgg } from './easter-egg.js';
import { animateTitle, setupPauseButton, showFallbackCollage } from './hero.js';
import { createSpiral } from './scene/spiral.js';
import { createStage } from './scene/stage.js';
import { renderWorks, setupFilters, showProject } from './works.js';

const hero = document.querySelector('#hero');

renderWorks(document.querySelector('.works'));
setupFilters();
setupContactForm();
setupEasterEgg();
revealOnScroll();
animateTitle(hero);

const stage = createStage(hero.querySelector('.hero-stage'));
setupPauseButton(hero.querySelector('.motion-toggle'), stage);
if (stage) {
  createSpiral(stage, hero, { onPhotoClick: (project) => showProject(project.slug) });
} else {
  showFallbackCollage(hero);
}

// Fa comparire le sezioni quando entrano nello schermo.
function revealOnScroll() {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  document.querySelectorAll('[data-reveal-scroll]').forEach((element) => observer.observe(element));
}
