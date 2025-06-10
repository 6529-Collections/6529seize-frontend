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

- `npm run test`: Executes all Jest tests and checks code coverage. The command will fail if:
  - Any Jest test fails.
  - Any file modified since diverging from the `main` branch (including uncommitted changes) has less than 80% line coverage.
- `npm run lint`: Ensure code adheres to linting rules.
- `npm run type-check`: Verify TypeScript type checking passes with `tsc --noEmit -p tsconfig.json`.

If `npm run test` fails due to low coverage on a modified file, write meaningful tests that verify the file's functionality and bring its coverage to at least 80%. If a Jest test fails, debug and fix the underlying code or the test itself, ensuring the code behaves as expected and tests accurately reflect its intended functionality. Repeat this process until `npm run test` passes.

## Coding Conventions

- Use TypeScript and React functional components with hooks.
- Follow existing code style and naming conventions.
- Place tests in `__tests__` directories or alongside components as `ComponentName.test.tsx`.
- Mock external dependencies and APIs in tests.

## Commit Guidelines

- Follow [Conventional Commits](https://www.conventionalcommits.org/) (e.g., `feat:`, `fix:`)
- Do not squash commits; maintain a clear history
- Each commit should represent a single logical change
- Add a Developer Certificate of Origin (DCO) signature to every commit message footer:

  - **Must use your real GitHub-connected identity** (no generic/placeholder emails like `codex@openai.com`)
  - Format:
    ```
    Signed-off-by: Your Full Name <your-GH-ID+username@users.noreply.github.com>
    ```
  - Example:

    ```
    feat: add user authentication middleware

    Signed-off-by: Jane Developer <12345+jane-dev@users.noreply.github.com>
    ```
