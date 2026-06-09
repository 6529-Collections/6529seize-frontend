# AGENTS.md

## Git

- This repository uses Developer Certificate of Origin signoffs on contributor commits.
- When creating commits in this repo, use `git commit -s ...` so Git adds a `Signed-off-by:` trailer from the configured `user.name` and `user.email`.
- Before committing, verify the configured Git identity is the intended developer identity.
- Do not add a `Signed-off-by:` trailer for another person.

## Development

- Use the repo-local `6529` wrapper for project commands.
- Do not use plain `pnpm install`, `pnpm dev`, or `npm run ...`; repo scripts intentionally require the `6529` command path.
- Install dependencies with `6529 install`.
- Add dependencies with `6529 add <package>` or `6529 add -D <package>`.
- Run the app with `6529 run dev`. The default app port is `3001`.

## Verification

- Prefer focused checks for the files or behavior changed.
- Useful commands include `6529 run lint:changed`, `6529 run typecheck:changed`, `6529 run check:changed`, and targeted `6529 run test -- <pattern>` runs.
- Use `6529 run build` when changes touch build-time behavior, generated API models, Next.js config, routing, or deployment-sensitive code.

## Code Style

- Follow existing patterns before introducing new abstractions.
- Keep changes scoped to the requested behavior.
- Avoid editing generated files directly unless regenerating them from source.
- User-facing documentation lives under `docs/`; update it when user-visible behavior changes.
