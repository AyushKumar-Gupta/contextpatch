# ContextPatch AI

**Evidence-first missing-context analysis for JavaScript and TypeScript repositories.** ContextPatch scans a local repository, checks relative imports, surfaces parse errors, and gives developers grounded next steps. An optional local Ollama model can summarize the scan report.

> Early MVP: this is a developer aid, not a proof of correctness. It never edits source files automatically and must not invent evidence.

## Why this project?

Code assistants can struggle when a snippet omits dependencies or repository context. ContextPatch makes a small part of that problem visible: it checks relative imports against files in the repository and shows the evidence behind each finding. It is designed to be extended openly by contributors.

## MVP features

- JavaScript / JSX / TypeScript / TSX source scanning.
- Relative-import resolution for common extensions and `index` files.
- File and line evidence for unresolved local imports.
- Parse-error reporting.
- Read-only analysis: no automatic edits or patch application.
- Optional local-model explanation through Ollama; static analysis works without a model.
- Responsive web interface and automated tests.

## Requirements

- Node.js 18.17 or newer
- npm
- Windows, macOS, or Linux
- Optional: [Ollama](https://ollama.com/) for local model explanations

## Run locally (Windows PowerShell)

```powershell
cd contextpatch-ai
npm install
Copy-Item .env.example .env
npm test
npm start
```

Open `http://localhost:5000`. Enter the absolute path to a JavaScript or TypeScript repository, for example `C:\Users\YourName\Projects\sample-app`.

The repository path is read by the local Node.js server. Only scan folders you own or have permission to inspect. The scanner skips common dependency/build folders and caps the scan at 300 source files (each under 700 KB).

## Optional local AI explanation

1. Install and start [Ollama](https://ollama.com/).
2. Download a compatible coding model, for example:

```powershell
ollama pull qwen2.5-coder:3b
```

3. Set these values in `.env`:

```dotenv
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5-coder:3b
OLLAMA_TIMEOUT_MS=12000
```

4. Restart `npm start` and run an analysis. If Ollama is unavailable, ContextPatch falls back to static results. Model output is treated as an explanation, not verified truth.

## API

### `GET /api/health`

Returns service status and version.

### `POST /api/repository/analyze`

Request:

```json
{
  "repositoryPath": "C:\\Users\\YourName\\Projects\\sample-app"
}
```

Response includes `summary`, `findings`, `parseErrors`, `limitations`, and `ai` status/explanation.

## Architecture

```text
Browser UI
  └── POST /api/repository/analyze
       └── Repository analyzer
            ├── source-file scanner
            ├── Babel parser (JS/TS syntax)
            ├── relative module resolver
            └── evidence-based findings
       └── optional Ollama explanation
```

## Current limitations

- Import aliases such as `@/components`, `tsconfig.paths`, and bundler-specific aliases are not resolved yet.
- Dynamic imports, package exports, monorepo workspace boundaries, runtime dependency injection, and full type checking are not comprehensively analyzed.
- A valid import does not prove that the imported symbol is correct or that the program runs.
- The optional model receives the compact scan report, not arbitrary source-file contents. Treat generated advice cautiously.
- The local path endpoint is intended for a local developer instance. Do not expose this server to untrusted networks without authentication, path restrictions, and additional security review.

## Open-source contribution guide

1. Open or choose an issue and explain the problem you intend to solve.
2. Fork the repository and create a focused branch, e.g. `fix/typescript-paths`.
3. Make a small change with a test.
4. Run `npm test`.
5. Open a pull request describing the evidence, behavior change, and limitations.

Good first issues:
- [ ] Add `tsconfig.json` path-alias resolution with tests.
- [ ] Add a fixture-based test suite for `.tsx` imports.
- [ ] Add JSON report export.
- [ ] Improve keyboard navigation and screen-reader announcements.
- [ ] Add support for `import()` dynamic imports.
- [ ] Add a configurable ignored-directory list.

See [CONTRIBUTING.md](CONTRIBUTING.md), [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md), [SECURITY.md](SECURITY.md), and [LICENSE](LICENSE).

## Try the included demo repository

The `examples/demo-repo/` folder intentionally includes one unresolved local import so you can see what a finding looks like. Start ContextPatch and enter the absolute path to that folder. It is a test fixture, not a production app.
