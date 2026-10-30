// Scarica le foto dei progetti da Behance e prepara le versioni per il sito.
// Uso: npm run photos
//
// Fonte: content/projects.json (id delle immagini di ogni progetto Behance).
// Uscita: public/photos/<slug>/<nn>-<larghezza>.webp e src/data/photos.json.
// Le foto stanno nel sito: il CDN di Behance non manda gli header CORS,
// quindi non si possono usare come texture WebGL.

import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CDN = 'https://mir-s3-cdn-cf.behance.net/project_modules/1400_webp/';
// 480: texture delle card piccole; 800: griglia e card grandi; 1400: foto intera.
const WIDTHS = [480, 800, 1400];

const content = JSON.parse(await readFile(path.join(root, 'content/projects.json'), 'utf8'));
const cacheDir = path.join(root, '.cache/raw');
await mkdir(cacheDir, { recursive: true });

const exists = (p) => access(p).then(() => true, () => false);

async function download(id) {
  const file = path.join(cacheDir, id.replace(/\.(jpg|png)$/, '.webp'));
  if (await exists(file)) return file;
  const res = await fetch(CDN + id);
  if (!res.ok) throw new Error(`${id}: HTTP ${res.status}`);
  await writeFile(file, Buffer.from(await res.arrayBuffer()));
  return file;
}

const projects = [];
for (const project of content.projects) {
  const outDir = path.join(root, 'public/photos', project.slug);
  await mkdir(outDir, { recursive: true });
  const photos = [];
  for (const [i, id] of project.photos.entries()) {
    const raw = await download(id);
    const meta = await sharp(raw).metadata();
    const name = String(i + 1).padStart(2, '0');
    const srcset = {};
    for (const w of WIDTHS) {
      const out = path.join(outDir, `${name}-${w}.webp`);
      const width = Math.min(w, meta.width);
      if (!(await exists(out))) {
        await sharp(raw).resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toFile(out);
      }
      srcset[w] = `photos/${project.slug}/${name}-${w}.webp`;
    }
    photos.push({ srcset, w: meta.width, h: meta.height });
  }
  projects.push({
    slug: project.slug,
    title: project.title,
    place: project.place ?? null,
    category: project.category,
    hero: project.hero !== false,
    behance: `https://www.behance.net/gallery/${project.behance}`,
    photos,
  });
  console.log(`${project.slug}: ${photos.length} foto`);
}

const manifest = {
  photographer: content.photographer,
  categories: content.categories,
  projects,
};
await writeFile(path.join(root, 'src/data/photos.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(`Fatto: ${projects.length} progetti in src/data/photos.json`);
