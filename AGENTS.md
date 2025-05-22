# AGENTS.md – Codex Configuration for Next.js Frontend

## Setup
```bash
npm install
```

## Test

```bash
npm run test
```

## Lint & Format

```bash
npm run lint
```

## Type Check

```bash
npm run type-check
```

## Programmatic Checks

Before completing any task, ensure the following commands succeed:

```bash
npm run test
npm run lint
npm run type-check
```

* `npm run test`: Run the full test suite and verify that all changed files have at least 80% test coverage.
* `npm run lint`: Ensure code adheres to linting rules.
* `npm run type-check`: Verify TypeScript type checking passes with `tsc --noEmit -p tsconfig.json`.

If `npm run test` reports any file below 80% coverage, write additional tests to meet the threshold. Repeat this process until all checks pass.

## Coding Conventions

* Use TypeScript and React functional components with hooks.
* Follow existing code style and naming conventions.
* Place tests in `__tests__` directories or alongside components as `ComponentName.test.tsx`.
* Mock external dependencies and APIs in tests.

## Commit Guidelines

* Follow [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat:`, `fix:`).
* Do not squash commits; maintain a clear history.
* Each commit should represent a single logical change.
