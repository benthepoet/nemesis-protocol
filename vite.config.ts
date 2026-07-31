import path from 'node:path';
import { cpSync, existsSync, mkdirSync, statSync, createReadStream } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';

const ASSET_ROOT = path.resolve(__dirname, 'assets');

function mimeFor(file: string): string {
  if (file.endsWith('.glb')) return 'model/gltf-binary';
  if (file.endsWith('.png')) return 'image/png';
  if (file.endsWith('.ogg')) return 'audio/ogg';
  return 'application/octet-stream';
}

/** Serve `assets/models` + `assets/textures` at `/assets/…` in dev; copy into dist on build. */
function nemesisAssetsPlugin(): Plugin {
  return {
    name: 'nemesis-assets',
    configureServer(server) {
      server.middlewares.use('/assets', (req, res, next) => {
        const raw = req.url?.split('?')[0] ?? '';
        const rel = raw.replace(/^\//, '');
        const file = path.join(ASSET_ROOT, rel);
        if (!file.startsWith(ASSET_ROOT) || !existsSync(file) || !statSync(file).isFile()) {
          next();
          return;
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', mimeFor(file));
        createReadStream(file).pipe(res);
      });
    },
    closeBundle() {
      const out = path.resolve(__dirname, 'dist/assets');
      for (const sub of ['models', 'textures', 'audio'] as const) {
        const src = path.join(ASSET_ROOT, sub);
        if (!existsSync(src)) continue;
        mkdirSync(path.join(out, sub), { recursive: true });
        cpSync(src, path.join(out, sub), { recursive: true });
      }
    },
  };
}

export default defineConfig({
  root: '.',
  plugins: [nemesisAssetsPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
