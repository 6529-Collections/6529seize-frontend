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

Before completing any coding task, ensure the following commands succeed. For a
quicker check when your changes are small, you may run
`npm run test:cov:changed` to execute tests only for files changed since `main`:

```bash
npm run test
npm run lint
npm run type-check
```

Note: When changing files like readme.md, agents.md or other documentation or in general tasks that aren't supposed to have tests, then there's no need to run tests for that task.

- `npm run test`: Executes all Jest tests and checks code coverage. The command will fail if:
  - Any Jest test fails.
  - Any file modified since diverging from the `main` branch (including uncommitted changes) has less than 80% line coverage.
- `npm run test:cov:changed`: Runs Jest only on files changed since `main`, still enforcing the 80% coverage threshold.
- `npm run lint`: Ensure code adheres to linting rules.
- `npm run type-check`: Verify TypeScript type checking passes with `tsc --noEmit -p tsconfig.json`.

If `npm run test` fails due to low coverage on a modified file, write meaningful tests that verify the file's functionality and bring its coverage to at least 80%. If a Jest test fails, debug and fix the underlying code or the test itself, ensuring the code behaves as expected and tests accurately reflect its intended functionality. Repeat this process until `npm run test` passes.

## Codex Workspace

Use the `/codex/` directory as the shared source of truth for planning and ticket execution.

- Start every workstream by reviewing `codex/STATE.md` and keeping its ticket rows in sync with the matching files under `codex/tickets/`.
- Author new tickets with the provided template, maintain alphabetical YAML front matter, and log timestamped updates as work progresses.
- Capture broader planning artefacts in `codex/plans/` and evergreen documentation in `codex/docs/`, following the conventions spelled out in `codex/agents.md` and `codex/docs/README.md`.
- Link pull requests back to their tickets and mirror merged PR references in both the ticket log and `STATE.md` so the board stays auditable.
- Never edit tickets marked **Done**; open a fresh ticket if new scope emerges.

## Coding Conventions

- Use TypeScript and React functional components with hooks.
- Follow existing code style and naming conventions.
- Adhere to clean code standards as measured by SonarQube.
- Place tests in `__tests__` directories or alongside components as `ComponentName.test.tsx`.
- Mock external dependencies and APIs in tests.
- When parsing Seize URLs or similar app-specific links, do not fall back to placeholder origins (e.g., `https://example.com`); fail fast if the configured base origin is unavailable.

## Next.js Directory Structure

All production routes now live under the Next.js `app/` router.
The legacy `pages/` directory has been fully migrated, so add any new routes
under `app/`.

Routes in `app/` should export a `generateMetadata` function using the helper
`getAppMetadata`:

```ts
import { getAppMetadata } from "@/components/providers/metadata";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({ title: "My Page" });
}
```

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
