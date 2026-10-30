import { asset } from './data.js';

// Easter egg: un selfie di Alessia con una pioggia di cuori viola. Una sola
// dialog per pagina; ogni pulsante che la apre può avere la sua scritta.
// Esc, la X o un click fuori la chiudono.
let dialog;

function eggDialog() {
  if (dialog) return dialog;
  dialog = document.createElement('dialog');
  dialog.className = 'egg-dialog';
  dialog.setAttribute('aria-label', 'Alessia dietro l’obiettivo');
  dialog.innerHTML = `
    <div class="egg-hearts" aria-hidden="true"></div>
    <figure>
      <img src="${asset('photos/easter/alessia.webp')}" width="720" height="1280" alt="Selfie di Alessia che manda un bacio, con gli occhiali e gli occhi al cielo" />
      <figcaption></figcaption>
    </figure>
    <button class="egg-close" type="button" aria-label="Chiudi">×</button>`;
  document.body.append(dialog);
  dialog.querySelector('.egg-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  return dialog;
}

function rain(box) {
  box.innerHTML = Array.from({ length: 18 }, (_, i) => {
    const x = Math.round(Math.random() * 100);
    const delay = (Math.random() * 1.2).toFixed(2);
    const size = 14 + Math.round(Math.random() * 18);
    const hue = ['#8b5cf6', '#c4b5fd', '#6366f1', '#a78bfa'][i % 4];
    return `<i style="left:${x}%;animation-delay:${delay}s;font-size:${size}px;color:${hue}">♥</i>`;
  }).join('');
}

export function easterEgg(trigger, { title = 'Mi hai trovata!', note = 'Dietro l’obiettivo, quando nessuno mi fotografa.' } = {}) {
  if (!trigger) return;
  const d = eggDialog();
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    d.querySelector('figcaption').innerHTML =
      `${title} <span aria-hidden="true">💜</span>${note ? `<small>${note}</small>` : ''}`;
    rain(d.querySelector('.egg-hearts'));
    d.showModal();
  });
}
