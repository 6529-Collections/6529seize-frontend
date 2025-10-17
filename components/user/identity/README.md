# Identity Tab Server Data Flow

This directory renders the profile **Identity** tab. The route now orchestrates
its server-side data fetching directly inside
`app/[user]/identity/page.tsx`, streaming each section once its data resolves.

## Server Orchestration

- `IdentityTabContent` (in `app/[user]/identity/page.tsx`) builds the shared
  params via `createIdentityTabParams`, then spins up cached fetchers for
  statements, raters, and the activity log. Each fetch uses a `createResource`
  guard so failures log a warning and fall back to safe defaults instead of
  breaking the stream.
- Suspense boundaries wrap every section, allowing the header to render
  immediately while tables and logs hydrate as their promises settle.

## Hydration

- `UserPageIdentityHydrator` seeds React Query with any preloaded payloads. It
  primes statements and both raters tables, and seeds activity logs only when
  the server run returned data, keeping the client query path authoritative.

## Client Components

- `UserPageIdentityStatements` and `ProfileRatersTableWrapper` remain client
  components so their interactive modals, filters, and pagination stay intact.
  They use the streamed `initialData` to skip redundant refetches.
- `UserPageIdentityActivityLog` still defers to `ProfileActivityLogs`, which
  hydrates from the optional server payload and continues fetching on the
  client when the user filters or paginates.

## Testing Notes

- `__tests__/components/react-query-wrapper/ReactQueryWrapper.test.tsx`
  covers the cache priming performed by `initProfileIdentityPage`.
- `__tests__/app/identityPageSSR.test.tsx` exercises the Identity tab streaming
  flow, ensuring layout props, hydrator payloads, and Suspense boundaries behave
  as expected.
