# Identity Tab Server Data Flow

This directory renders the profile **Identity** tab. The route now relies on
Next.js server preparation for the fast-to-resolve datasets while delegating
slow activity log calls to the client.

## Server Preparation

- `app/[user]/identity/_lib/identityTabQueries.ts` derives the initial
  raters tables and CIC statements using a single `fetchIdentityTabData`
  call. The helper normalises the handle, applies default filters, and returns
  safe empty structures whenever an upstream request fails. The activity log
  request is intentionally skipped so the slow `profile-logs` endpoint loads on
  the client instead of blocking SSR.
- The same helper surfaces `cache` hints (identity-specific `revalidateSeconds`
  and cache tags) plus a typed `errors` collection so callers can plug into
  `revalidateTag` strategies or add logging without duplicating fallback logic.
- The `prepare` hook inside `app/[user]/identity/page.tsx` injects this payload
  into the tab props so that the layout, hydrator, and client components can
  render immediately without issuing duplicate requests.

## Hydration

- `UserPageIdentityHydrator` calls `initProfileIdentityPage` once to seed the
  React Query cache with raters and statements. The activity log cache seeding
  runs only when server data is provided (e.g. in tests or future optimisations),
  keeping the client fetch path the single source of truth for logs.

## Client Components

- `UserPageIdentity`, `ProfileActivityLogs`, and `ProfileRatersTableWrapper`
  receive server-populated `initialData` where available alongside query params.
  Statements and raters still hydrate immediately, while `ProfileActivityLogs`
  now shows its loading skeleton until the client query resolves.

## Testing Notes

- `__tests__/app/identityTabQueries.test.ts` validates the query helper’s
  normalisation logic and failure fallbacks.
- `__tests__/components/react-query-wrapper/ReactQueryWrapper.test.tsx`
  covers the cache priming performed by `initProfileIdentityPage`.
- `__tests__/app/identityPageSSR.test.tsx` exercises the Next.js page factory,
  ensuring prefetched identity payloads flow into the layout, hydrator, and
  wrapper props without requiring client re-fetches.
