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

Dependencies, including `@6529-collections/release-request`, come from public
npm. No package token or private-registry setup is required. Install the exact
lockfile through the existing secure wrapper:

```bash
6529 ci
```

See
[pnpm and Socket Firewall](ops/docs/developer/pnpm-and-socket-firewall.md) for
the package command boundary and dependency security checks.

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
6529 run typecheck:tests
6529 run lint:changed
6529 run typecheck:changed
6529 run check:changed
```

`lint:changed` runs the tight ESLint rules through `eslint.config.diff.mjs`,
reporting only lines changed from the branch's merge base with `origin/main`.
Legacy violations on untouched lines do not block a focused contribution.

E2E selectors have a separate gate: `6529 run lint:e2e-selectors` checks all
JavaScript and TypeScript under `tests/` and `e2e/`, including helpers and TSX.
Start element queries with `getByRole`, `getByLabel`, or another Playwright
`getBy*` query; `getByTestId` is also supported, though it does not establish
accessibility. CSS/XPath narrowing may follow that query in the same chain,
for example `page.getByRole("button", { name: "Save" }).locator("svg")`.
Standalone `html`, `body`, `head`, and `meta[name="..."]` or
`meta[property="..."]` selectors are explicit document-state exceptions.

The gate reads existing violations from the Git merge base with `origin/main`
(CI supplies its exact base SHA). It allows only the same call text and count
in the same file. New or duplicated calls in an old file fail; deleted calls
lose their allowance once merged. Moving a call to another file or changing
its formatting requires migrating that call too. There is no editable legacy
allowlist, and inline ESLint disables cannot bypass this gate. The rule checks
direct `.locator()` calls regardless of receiver name, including template and
dynamic arguments; it does not perform Page type inference or resolve method
aliases. Keep narrowing in a direct accessible chain so the scope is visible
to both readers and the rule. Run `6529 run test:e2e-selectors` when changing
this policy.

Same-repository PRs run both selector commands in the installed quality lane.
Fork PRs retain the existing untrusted-PR policy and skip installed app checks;
run the commands locally and validate the contribution on a maintainer-owned
branch before merging. This gate does not expand dependency execution on forks.

Use focused checks for narrow changes. Use `6529 run build` when changes touch
build-time behavior, generated API models, Next.js configuration, routing, or
deployment-sensitive code.

### Test Type Safety

Production, Jest, and Playwright code use separate TypeScript checks. Run the
complete test-code check with:

```bash
6529 run typecheck:tests
```

The Jest command compares current diagnostics with a per-file debt baseline:

```bash
6529 run typecheck:jest
```

Inspect the current dependency-sensitive diagnostic classification without
changing the baseline:

```bash
6529 run typecheck:jest --inventory
```

The baseline is tied to the pinned TypeScript version, lockfile, and TypeScript
configs. It is an observed compatibility snapshot, not a permanent error-count
claim. When a change removes existing Jest diagnostics or legitimately refreshes
an unchanged toolchain result, lock the result into the same PR:

```bash
6529 run typecheck:jest:update-baseline
```

The update command refuses any per-file increase or a newly affected file.
Fix new diagnostics instead of widening the baseline.

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
