// Collega il form dei contatti e i pulsanti "Chiedi un preventivo" delle card dei servizi.
export function setupContactForm() {
  const form = document.querySelector('.form');
  const note = form.querySelector('.form-note');
  const date = form.elements.data;

  // Non si può scegliere una data passata.
  date.min = new Date().toISOString().slice(0, 10);

  // Se la data non è ancora decisa, il campo data si disattiva e non è più obbligatorio.
  form.elements.data_da_definire.addEventListener('change', (event) => {
    date.required = !event.target.checked;
    date.disabled = event.target.checked;
  });

  // Il form non è ancora collegato a un servizio di invio: per ora mostra solo un avviso.
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    showNote(note, "Bozza: l'invio del form non è ancora collegato.");
  });

  // WhatsApp ed email non ci sono ancora.
  document.querySelectorAll('[data-todo]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      showNote(note, `Bozza: manca ancora ${link.dataset.todo}.`);
    });
  });

  // "Chiedi un preventivo" da una card dei servizi: il tipo di servizio parte dal gruppo giusto.
  document.querySelectorAll('[data-service]').forEach((link) => {
    link.addEventListener('click', () => {
      form.querySelector(`optgroup[data-area="${link.dataset.service}"] option`).selected = true;
    });
  });
}

// Mostra un messaggio sotto il form.
function showNote(note, text) {
  note.textContent = text;
  note.hidden = false;
}
