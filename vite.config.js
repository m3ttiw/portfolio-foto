import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { instagramImport } from './scripts/instagram-import.js';

export default defineConfig({
  // Percorsi relativi: il sito funziona anche dentro una sottocartella, come su GitHub Pages.
  base: './',
  server: { port: 5180 },
  plugins: [instagramImport(import.meta.dirname)],
  build: {
    // three.js da solo pesa circa 600 kB.
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      input: {
        index: resolve(import.meta.dirname, 'index.html'),
        alessia: resolve(import.meta.dirname, 'bozza-alessia.html'),
      },
    },
  },
});
