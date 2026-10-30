// Pagina per Alessia: header, spirale, servizi e lavori. Chi sono e
// contatti non ci sono ancora: quei link mostrano "coming soon". L'easter egg
// si apre dal puntino dell'occhiello e da ogni pulsante del preventivo.
import { createStage } from '../three/stage.js';
import { buildSpiral } from '../scenes/spiral.js';
import { renderSections, goToProject } from '../shared/sections.js';
import { introTitle, motionToggle, fallbackCollage } from '../shared/hero.js';
import { comingSoon } from '../shared/soon.js';
import { easterEgg } from '../shared/easter.js';

const hero = document.querySelector('#hero');
renderSections(document.querySelector('#content'), ['servizi', 'lavori']);
introTitle(hero);
comingSoon(document);
easterEgg(hero.querySelector('.egg'));
document
  .querySelectorAll('[data-egg], [data-service]')
  .forEach((el) => easterEgg(el, { title: 'Mi hai beccato', note: '' }));
const stage = createStage(hero.querySelector('.hero-stage'), { fov: 30 });
motionToggle(hero, stage);
if (stage) buildSpiral(stage, hero, { onPick: (project) => goToProject(project.slug) });
else fallbackCollage(hero);
