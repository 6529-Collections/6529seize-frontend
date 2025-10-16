# Identity Tab Server Data Flow

This directory renders the profile **Identity** tab. The route now relies on
Next.js server preparation to gather all identity data before handing off to
client widgets.

## Server Preparation

- `app/[user]/identity/_lib/identityTabQueries.ts` derives the initial NIC
  activity log, raters tables, and CIC statements using a single `fetchIdentityTabData`
  call. The helper normalises the handle, applies default filters, and returns
  safe empty structures whenever an upstream request fails.
- The same helper surfaces `cache` hints (identity-specific `revalidateSeconds`
  and cache tags) plus a typed `errors` collection so callers can plug into
  `revalidateTag` strategies or add logging without duplicating fallback logic.
- The `prepare` hook inside `app/[user]/identity/page.tsx` injects this payload
  into the tab props so that the layout, hydrator, and client components can
  render immediately without issuing duplicate requests.

## Hydration

- `UserPageIdentityHydrator` calls `initProfileIdentityPage` once to seed the
  React Query cache with activity logs, raters, and statements. The React Query
  wrapper now records statements alongside the other caches, removing the extra
  `useEffect` that previously wrote statements separately.

## Client Components

- `UserPageIdentity`, `ProfileActivityLogs`, and `ProfileRatersTableWrapper`
  receive server-populated `initialData` and query params through props. As a
  result, the first paint is fully server rendered and client hooks only take
  over once the user interacts (pagination, filters, mutations).

## Testing Notes

- `__tests__/app/identityTabQueries.test.ts` validates the query helper’s
  normalisation logic and failure fallbacks.
- `__tests__/components/react-query-wrapper/ReactQueryWrapper.test.tsx`
  covers the cache priming performed by `initProfileIdentityPage`.
- `__tests__/app/identityPageSSR.test.tsx` exercises the Next.js page factory,
  ensuring prefetched identity payloads flow into the layout, hydrator, and
  wrapper props without requiring client re-fetches.
