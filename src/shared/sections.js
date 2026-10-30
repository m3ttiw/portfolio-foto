import { AREAS, asset, areaOf, categoryById, photographer, projectBySlug, projects } from './data.js';

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
      const cats = area.categories.map((id) => `<li>${categoryById[id].label}</li>`).join('');
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
        <h2 id="servizi-title">Due strade, <em>uno sguardo</em></h2>
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
        <a href="${p.behance}" target="_blank" rel="noopener">
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
        <span class="todo">Testo di prova, da scrivere con Alessia</span>
        <p class="section-kicker">Chi sono</p>
        <h2 id="chi-sono-title" class="visually-hidden">Chi sono</h2>
        <p>Sono Alessia, fotografo persone e luoghi in Puglia, partendo da Molfetta.</p>
        <p>Cerco la luce vera e i momenti che succedono da soli: la tensione prima di una festa, le mani di uno chef, una pancia che aspetta. Lavoro con le famiglie per le loro ricorrenze e con locali e aziende che vogliono immagini oneste del loro lavoro.</p>
      </div>
    </div>
  </section>`;
}

function contactSection() {
  const [behanceA, behanceB] = photographer.behance;
  return `
  <section class="section" id="contatti" aria-labelledby="contatti-title">
    <div class="contact" data-reveal-scroll>
      <div>
        <p class="section-kicker">Contatti</p>
        <h2 id="contatti-title">Raccontami cosa vuoi <em>fotografare</em></h2>
        <p class="contact-lead">Scrivimi la data, la città e il tipo di servizio: ti rispondo con una proposta e un preventivo.</p>
        <div class="contact-links">
          <a class="btn btn-primary" href="#contatti" data-todo="numero WhatsApp">WhatsApp</a>
          <a class="btn" href="#contatti" data-todo="email">Email</a>
          <a class="btn" href="${behanceA}" target="_blank" rel="noopener">Behance</a>
          <a class="btn" href="${behanceB}" target="_blank" rel="noopener">Behance ritratti</a>
        </div>
      </div>
      <form class="form" novalidate>
        <label>Nome<input name="nome" autocomplete="name" required /></label>
        <label>Telefono o email<input name="contatto" autocomplete="email" required /></label>
        <label>Servizio
          <select name="servizio">
            <option value="privati">Privati: ricorrenze e maternità</option>
            <option value="aziende">Aziende: food, locali, eventi</option>
          </select>
        </label>
        <label>Data e città<input name="quando" placeholder="es. 14 marzo, Trani" /></label>
        <label class="full">Messaggio<textarea name="messaggio"></textarea></label>
        <label class="full consent"><input type="checkbox" required /> Acconsento al trattamento dei dati per essere ricontattata/o.</label>
        <button class="btn btn-primary full" type="submit" style="justify-self:start">Richiedi un preventivo</button>
        <p class="form-note" role="status" hidden>Bozza: l'invio del form non è ancora collegato.</p>
      </form>
    </div>
  </section>
  <footer class="site-footer">
    <span>© 2026 ${photographer.name} · ${photographer.place}</span>
    <nav aria-label="Profili">
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
  root.querySelectorAll('[data-service]').forEach((a) =>
    a.addEventListener('click', () => (root.querySelector('select[name="servizio"]').value = a.dataset.service)),
  );
  return apply;
}

function wireForm(root) {
  const form = root.querySelector('.form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
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

export function renderSections(root) {
  root.innerHTML = pathsSection() + worksSection() + aboutSection() + contactSection();
  applyFilter = wireFilters(root);
  wireForm(root);
  revealOnScroll(root);
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
