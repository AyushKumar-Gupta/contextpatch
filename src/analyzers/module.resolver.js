import fs from 'node:fs';
import path from 'node:path';

const EXTENSIONS = ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx'];

export function resolveLocalImport(importerPath, importSource) {
  if (!importSource.startsWith('.')) return { local: false, resolved: true, candidates: [] };
  const base = path.resolve(path.dirname(importerPath), importSource);
  const candidates = [base, ...EXTENSIONS.map((ext) => `${base}${ext}`), ...EXTENSIONS.map((ext) => path.join(base, `index${ext}`))];
  const match = candidates.find((candidate) => {
    try { return fs.statSync(candidate).isFile(); } catch { return false; }
  });
  return { local: true, resolved: Boolean(match), path: match ?? null, candidates };
}
