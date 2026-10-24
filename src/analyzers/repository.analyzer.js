import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import { resolveLocalImport } from './module.resolver.js';

const traverse = traverseModule.default ?? traverseModule;
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', '.next', 'vendor']);
const MAX_FILES = 300;
const MAX_FILE_BYTES = 700_000;

function collectFiles(root) {
  const files = [];
  function walk(dir) {
    if (files.length >= MAX_FILES) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (files.length >= MAX_FILES) break;
      if (entry.name.startsWith('.') && entry.name !== '.env') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) walk(full);
      } else if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) {
        try {
          if (fs.statSync(full).size <= MAX_FILE_BYTES) files.push(full);
        } catch { /* Ignore files that disappear during scanning. */ }
      }
    }
  }
  walk(root);
  return files;
}

function parseSource(source, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const plugins = ['jsx', 'classProperties', 'decorators-legacy', 'topLevelAwait'];
  if (['.ts', '.tsx'].includes(ext)) plugins.push('typescript');
  return parse(source, { sourceType: 'unambiguous', sourceFilename: filePath, allowReturnOutsideFunction: true, plugins });
}

function relative(root, file) {
  return path.relative(root, file).split(path.sep).join('/');
}

export function analyzeRepository(repositoryPath) {
  const root = path.resolve(repositoryPath);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) {
    const error = new Error('Repository path does not exist or is not a directory.');
    error.status = 400;
    throw error;
  }

  const files = collectFiles(root);
  const parsedFiles = new Map();
  const findings = [];
  const parseErrors = [];
  let importCount = 0;
  let functionCount = 0;

  for (const file of files) {
    let source;
    try { source = fs.readFileSync(file, 'utf8'); } catch { continue; }
    try {
      const ast = parseSource(source, file);
      const imports = [];
      traverse(ast, {
        ImportDeclaration(p) {
          imports.push({ source: p.node.source.value, line: p.node.loc?.start.line ?? 1, specifiers: p.node.specifiers.map((s) => s.local?.name).filter(Boolean) });
        },
        FunctionDeclaration() { functionCount++; },
        FunctionExpression() { functionCount++; },
        ArrowFunctionExpression() { functionCount++; }
      });
      importCount += imports.length;
      parsedFiles.set(file, { imports, source });
    } catch (error) {
      parseErrors.push({ file: relative(root, file), line: error.loc?.line ?? null, message: error.message.split('\n')[0] });
    }
  }

  for (const [file, item] of parsedFiles) {
    for (const imported of item.imports) {
      const result = resolveLocalImport(file, imported.source);
      if (result.local && !result.resolved) {
        findings.push({
          id: `unresolved-import-${findings.length + 1}`,
          type: 'unresolved-local-import',
          severity: 'high',
          confidence: 'high',
          file: relative(root, file),
          line: imported.line,
          title: `Local import may be missing: ${imported.source}`,
          evidence: `Import declaration at ${relative(root, file)}:${imported.line} points to "${imported.source}", but no matching file was found using common JS/TS extensions or index files.`,
          suggestion: 'Check the relative path, filename casing, file extension, and whether the target file should exist.',
          source: imported.source
        });
      }
    }
  }

  if (files.length === 0) {
    findings.push({ id: 'no-source-files', type: 'insufficient-evidence', severity: 'info', confidence: 'high', file: '.', line: null, title: 'No JavaScript or TypeScript source files found', evidence: 'The scanner did not find files with supported JavaScript/TypeScript extensions outside ignored folders.', suggestion: 'Select a repository containing .js, .jsx, .mjs, .cjs, .ts, or .tsx source files.' });
  }

  return {
    repository: path.basename(root),
    scannedAt: new Date().toISOString(),
    summary: { filesScanned: files.length, filesParsed: parsedFiles.size, importsFound: importCount, functionsFound: functionCount, findings: findings.length, parseErrors: parseErrors.length, truncated: files.length >= MAX_FILES },
    findings,
    parseErrors,
    limitations: [
      'This MVP checks relative imports and syntax parsing; it does not prove program correctness.',
      'Package aliases, custom TypeScript paths, bundler aliases, generated files, and runtime-only dependencies may need project-specific configuration.',
      'A missing-file finding is a signal to investigate, not an automatic code change.'
    ]
  };
}
