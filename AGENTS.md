# AGENTS.md

<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

## Mission And Standard

This is the root operating guide for agents working in the 6529 frontend repo.
Use it with the user's request, the current diff, and the codebase evidence in
front of you. The goal is scoped, correct work that can survive review.

- Make the smallest coherent change that satisfies the request.
- Ground claims in code, configs, tests, docs, logs, screenshots, PR comments, or
  CI output. Do not present guesses as facts.
- Preserve unrelated user or agent work. Never revert changes you did not make
  unless the user explicitly asks for that exact revert.
- Prefer existing patterns over new abstractions. Add abstraction only when it
  removes real duplication or matches an established local pattern.
- Keep public artifacts free of local paths, usernames, tokens, machine names,
  hidden prompts, and private environment details.
- If a task is durable or cross-turn, keep local working notes under `.codex/`
  or an approved `ops/workstreams/` location, and commit only files that belong
  in the requested change.

## Required Load Order

Before planning or editing, read in this order:

1. Root `AGENTS.md`, then any nested `AGENTS.md` under paths you will touch.
2. The user's request, issue, PR thread, CI failure, or local error output.
3. `git status --short --branch` and the relevant diff. Identify unrelated
   changes before touching files.
4. The implementation source of truth: relevant routes, components, hooks,
   services, contexts, stores, configs, tests, and generated-source inputs.
5. `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, and relevant package metadata
   when they affect the touched area.
6. Relevant pages under `ops/docs/`, treating them as useful user-facing docs
   that may lag the code.
7. Relevant repo-local skills under `ops/skills/`.

Use `rg` and `rg --files` for repo search unless unavailable.

## Repo Map

- `app/`: Next.js 16 App Router routes, layouts, route handlers, metadata,
  loading/error boundaries, and route-local client/server splits.
- `components/`: shared UI and feature components. Many stateful UI boundaries
  are Client Components.
- `components/react-query-wrapper/ReactQueryWrapper.tsx`: central React Query
  key enum, cache seeding, invalidation, and optimistic update helpers.
- `services/api/`: API client modules. `services/api/common-api.ts` is the
  standard fetch wrapper for auth headers, staging auth, error handling, and
  mobile launch timing.
- `services/auth/` and `components/auth/`: wallet auth, JWT/refresh-token state,
  profile switching, Reown/AppKit, wagmi, and viem integration.
- `generated/`: OpenAPI-generated models and clients. Do not hand-edit; update
  the source spec and regenerate.
- `config/`, `next.config.ts`, and `proxy.ts`: runtime env validation and
  baking, shared Next config, security headers, image policy, Sentry wrapping,
  redirects, access control, and request routing.
- `hooks/`, `contexts/`, `store/`, `helpers/`, `lib/`, `utils/`, `entities/`,
  `types/`: shared behavior, app state, domain helpers, monitoring utilities,
  and type boundaries.
- `styles/` and `public/`: global styles and static assets.
- `scripts/`: app build, quality, generated-code, package, and wrapper tooling
  used by `package.json` and `6529`.
- `standalone/`: separate standalone surfaces. Inspect their local configs
  before assuming main-app behavior applies.
- `ops/docs/`: current user-facing product documentation.
- `ops/skills/`: repo-local agent skills and their scripts/references/assets.
- `ops/scripts/`: operational scripts for docs maintenance and agent workflows;
  keep app runtime/build scripts in top-level `scripts/` when existing tooling
  expects them there.
- `__tests__/`, `tests/`, `e2e/`: Jest/unit/integration tests and Playwright E2E.

Do not turn route inventory into duplicate documentation here. Use this map to
find the correct source of truth.

## Command Rules

All project commands must go through the repo-local `6529` wrapper.

- Fresh shell setup: `./bin/6529 bootstrap` when needed.
- Install dependencies: `6529 install`.
- Add dependencies: `6529 add <package>` or `6529 add -D <package>`.
- Run app: `6529 run dev`. The default local app port is `3001`.
- Run scripts: `6529 run <script>`.
- Do not use plain `pnpm install`, `pnpm dev`, `npm run ...`,
  `npx react-doctor`, or direct package scripts outside the wrapper.
- Do not bypass `scripts/require-6529-command.cjs` guards.
- Treat format/fix/codegen commands as mutating. Run them only when needed,
  inspect the diff afterward, and stage only intended files.

## Git And Worktrees

- This repo requires Developer Certificate of Origin signoffs.
- Before every commit, verify `git config user.name` and `git config user.email`.
- Commit with `git commit -s ...`; do not add a signoff for anyone else.
- Prefer clean worktrees for broad refactors or PRs stacked on another branch.
- Never use destructive git commands on user work unless the user explicitly
  requested that operation.
- If generated files, lockfiles, package metadata, or docs change unexpectedly,
  stop and understand why before committing.

## Frontend Standards

- New and touched user-facing UI should follow
  `ops/standards/frontend-accessibility-wcag-22-aa.md`.
- New and touched user-facing copy, accessible names, dates, numbers, and
  locale-sensitive sorting should follow
  `ops/standards/frontend-i18n-localization.md`.
- New and touched user-facing UI should follow
  `ops/standards/frontend-design-ui-ux.md` for repo-specific visual
  consistency, Tailwind-first styling migration, responsive layout, interaction
  states, media behavior, and browser evidence.
- Use `ops/skills/design-ui-ux/SKILL.md` for frontend design and UX review.
- Use `ops/skills/wcag-22-aa/SKILL.md` for accessibility audits and fixes.
- Use `ops/skills/i18n-localization/SKILL.md` for progressive localization
  work.
- If a touched page is not fully migrated yet, make the touched UI compliant and
  record remaining debt.

## Next.js 16 And App Router

Read the version-matched Next docs before any Next.js change. When the Next MCP
is available, use it; otherwise read the relevant files in
`node_modules/next/dist/docs/`.

- Pages and layouts are Server Components by default. Keep server code on the
  server, keep secrets out of client bundles, and make Client Component
  boundaries as narrow as practical.
- Add `"use client"` only where state, effects, event handlers, browser APIs,
  React context providers, or client-only libraries require it. Everything
  imported by that module enters the client graph.
- `useSearchParams` is a Client Component hook. On statically prerendered routes,
  wrap the smallest component that uses it in `Suspense`. For server data or
  initial render decisions, prefer the Page `searchParams` prop and pass plain
  values down.
- If a route intentionally needs request-time rendering, use the documented
  dynamic rendering path, such as `connection()` in a Server Component, and make
  the choice explicit.
- `metadata` and `generateMetadata` are Server Component exports only. Do not
  export both from the same segment. Use `components/providers/metadata.ts`
  `getAppMetadata()` for app-consistent title, description, Open Graph, Twitter,
  staging-domain, and version metadata.
- Route handlers live in `app/**/route.ts`. They cannot share the same route
  segment with `page.tsx`, are not layouts, and are not cached by default unless
  explicitly opted in for supported `GET` cases.
- `proxy.ts` runs before routes. Any matcher, redirect, auth, static bypass, or
  `/my-stream` behavior change can affect app access and static assets; test it
  directly.
- Check `next.config.ts`, `config/nextConfig.ts`, `config/env.schema.ts`,
  `config/env.ts`, and `config/runtimeConfig.ts` before changing env, runtime,
  build, image, asset prefix, Sentry, or security-header behavior.
- Bootstrap Sass must be imported as `@use "bootstrap/scss/bootstrap"` through
  `sassOptions.loadPaths` with `quietDeps: true`. Do not change it to a relative
  `../node_modules/bootstrap/...` import; that makes Sass treat Bootstrap as
  first-party source and re-enables Bootstrap's Dart Sass deprecation warnings.
  If Bootstrap partial resolution conflicts with another package, fix that
  resolver ambiguity without bypassing dependency classification.

## Architecture Boundaries

- Generated API models come from `openapi.yaml` through `6529 run generate`.
  Regenerate instead of editing `generated/` by hand.
- New API calls should normally use `services/api/common-api.ts` helpers so
  staging auth, wallet JWT auth, URL construction, structured errors, abort
  handling, and monitoring stay consistent.
- React Query cache keys and broad invalidation live in
  `components/react-query-wrapper/ReactQueryWrapper.tsx`. Reuse `QueryKey` and
  existing invalidation/update helpers before creating new cache patterns.
- Auth and wallet state use cookies plus guarded local storage in
  `services/auth/auth.utils.ts` and `components/auth/SeizeConnectContext.tsx`.
  Handle wallet addresses with `viem` validation/checksumming patterns already
  present in the repo.
- Server-side fetch behavior can be affected by `lib/fetch/ssrFetch`, imported
  as a side effect in `app/layout.tsx`.
- Security headers and CSP live in `config/securityHeaders.ts`; image host
  policy lives in `config/nextConfig.ts`. External fetch, proxy, iframe, media,
  wallet/RPC, and preview changes need security review.
- Monitoring paths include `components/monitoring/AwsRumProvider.tsx`,
  `instrumentation-client.ts`, `instrumentation.ts`, Sentry config files, and
  sanitizer/filter utilities under `utils/`. Sentry Replay is opt-in because it
  can capture sensitive user content.
- Respect strict TypeScript settings in `tsconfig.json` and focused excludes in
  `tsconfig.typecheck.json`. Do not expand `any`, `ts-ignore`, eslint disables,
  or noisy suppressions without a clear reason.

## Docs And Skills

- User-facing docs live under `ops/docs/`. Update them when visible behavior,
  routes, loading/empty/error states, or user workflows change.
- Treat `ops/docs/` as curated product docs, not a complete source of truth.
  Compare docs against `app/**/page.tsx`, `app/**/route.ts`, components, API
  helpers, tests, and configs before making behavior claims.
- Repo-local skills live under `ops/skills/`. Use:
  - `ops/skills/6529-autonomous-manager/SKILL.md` for durable workstream
    ownership.
  - `ops/skills/write-prs/SKILL.md` for PR descriptions, bot iteration, merge
    gates, and deploy gates.
  - `ops/skills/commit-docs-updater/SKILL.md` for user-facing docs updates.
  - `ops/skills/design-ui-ux/SKILL.md` for frontend design and UX review.
  - `ops/skills/react-doctor/SKILL.md` for React, Next.js, hook, routing, or UI
    state changes.
  - `ops/skills/sonar-guardrails/SKILL.md` for TS/JS quality-sensitive edits.
  - `ops/skills/write-skills/SKILL.md` for repo-local skill work.
- For merge, staging, production, or release-lane work, read
  `ops/docs/developer/deployment-bus-process.md` and
  `ops/skills/deploy-6529/SKILL.md` before acting.
- Operational plans, roadmaps, runbooks, workstream state, and agent process
  docs belong under `ops/`, not top-level `docs/`.
- Operational scripts belong under `ops/scripts/`; app build/runtime scripts
  stay under top-level `scripts/` when existing tooling expects them there.

## Validation Matrix

Prefer focused checks first. Escalate based on blast radius.

- Docs-only or `AGENTS.md` changes: `git diff --check`, scan new links, and run
  docs validators when touching `ops/docs/` structure or links.
- TypeScript/React changes: `6529 run lint:changed` and
  `6529 run typecheck:changed`.
- Broader changed-file validation: `6529 run check:changed`.
- React, Next.js, JSX, TSX, hooks, routing, or UI state: also run
  `6529 run react-doctor:diff` when available.
- Unit/integration behavior: targeted `6529 run test -- <pattern>`.
- Playwright/user flows: `6529 run test:e2e` or a targeted Playwright run. The
  Playwright config starts `./bin/6529 run dev` on port `3001`.
- Build-time, generated models, Next config, env/runtime config, proxy, routing,
  deploy packaging, or dependency changes: `6529 run build`.
- Docs maintenance: use validators under `ops/skills/commit-docs-updater/scripts/`
  or `ops/scripts/` when those docs areas are touched.

If a check cannot run, report the exact command, why it did not run, and what
manual or narrower validation was performed instead.

## PR And Bot Workflow

- Use `ops/skills/write-prs/SKILL.md` for PR title/body format, review-ready vs
  merge/deploy modes, bot iteration, and readiness decisions.
- If the user did not explicitly request merge or deployment, stop at
  review-ready.
- PR bodies must include the issue, fix, notable changes, validation, risk, and
  review notes when relevant.
- Do not include absolute local paths, drive letters, OS usernames, private
  URLs, secrets, hidden prompts, or large raw logs in PR text.
- After pushing a PR, inspect comments, review threads, and checks on the latest
  head. CodeRabbit, Claude, DCO, Snyk, SonarCloud, and CodeQL may appear, but
  any individual bot may be absent.
- Fix valid bot feedback with focused signed follow-up commits. Defer only when
  a finding is wrong, inapplicable, duplicative, or lower value than the churn;
  explain the rationale briefly.
- Do not call a PR bot-happy while unresolved high-confidence correctness,
  security, privacy, accessibility, performance, or CI findings remain.

## Security And Privacy

- Never commit `.env` files, secrets, tokens, cookies, private keys, production
  data, or local machine details.
- Public security issues do not belong in public issues or PRs; follow
  `SECURITY.md`.
- Keep SSR-only secrets on the server. Be careful with `next.config.ts` `env`,
  `PUBLIC_RUNTIME`, and `NEXT_PUBLIC_*`, because exposed values can enter the
  client bundle.
- Scrutinize changes to external fetches, URL parsing, previews, proxy behavior,
  CSP, image/media hosts, iframe sources, wallet/RPC flows, file uploads, and
  analytics/monitoring payloads.
- Keep Sentry `sendDefaultPii` disabled and Sentry Replay disabled unless the
  user and reviewers explicitly approve the privacy impact.
