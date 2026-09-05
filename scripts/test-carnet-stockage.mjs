import { build } from 'esbuild';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const sortie = '/tmp/lesfondements-test-stockage.mjs';
await build({ entryPoints: ['scripts/test-carnet-stockage.ts'], outfile: sortie, bundle: true, platform: 'node', format: 'esm', logLevel: 'warning', plugins: [{ name: 'backend-en-memoire', setup(b) {
  b.onResolve({ filter: /^(\.\/parcoursStore|\.\/firebase|firebase\/firestore)$/ }, args => {
    if (args.importer.endsWith('/src/lib/firestore.ts')) return { path: resolve('scripts/fixtures/carnet-backend.ts') };
  });
} }] });
await import(pathToFileURL(sortie).href);
