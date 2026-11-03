import data from './data/photos.json';

export const { photographer, categories, projects } = data;

const PRIVATE_CATEGORIES = ['ricorrenze', 'maternita'];

// Indirizzo di un file in public/, valido anche quando il sito sta in una sottocartella.
export function assetUrl(path) {
  return import.meta.env.BASE_URL + path;
}

// Etichetta leggibile di una categoria, es. "food" -> "Food & locali".
export function categoryLabel(id) {
  return categories.find((category) => category.id === id).label;
}

// Dice se una categoria è dei privati (famiglie) o delle aziende.
export function areaOf(categoryId) {
  return PRIVATE_CATEGORIES.includes(categoryId) ? 'privati' : 'aziende';
}

// Sceglie le foto della spirale: prima la prima foto di ogni progetto, poi la seconda,
// e così via, così i temi si alternano. I progetti con minori hanno hero: false.
export function spiralPhotos(count) {
  const pool = projects.filter((project) => project.hero);
  const photos = [];
  for (let i = 0; i < 4; i++) {
    for (const project of pool) {
      if (photos.length === count) return photos;
      if (project.photos[i]) photos.push({ ...project.photos[i], project });
    }
  }
  return photos;
}
