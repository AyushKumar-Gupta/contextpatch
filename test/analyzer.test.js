import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { analyzeRepository } from '../src/analyzers/repository.analyzer.js';

test('finds a missing local import and reports source evidence', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'contextpatch-analysis-'));
  try {
    fs.writeFileSync(path.join(dir, 'app.js'), "import { helper } from './missing';\nexport function main() { return helper(); }\n");
    const report = analyzeRepository(dir);
    assert.equal(report.summary.filesScanned, 1);
    assert.equal(report.findings.length, 1);
    assert.equal(report.findings[0].type, 'unresolved-local-import');
    assert.equal(report.findings[0].file, 'app.js');
    assert.equal(report.findings[0].line, 1);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('does not flag a valid local import', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'contextpatch-analysis-'));
  try {
    fs.writeFileSync(path.join(dir, 'app.js'), "import { helper } from './helper';\nhelper();\n");
    fs.writeFileSync(path.join(dir, 'helper.js'), 'export function helper() {}\n');
    const report = analyzeRepository(dir);
    assert.equal(report.findings.length, 0);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
