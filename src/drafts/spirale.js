// Bozza A · Spirale: la scena della spirale con le sezioni del sito sotto.
import { createStage } from '../three/stage.js';
import { buildSpiral } from '../scenes/spiral.js';
import { renderSections, goToProject } from '../shared/sections.js';
import { introTitle, motionToggle, fallbackCollage } from '../shared/hero.js';

const hero = document.querySelector('#hero');
renderSections(document.querySelector('#content'));
introTitle(hero);
const stage = createStage(hero.querySelector('.hero-stage'), { fov: 30 });
motionToggle(hero, stage);
if (stage) buildSpiral(stage, hero, { onPick: (project) => goToProject(project.slug) });
else fallbackCollage(hero);
if (import.meta.env.DEV) window.__stage = stage;
