import { areaOf, assetUrl, categoryLabel, photographer, projects } from './data.js';

// Riempie la griglia dei lavori: una card per progetto, con la prima foto come copertina.
export function renderWorks(grid) {
  grid.innerHTML = projects.map(workCard).join('');
}

// HTML di una card della griglia.
function workCard(project) {
  const place = project.place ? ` · ${project.place}` : '';
  return `
    <article class="work" data-slug="${project.slug}" data-area="${areaOf(project.category)}" data-reveal-scroll>
      <a href="${project.link}" target="_blank" rel="noopener">
        <div class="work-media">${coverImage(project)}</div>
        <div class="work-meta">
          <div>
            <h3>${project.title}</h3>
            <p>${categoryLabel(project.category)}${place}</p>
          </div>
        </div>
      </a>
    </article>`;
}

// Immagine di copertina con le tre misure (480, 800, 1400): il browser sceglie la più adatta.
function coverImage(project) {
  const photo = project.photos[0];
  const width = Math.min(800, photo.w);
  const height = Math.round((width / photo.w) * photo.h);
  const srcset = Object.entries(photo.srcset)
    .map(([size, src]) => `${assetUrl(src)} ${Math.min(Number(size), photo.w)}w`)
    .join(', ');
  const sizes = '(min-width: 1000px) 33vw, (min-width: 560px) 50vw, 100vw';
  return `<img src="${assetUrl(photo.srcset[800])}" srcset="${srcset}" sizes="${sizes}"
    width="${width}" height="${height}" alt="${altText(project)}" loading="lazy" decoding="async" />`;
}

// Testo alternativo, es. "Plaza, Barletta: servizio food & locali di Alessia Germinario".
function altText(project) {
  const place = project.place ? `, ${project.place}` : '';
  const category = categoryLabel(project.category).toLowerCase();
  return `${project.title}${place}: servizio ${category} di ${photographer.name}`;
}

// Mostra solo i lavori del gruppo scelto: "tutti", "privati" o "aziende".
export function filterWorks(filter) {
  document.querySelectorAll('[data-filter]').forEach((chip) => {
    chip.setAttribute('aria-pressed', String(chip.dataset.filter === filter));
  });
  document.querySelectorAll('.work').forEach((work) => {
    work.hidden = filter !== 'tutti' && work.dataset.area !== filter;
  });
}

// Collega i filtri sopra la griglia e i link "Vedi i lavori" delle due card dei servizi.
export function setupFilters() {
  document.querySelectorAll('[data-filter]').forEach((chip) => {
    chip.addEventListener('click', () => filterWorks(chip.dataset.filter));
  });
  document.querySelectorAll('[data-filter-link]').forEach((link) => {
    link.addEventListener('click', () => filterWorks(link.dataset.filterLink));
  });
}

// Porta al progetto nella griglia e lo evidenzia per un attimo.
export function showProject(slug) {
  filterWorks('tutti');
  const work = document.querySelector(`.work[data-slug="${slug}"]`);
  if (!work) return;
  work.scrollIntoView({ behavior: 'smooth', block: 'center' });
  work.classList.add('is-flash');
  setTimeout(() => work.classList.remove('is-flash'), 1800);
}
