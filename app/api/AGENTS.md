# AGENTS.md – API Route Guidelines

This document supplements the root `AGENTS.md` with conventions specific to
files under `app/api/`.

## External Requests & SSRF Protection

- **Never call `fetch` directly with user-controlled or scraped URLs.** Use the
  helpers from `@/lib/security/urlGuard` (`parsePublicUrl`, `assertPublicUrl`,
  `fetchPublicUrl`, `fetchPublicJson`) so every hop is validated against our
  host/IP allowlists and DNS checks before we touch the network.
- When you need custom headers or timeouts, pass them via the helper options
  rather than re-implementing your own wrapper.
- Catch `UrlGuardError` explicitly if you want to return a tailored response,
  otherwise let it bubble so the caller can surface the correct status code.

## Adding or Modifying Routes

- Export the HTTP verb handlers (e.g. `GET`) from `route.ts` files, keeping the
  logic in small internal functions when it grows beyond ~200 lines.
- For edge caching behaviour, prefer `export const dynamic = "force-dynamic";`
  or `revalidate` constants rather than inline headers.
- Use TypeScript types for request parameters and responses; avoid `any` unless
  a 3rd-party payload truly has no shape guarantees.
- Follow the project default responses (`NextResponse.json`) and reuse existing
  util modules instead of duplicating logic.

## Quality Gates

- All changes must pass the same commands listed in the top-level `AGENTS.md`:
  `npm run test` and `npm run lint`.
