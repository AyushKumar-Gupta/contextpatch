import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { resolveLocalImport } from '../src/analyzers/module.resolver.js';

test('ignores package imports', () => {
  const result = resolveLocalImport('/repo/src/app.js', 'express');
  assert.equal(result.local, false);
  assert.equal(result.resolved, true);
});

test('resolves relative imports with a JS extension', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'contextpatch-'));
  try {
    fs.mkdirSync(path.join(dir, 'src'));
    fs.writeFileSync(path.join(dir, 'src', 'helper.js'), 'export const ok = true;');
    const result = resolveLocalImport(path.join(dir, 'src', 'app.js'), './helper');
    assert.equal(result.local, true);
    assert.equal(result.resolved, true);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('reports unresolved relative imports', () => {
  const result = resolveLocalImport('/repo/src/app.js', './missing-file');
  assert.equal(result.local, true);
  assert.equal(result.resolved, false);
});
