# AGENTS.md

<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

## Philosophy

This codebase will outlive you. Every shortcut becomes someone else's burden. Every hack compounds into technical debt that slows the whole team down.

You are not just writing code. You are shaping the future of this project. The patterns you establish will be copied. The corners you cut will be cut again.

Fight entropy. Leave the codebase better than you found it.

## Plan Mode

- Make the plan extremely concise. Sacrifice grammar for the sake of concision.
- At the end of each plan, give me a list of unresolved questions to answer, if any.

## Communication

- Prefer short, plain English, simple words, and concrete examples.
- If the user says `word soup`, `simpler`, or asks for basic English, rewrite the answer in simpler terms.

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

## Next.js App Router

- Before using `useSearchParams`, read `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md`.
- `useSearchParams` is a Client Component hook. Do not use it in Server Components.
- Wrap the smallest Client Component that calls `useSearchParams` in `<Suspense fallback={...}>` from its parent/page/layout. Without this, a prerendered page can bail out to client-side rendering or fail production builds.
- If search params are needed for server data or initial rendering, prefer the Page `searchParams` prop and pass plain values down by props.
- If a route must be dynamic, use the documented dynamic rendering path, such as `connection()` in a Server Component, and make that choice explicit in code.

## Code Structure

- Follow existing patterns before introducing new abstractions.
- Keep changes scoped to the requested behavior.
- Avoid editing generated files directly unless regenerating them from source.
- User-facing documentation lives under `docs/`; update it when user-visible behavior changes.
- Keep files short and focused on a single concern.
- Keep functions simple and avoid high branching or deeply nested logic.
- Prefer splitting components and logic into smaller, self-sufficient functions/files.
- Each component, function, and file should be understandable with minimal extra context.
- Prefer `globalThis` over `window` for global object access. Guard browser-only APIs before use, since Next.js code can also run on the server.
- Accessibility: do not attach mouse/keyboard handlers to non-interactive elements (e.g., div/span); use semantic interactive elements (`button`/`Link`) for click actions.
- Accessibility (modals): prefer native `<dialog>` over `role="dialog"` on generic containers.
