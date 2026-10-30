import manifest from '../data/photos.json';

export const { photographer, categories, projects } = manifest;

// Due pubblici diversi: famiglie da una parte, locali e aziende dall'altra.
export const AREAS = {
  privati: {
    label: 'Privati',
    title: 'Ricorrenze e maternità',
    blurb: 'Diciottesimi, pre-parto, battesimi, comunioni e lauree: le giornate da ricordare, raccontate con calma e luce naturale.',
    categories: ['ricorrenze', 'maternita'],
    services: ['Diciottesimi', 'Pre-parto', 'Battesimi e comunioni', 'Lauree'],
    cover: '18-giusy',
  },
  aziende: {
    label: 'Aziende',
    title: 'Food, locali ed eventi',
    blurb: 'Piatti, cocktail, cantine e serate per ristoranti, bar e brand che vogliono farsi vedere come sono davvero.',
    categories: ['food', 'eventi', 'territorio'],
    services: ['Food e locali', 'Serate ed eventi', 'Cantine', 'Stampe live'],
    cover: 'rivera-cantina',
  },
};

export const categoryById = Object.fromEntries(categories.map((c) => [c.id, c]));

export const areaOf = (categoryId) =>
  Object.keys(AREAS).find((key) => AREAS[key].categories.includes(categoryId));

export const asset = (path) => import.meta.env.BASE_URL + path;

export const projectBySlug = (slug) => projects.find((p) => p.slug === slug);

// Foto per la hero, alternando i progetti così i temi si mescolano.
// Solo le prime foto di ogni serie e solo i progetti con hero: true
// (battesimo e comunione restano fuori: ci sono minori).
export function heroPhotos(count, perProject = 4) {
  const pool = projects.filter((p) => p.hero);
  const out = [];
  for (let i = 0; i < perProject; i++) {
    for (const project of pool) {
      if (out.length === count) return out;
      if (project.photos[i]) out.push({ ...project.photos[i], project });
    }
  }
  return out;
}
