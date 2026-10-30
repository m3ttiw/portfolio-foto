// Plugin di Vite, solo in sviluppo: riceve dal browser gli indirizzi delle
// foto di un profilo Instagram (raccolti a mano nella pagina dei post) e le
// scarica in .cache/raw-ig/<shortcode>-<nn>.jpg. Gli indirizzi di Instagram
// sono firmati e scadono: le foto vanno importate subito dopo la raccolta.
//
// POST /__import-instagram  { "<shortcode>": { items: [{ u, w, h }], loc } }

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export function instagramImport(root) {
  return {
    name: 'instagram-import',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__import-instagram', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end();
        }
        let body = '';
        for await (const chunk of req) body += chunk;
        const posts = JSON.parse(body);
        const dir = join(root, '.cache/raw-ig');
        await mkdir(dir, { recursive: true });
        const report = {};
        for (const [shortcode, post] of Object.entries(posts)) {
          const items = Array.isArray(post) ? post : post.items;
          const files = [];
          for (const [i, item] of items.entries()) {
            const r = await fetch(item.u, { headers: { referer: 'https://www.instagram.com/' } });
            if (!r.ok) continue;
            const file = `${shortcode}-${String(i + 1).padStart(2, '0')}.jpg`;
            await writeFile(join(dir, file), Buffer.from(await r.arrayBuffer()));
            files.push(file);
          }
          report[shortcode] = { loc: post.loc || '', files };
        }
        await writeFile(join(dir, 'posts.json'), JSON.stringify(report, null, 2) + '\n');
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify(report));
      });
    },
  };
}
