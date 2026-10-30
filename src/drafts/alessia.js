// Pagina per Alessia: solo header e spirale. I link non portano ancora da
// nessuna parte ("coming soon"); l'easter egg sta nel puntino dell'occhiello.
import { createStage } from '../three/stage.js';
import { buildSpiral } from '../scenes/spiral.js';
import { introTitle, motionToggle, fallbackCollage } from '../shared/hero.js';
import { comingSoon, soonBubble } from '../shared/soon.js';
import { easterEgg } from '../shared/easter.js';

const hero = document.querySelector('#hero');
introTitle(hero);
comingSoon(document);
easterEgg(hero.querySelector('.egg'));
const stage = createStage(hero.querySelector('.hero-stage'), { fov: 30 });
motionToggle(hero, stage);
if (stage) buildSpiral(stage, hero, { onPick: soonBubble() });
else fallbackCollage(hero);
