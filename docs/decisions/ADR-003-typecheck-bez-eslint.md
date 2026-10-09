# ADR-003: Type check in CI, no ESLint

**Status:** accepted · **Date:** 9. 10. 2026

## Context

I wanted a lint step in CI. The project uses TypeScript 7.

## What I found

`npm i -D typescript-eslint` fails with `ERESOLVE`: its peer range is `typescript >=4.8.4 <6.1.0`. The type check (`tsc --noEmit`) on the first run found real problems: 14 errors `TS2729` (Page Objects use a constructor parameter in a field initialiser, which breaks with the modern class-field rules).

## Decision

- Add `tsconfig.json` (strict mode) and `npm run typecheck`, and run it in CI before any test.
- Set `useDefineForClassFields: false` so the Page Objects compile as they run (Playwright transpiles them the same way).
- **No ESLint for now.** Forcing it with `--legacy-peer-deps` would run it on an unsupported compiler, and the result could not be trusted.

## Consequences

- Style problems are not caught automatically. Code review (by me and by the AI) does it.
- Revisit when `typescript-eslint` supports TypeScript 7.
