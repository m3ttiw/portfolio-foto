// Pagina per Alessia: header, spirale e tutte le sezioni del sito, senza il
// selettore delle bozze. "Richiedi un preventivo" (header e hero) apre
// l'easter egg, come il puntino dell'occhiello e quello del footer.
import { createStage } from '../three/stage.js';
import { buildSpiral } from '../scenes/spiral.js';
import { renderSections, goToProject } from '../shared/sections.js';
import { introTitle, motionToggle, fallbackCollage } from '../shared/hero.js';
import { comingSoon } from '../shared/soon.js';
import { easterEgg } from '../shared/easter.js';

const hero = document.querySelector('#hero');
renderSections(document.querySelector('#content'));
introTitle(hero);
comingSoon(document);
easterEgg(hero.querySelector('.egg'));
document.querySelectorAll('[data-egg]').forEach((el) => easterEgg(el, { title: 'Mi hai beccato', note: '' }));
const stage = createStage(hero.querySelector('.hero-stage'), { fov: 30 });
motionToggle(hero, stage);
if (stage) buildSpiral(stage, hero, { onPick: (project) => goToProject(project.slug) });
else fallbackCollage(hero);
