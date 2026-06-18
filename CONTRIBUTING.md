# Contributing

Thank you for helping improve the 6529seize frontend. This project is a large
production application, so the best contributions are focused, accurate, and
easy for maintainers to review.

Agents and automated coding tools should also follow [AGENTS.md](AGENTS.md).

## Contributor Certificate of Origin

This repository uses Developer Certificate of Origin signoffs on contributor
commits.

Before committing, confirm that Git is configured with your intended developer
identity:

```bash
git config --get user.name
git config --get user.email
```

Create commits with `git commit -s ...` so Git adds a `Signed-off-by:` trailer
from your configured `user.name` and `user.email`.

Do not add a `Signed-off-by:` trailer for another person.

## Local Setup

Use the repo-local `6529` wrapper for project commands. Do not use plain
`pnpm install`, `pnpm dev`, or `npm run ...`; repository scripts intentionally
require the `6529` command path.

From a fresh clone:

```bash
./bin/6529 bootstrap
```

Open a new shell, or activate the wrapper in the current shell:

```bash
source <(./bin/6529 bootstrap --print-export)
```

Install dependencies:

```bash
6529 install
```

Create a local `.env` file from [.env.sample](.env.sample), then start the app:

```bash
6529 run dev
```

The default app port is `3001`.

## Development Workflow

- Create a topic branch for each focused change.
- Follow existing patterns before introducing new abstractions.
- Keep changes scoped to the requested behavior.
- Add dependencies only through `6529 add <package>` or
  `6529 add -D <package>`.
- Avoid editing generated files directly unless regenerating them from source.
- Update user-facing documentation under `ops/docs/` when user-visible behavior
  changes.
- For new or touched frontend UI, follow the accessibility and localization
  standards in [ops/standards](ops/standards/README.md). Do not add new
  accessibility or i18n debt when a touched surface can reasonably meet the
  standard.

Useful commands:

```bash
6529 run dev
6529 run build
6529 run test
6529 run test:e2e
6529 run lint:changed
6529 run typecheck:changed
6529 run check:changed
```

Use focused checks for narrow changes. Use `6529 run build` when changes touch
build-time behavior, generated API models, Next.js configuration, routing, or
deployment-sensitive code.

## Generated Files

The OpenAPI source is [openapi.yaml](openapi.yaml). Generated TypeScript models
live in `generated/` and are produced by:

```bash
6529 run generate
```

If generated output changes, include the source change and the regenerated
files in the same pull request so reviewers can verify the relationship.

## Pull Requests

Before opening a pull request:

- Confirm the branch contains only the intended changes.
- Run the focused checks relevant to your change.
- Include docs updates for user-visible behavior changes.
- Make sure all commits include the DCO signoff.
- Explain the user-visible behavior, test coverage, and any operational impact.

For documentation-only changes, a concise summary plus the relevant Markdown
validation or changed-file checks is usually enough.

## Documentation Style

User-facing documentation should describe current product behavior, not commit
history. Prefer concrete route, action, state, and recovery details over broad
claims.

Start at [ops/docs/README.md](ops/docs/README.md) to find the canonical area for the
behavior you are changing.
