# Contributing to ContextPatch

Thanks for helping make developer tooling more transparent and useful.

## Before you start
- Check existing issues and open a new issue for larger changes.
- Keep pull requests focused and explain the problem being solved.
- Do not include private, proprietary, or sensitive source code in tests or examples.

## Development

```powershell
npm install
npm test
npm run dev
```

## Contribution principles
1. **Evidence first:** findings should include a traceable file/line or clearly state that evidence is insufficient.
2. **No invented facts:** never infer a missing file, function, or dependency as certain without evidence.
3. **Human control:** do not silently edit, delete, or apply patches to a user's repository.
4. **Privacy:** keep analysis local by default; clearly disclose any external service.
5. **Tests:** add a regression test for behavior changes.
6. **Scope:** the current MVP targets JavaScript and TypeScript repositories.

## Pull request checklist
- [ ] I tested the change with `npm test`.
- [ ] I added/updated tests where appropriate.
- [ ] I documented limitations and behavior.
- [ ] I did not include secrets or private code.
- [ ] The change does not automatically modify a scanned repository.
