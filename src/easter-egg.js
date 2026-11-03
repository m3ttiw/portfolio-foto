const HEART_COLORS = ['#8b5cf6', '#c4b5fd', '#6366f1', '#a78bfa'];
const FOUND_NOTE = 'Dietro l’obiettivo, quando nessuno mi fotografa.';

// Collega l'easter egg: il selfie di Alessia in una finestra con una pioggia di cuori viola.
// Si apre dai due puntini (occhiello e footer) e dai pulsanti "Richiedi un preventivo" in alto.
export function setupEasterEgg() {
  const dialog = document.querySelector('.egg-dialog');

  document.querySelectorAll('.egg').forEach((dot) => {
    dot.addEventListener('click', () => openEasterEgg(dialog, 'Mi hai trovata!', FOUND_NOTE));
  });
  document.querySelectorAll('[data-egg]').forEach((button) => {
    button.addEventListener('click', () => openEasterEgg(dialog, 'Mi hai beccato'));
  });

  dialog.querySelector('.egg-close').addEventListener('click', () => dialog.close());
  // Un click fuori dalla foto chiude la finestra.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
}

// Apre la finestra con la scritta scelta e fa partire i cuori.
function openEasterEgg(dialog, title, note = '') {
  const small = note ? `<small>${note}</small>` : '';
  dialog.querySelector('figcaption').innerHTML = `${title} <span aria-hidden="true">💜</span>${small}`;
  dialog.querySelector('.egg-hearts').innerHTML = hearts(18);
  dialog.showModal();
}

// Cuori con posizione, ritardo e dimensione a caso.
function hearts(count) {
  let html = '';
  for (let i = 0; i < count; i++) {
    const left = Math.round(Math.random() * 100);
    const delay = (Math.random() * 1.2).toFixed(2);
    const size = 14 + Math.round(Math.random() * 18);
    const color = HEART_COLORS[i % HEART_COLORS.length];
    html += `<i style="left:${left}%;animation-delay:${delay}s;font-size:${size}px;color:${color}">♥</i>`;
  }
  return html;
}
