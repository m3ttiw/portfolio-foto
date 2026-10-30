import { AREAS, asset, areaOf, categoryById, photographer, projectBySlug, projects } from './data.js';
import { easterEgg } from './easter.js';

const srcset = (photo) =>
  Object.entries(photo.srcset)
    .map(([w, src]) => `${asset(src)} ${Math.min(Number(w), photo.w)}w`)
    .join(', ');

const img = (photo, alt, sizes, eager = false) => {
  const h = Math.round((Math.min(800, photo.w) / photo.w) * photo.h);
  return `<img src="${asset(photo.srcset[800])}" srcset="${srcset(photo)}" sizes="${sizes}"
    width="${Math.min(800, photo.w)}" height="${h}" alt="${alt}" ${eager ? '' : 'loading="lazy" decoding="async"'} />`;
};

const altFor = (project) => {
  const cat = categoryById[project.category].label.toLowerCase();
  return `${project.title}${project.place ? ', ' + project.place : ''}: servizio ${cat} di ${photographer.name}`;
};

function pathsSection() {
  const cards = Object.entries(AREAS)
    .map(([key, area]) => {
      const cover = projectBySlug(area.cover).photos[0];
      const cats = area.services.map((s) => `<li>${s}</li>`).join('');
      return `
      <article class="path" data-reveal-scroll>
        ${img(cover, '', '(min-width: 820px) 50vw, 100vw')}
        <span class="path-label">${area.label}</span>
        <h3>${area.title}</h3>
        <p>${area.blurb}</p>
        <ul>${cats}</ul>
        <div class="path-actions">
          <a class="btn btn-small" href="#lavori" data-filter-link="${key}">Vedi i lavori</a>
          <a class="btn btn-primary btn-small" href="#contatti" data-service="${key}">Chiedi un preventivo</a>
        </div>
      </article>`;
    })
    .join('');
  return `
  <section class="section" id="servizi" aria-labelledby="servizi-title">
    <div class="section-head">
      <div>
        <p class="section-kicker">Cosa fotografo</p>
        <h2 id="servizi-title">Per te <em>o per il tuo locale</em></h2>
      </div>
    </div>
    <div class="paths">${cards}</div>
  </section>`;
}

function worksSection() {
  const items = projects
    .map((p) => {
      const cat = categoryById[p.category].label;
      return `
      <article class="work" data-slug="${p.slug}" data-area="${areaOf(p.category)}" data-reveal-scroll>
        <a href="${p.link}" target="_blank" rel="noopener">
          <div class="work-media">${img(p.photos[0], altFor(p), '(min-width: 1000px) 33vw, (min-width: 560px) 50vw, 100vw')}</div>
          <div class="work-meta">
            <div>
              <h3>${p.title}</h3>
              <p>${cat}${p.place ? ' · ' + p.place : ''}</p>
            </div>
          </div>
        </a>
      </article>`;
    })
    .join('');
  return `
  <section class="section" id="lavori" aria-labelledby="lavori-title">
    <div class="section-head">
      <div>
        <p class="section-kicker">Lavori</p>
        <h2 id="lavori-title">Storie <em>recenti</em></h2>
      </div>
      <div class="filters" role="group" aria-label="Filtra i lavori">
        <button class="chip" type="button" data-filter="tutti" aria-pressed="true">Tutti</button>
        <button class="chip" type="button" data-filter="privati" aria-pressed="false">Privati</button>
        <button class="chip" type="button" data-filter="aziende" aria-pressed="false">Aziende</button>
      </div>
    </div>
    <div class="works">${items}</div>
  </section>`;
}

function aboutSection() {
  return `
  <section class="section" id="chi-sono" aria-labelledby="chi-sono-title">
    <div class="about" data-reveal-scroll>
      <div class="about-photo">Ritratto di Alessia</div>
      <div>
        <p class="section-kicker">Chi sono</p>
        <h2 id="chi-sono-title" class="visually-hidden">Chi sono</h2>
        <p class="about-lead">Sono Alessia, fotografo persone e luoghi in Puglia, partendo da Molfetta.</p>
        <p>Cerco la luce vera e i momenti che succedono da soli: la tensione prima di una festa, le mani di uno chef, una pancia che aspetta. Lavoro con le famiglie per le loro ricorrenze e con locali e aziende che vogliono immagini oneste del loro lavoro.</p>
      </div>
    </div>
  </section>`;
}

function contactSection() {
  const [behanceA, behanceB] = photographer.behance;
  return `
  <section class="section section-contact" id="contatti" aria-labelledby="contatti-title">
    <div class="contact-bg" aria-hidden="true">
      <div class="contact-bg-stage">
        ${[1, 2, 3]
          .map(
            (n) => `<img src="${asset(`photos/contatti/reflex-${n}-1600.webp`)}"
              srcset="${asset(`photos/contatti/reflex-${n}-900.webp`)} 900w, ${asset(`photos/contatti/reflex-${n}-1600.webp`)} 1600w"
              sizes="100vw" alt="" loading="lazy" decoding="async" />`,
          )
          .join('')}
      </div>
    </div>
    <div class="contact" data-reveal-scroll>
      <div>
        <p class="section-kicker">Contatti</p>
        <h2 id="contatti-title">Raccontami cosa vuoi <em>fotografare</em></h2>
        <p class="contact-lead">Dimmi che servizio ti serve, quando e dove: ti rispondo con una proposta e un preventivo, di solito entro un giorno.</p>
        <div class="contact-links">
          <a class="btn btn-primary" href="#contatti" data-todo="numero WhatsApp">WhatsApp</a>
          <a class="btn" href="#contatti" data-todo="email">Email</a>
          <a class="btn" href="${photographer.instagram}" target="_blank" rel="noopener">Instagram</a>
          <a class="btn" href="${behanceA}" target="_blank" rel="noopener">Behance</a>
        </div>
      </div>
      <form class="form" novalidate>
        <fieldset>
          <legend>I tuoi dati</legend>
          <label class="full">Nome e cognome *<input name="nome" autocomplete="name" required /></label>
          <label>Telefono *<input name="telefono" type="tel" autocomplete="tel" inputmode="tel" required /></label>
          <label>Email<input name="email" type="email" autocomplete="email" /></label>
          <div class="full choice" role="radiogroup" aria-label="Come preferisci essere ricontattata/o">
            <span>Preferisci essere ricontattata/o su</span>
            <label><input type="radio" name="ricontatto" value="whatsapp" checked /> WhatsApp</label>
            <label><input type="radio" name="ricontatto" value="telefono" /> Telefono</label>
            <label><input type="radio" name="ricontatto" value="email" /> Email</label>
          </div>
        </fieldset>

        <fieldset>
          <legend>Il servizio</legend>
          <label class="full">Tipo di servizio *
            <select name="servizio" required>
              <option value="">Scegli…</option>
              <optgroup label="Privati" data-area="privati">
                <option>Diciottesimo</option>
                <option>Pre-parto / maternità</option>
                <option>Battesimo</option>
                <option>Comunione</option>
                <option>Laurea</option>
                <option>Altra ricorrenza o festa privata</option>
              </optgroup>
              <optgroup label="Aziende" data-area="aziende">
                <option>Food e menu</option>
                <option>Locale e ambienti</option>
                <option>Cantina o prodotto</option>
                <option>Evento aziendale o serata</option>
                <option>Altro per aziende</option>
              </optgroup>
            </select>
          </label>
          <label>Persone o ospiti, circa<input name="persone" type="number" min="1" inputmode="numeric" placeholder="es. 80" /></label>
          <label>Budget indicativo
            <select name="budget">
              <option value="">Preferisco parlarne</option>
              <option>Fino a 300 €</option>
              <option>300 – 600 €</option>
              <option>600 – 1.000 €</option>
              <option>Oltre 1.000 €</option>
            </select>
          </label>
          <label class="full check"><input type="checkbox" name="stampe_live" /> Vorrei le stampe live durante l'evento</label>
        </fieldset>

        <fieldset>
          <legend>Quando</legend>
          <label>Data *<input name="data" type="date" required /></label>
          <label>Orario di inizio<input name="ora" type="time" /></label>
          <label class="full check"><input type="checkbox" name="data_da_definire" /> La data non è ancora decisa</label>
        </fieldset>

        <fieldset>
          <legend>Dove</legend>
          <label class="full">Indirizzo o nome del luogo *<input name="indirizzo" autocomplete="street-address" placeholder="es. Villa Senses, via … 12" required /></label>
          <label>Città *<input name="citta" autocomplete="address-level2" list="citta-puglia" required /></label>
          <label>Provincia
            <select name="provincia" autocomplete="address-level1">
              <option>Bari</option>
              <option>Barletta-Andria-Trani</option>
              <option>Brindisi</option>
              <option>Foggia</option>
              <option>Lecce</option>
              <option>Taranto</option>
              <option>Fuori Puglia</option>
            </select>
          </label>
          <datalist id="citta-puglia">
            <option>Molfetta</option><option>Bari</option><option>Giovinazzo</option><option>Bisceglie</option>
            <option>Trani</option><option>Barletta</option><option>Andria</option><option>Terlizzi</option>
            <option>Ruvo di Puglia</option><option>Corato</option><option>Altamura</option><option>Monopoli</option>
          </datalist>
        </fieldset>

        <fieldset>
          <legend>Altro</legend>
          <label class="full">Raccontami cosa hai in mente<textarea name="messaggio" placeholder="Atmosfera, momenti da non perdere, se ti servono stampe o un album…"></textarea></label>
          <label class="full">Come mi hai conosciuta
            <select name="fonte">
              <option value="">—</option>
              <option>Instagram</option>
              <option>Behance</option>
              <option>Passaparola</option>
              <option>Google</option>
              <option>Ho visto un tuo servizio a un evento</option>
            </select>
          </label>
          <label class="full check consent"><input type="checkbox" name="privacy" required /> Ho letto l'informativa privacy e acconsento al trattamento dei dati per essere ricontattata/o. *</label>
        </fieldset>

        <button class="btn btn-primary" type="submit">Richiedi un preventivo</button>
        <p class="form-note" role="status" hidden>Bozza: l'invio del form non è ancora collegato.</p>
      </form>
    </div>
    <p class="contact-credit">Sfondo: foto di
      <a href="https://unsplash.com/@sylvester_s" target="_blank" rel="noopener">Sylvester Sabo</a>,
      <a href="https://unsplash.com/@smartphotocourses" target="_blank" rel="noopener">Smart</a> e
      <a href="https://unsplash.com/@alexkall" target="_blank" rel="noopener">Alex Kalligas</a> su Unsplash</p>
  </section>
  <footer class="site-footer">
    <span>© 2026 ${photographer.name}<button class="egg" type="button" aria-label="Una sorpresa">·</button>${photographer.place}</span>
    <nav aria-label="Profili">
      <a href="${photographer.instagram}" target="_blank" rel="noopener">Instagram</a>
      <a href="${behanceA}" target="_blank" rel="noopener">Behance</a>
      <a href="${behanceB}" target="_blank" rel="noopener">Behance ritratti</a>
    </nav>
  </footer>`;
}

function wireFilters(root) {
  const chips = root.querySelectorAll('[data-filter]');
  const works = root.querySelectorAll('.work');
  const apply = (filter) => {
    chips.forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.filter === filter)));
    works.forEach((w) => (w.hidden = filter !== 'tutti' && w.dataset.area !== filter));
  };
  chips.forEach((c) => c.addEventListener('click', () => apply(c.dataset.filter)));
  root.querySelectorAll('[data-filter-link]').forEach((a) =>
    a.addEventListener('click', () => apply(a.dataset.filterLink)),
  );
  // "Chiedi un preventivo" da una delle due strade: il servizio parte dal gruppo giusto.
  root.querySelectorAll('[data-service]').forEach((a) =>
    a.addEventListener('click', () => {
      const option = root.querySelector(`optgroup[data-area="${a.dataset.service}"] option`);
      if (option) option.selected = true;
    }),
  );
  return apply;
}

function wireForm(root) {
  const form = root.querySelector('.form');
  if (!form) return;
  const date = form.elements.data;
  date.min = new Date().toISOString().slice(0, 10);
  // Data da definire: il campo data non è più obbligatorio.
  form.elements.data_da_definire.addEventListener('change', (e) => {
    date.required = !e.target.checked;
    date.disabled = e.target.checked;
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    form.querySelector('.form-note').textContent = "Bozza: l'invio del form non è ancora collegato.";
    form.querySelector('.form-note').hidden = false;
  });
  root.querySelectorAll('[data-todo]').forEach((a) =>
    a.addEventListener('click', (e) => {
      e.preventDefault();
      form.querySelector('.form-note').textContent = `Bozza: manca ancora ${a.dataset.todo}.`;
      form.querySelector('.form-note').hidden = false;
    }),
  );
}

function revealOnScroll(root) {
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('is-in');
          io.unobserve(e.target);
        }
      }),
    { rootMargin: '0px 0px -10% 0px' },
  );
  root.querySelectorAll('[data-reveal-scroll]').forEach((el) => io.observe(el));
}

let applyFilter = () => {};

const SECTIONS = { servizi: pathsSection, lavori: worksSection, 'chi-sono': aboutSection, contatti: contactSection };

// parts: le sezioni da mostrare, nell'ordine (la pagina per Alessia ne usa due).
export function renderSections(root, parts = Object.keys(SECTIONS)) {
  root.innerHTML = parts.map((id) => SECTIONS[id]()).join('');
  applyFilter = wireFilters(root);
  wireForm(root);
  revealOnScroll(root);
  easterEgg(root.querySelector('.egg'));
}

// Dalla hero al progetto nella griglia (click su una foto della scena).
export function goToProject(slug) {
  applyFilter('tutti');
  const el = document.querySelector(`.work[data-slug="${slug}"]`);
  if (!el) return;
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.classList.add('is-flash');
  setTimeout(() => el.classList.remove('is-flash'), 1800);
}
