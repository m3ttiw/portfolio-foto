import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { instagramImport } from './scripts/instagram-import.js';

const page = (name) => resolve(import.meta.dirname, name);

export default defineConfig({
  // Percorsi relativi: il sito funziona anche da una sottocartella (GitHub Pages).
  base: './',
  server: { port: 5180 },
  plugins: [instagramImport(import.meta.dirname)],
  build: {
    // three.js da solo è circa 600 kB: per una bozza va bene così.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      input: {
        index: page('index.html'),
        spirale: page('bozza-spirale.html'),
        corridoio: page('bozza-corridoio.html'),
        muro: page('bozza-muro.html'),
      },
    },
  },
});
