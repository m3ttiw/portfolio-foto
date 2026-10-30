import { asset } from './data.js';

// Easter egg: il puntino del footer apre un selfie di Alessia con una
// pioggia di cuori viola. Esc, la X o un click fuori lo chiudono.
export function easterEgg(trigger) {
  if (!trigger) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'egg-dialog';
  dialog.setAttribute('aria-label', 'Alessia dietro l’obiettivo');
  dialog.innerHTML = `
    <div class="egg-hearts" aria-hidden="true"></div>
    <figure>
      <img src="${asset('photos/easter/alessia.webp')}" width="720" height="1280" alt="Selfie di Alessia che manda un bacio, con gli occhiali e gli occhi al cielo" />
      <figcaption>Mi hai trovata! <span aria-hidden="true">💜</span><small>Dietro l'obiettivo, quando nessuno mi fotografa.</small></figcaption>
    </figure>
    <button class="egg-close" type="button" aria-label="Chiudi">×</button>`;
  document.body.append(dialog);

  const hearts = dialog.querySelector('.egg-hearts');
  const rain = () => {
    hearts.innerHTML = Array.from({ length: 18 }, (_, i) => {
      const x = Math.round(Math.random() * 100);
      const delay = (Math.random() * 1.2).toFixed(2);
      const size = 14 + Math.round(Math.random() * 18);
      const hue = ['#8b5cf6', '#c4b5fd', '#6366f1', '#a78bfa'][i % 4];
      return `<i style="left:${x}%;animation-delay:${delay}s;font-size:${size}px;color:${hue}">♥</i>`;
    }).join('');
  };

  trigger.addEventListener('click', () => {
    rain();
    dialog.showModal();
  });
  dialog.querySelector('.egg-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
}
