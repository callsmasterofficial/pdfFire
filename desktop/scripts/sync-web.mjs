/**
 * Copies the site's static export into desktop/web, which the app serves over
 * its own scheme. Kept as an explicit step so it is obvious that the desktop
 * app ships a specific build rather than reaching into the parent tree at run
 * time.
 */
import { cp, rm, stat, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = path.resolve(here, '..', '..', 'out');
const target = path.resolve(here, '..', 'web');

try {
  const info = await stat(source);
  if (!info.isDirectory()) throw new Error('not a directory');
} catch {
  console.error(
    `No web build at ${source}.\n` +
      'Run "npm run build" in the site root first; the desktop app ships that export.'
  );
  process.exit(1);
}

const entries = await readdir(source);
if (!entries.includes('index.html')) {
  console.error(`${source} has no index.html — that export looks incomplete.`);
  process.exit(1);
}

await rm(target, { recursive: true, force: true });
await cp(source, target, { recursive: true });

console.log(`Synced ${entries.length} top-level entries from out/ into desktop/web/`);
