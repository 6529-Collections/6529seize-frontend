# Runtime Bridge Integration Assumptions

Last updated: 2026-06-17.

## Scope

This note covers the frontend runtime bridge for profile-native CMS sites. It
does not cover builder UX, storage publishing, private editor APIs, wallet
gallery generation, or protocol changes.

## Primary Site API

The frontend runtime bridge expects one public mutable pointer endpoint:

- HTTP: `GET /api/profile-cms/:handle/primary`
- Frontend API client endpoint: `profile-cms/{handle}/primary`
- No primary published CMS site: `404`
- Success envelope:

```ts
{
  package: CmsPackageV1;
  package_id: string;
  version: string;
  package_hash: string;
  payload_hash: string;
  updated_at: string;
  published_at?: string;
}
```

The renderer consumes `package`. The other fields are retained by the adapter
for metadata, diagnostics, and future generated API model alignment.

## Runtime Rules

- `/{handle}` remains the normal 6529 profile page.
- `/{handle}/index.html` resolves the profile's primary CMS package.
- Nested CMS paths such as `/{handle}/collections/foo/index.html` are rendered
  only when the package route manifest declares them.
- Non-`index.html` catch-all profile paths fail closed and do not become CMS
  pages.
- The primary pointer is mutable, so the frontend keeps only a short in-memory
  lookup cache. Immutable hash/version package fetches can be added later.

## Validation And Safety

- API-fetched packages are validated with V1 semantic validation and hash
  enforcement.
- API-fetched packages reject fixture signatures and fixture storage receipts,
  including in production.
- The dev fixture fallback is non-production, opt-in via
  `PROFILE_CMS_RUNTIME_FIXTURE_PRIMARY=true`, and only used when the primary
  endpoint is unavailable.
- Rendered URLs must pass the V1 safe URI scheme contract.
- Rich text is rendered as escaped React text.
- Raw HTML is not executed through `srcdoc` or `dangerouslySetInnerHTML`.
- `html_embed` renders only as a sandboxed iframe when the package explicitly
  declares `interactive_policy.hydration = "sandboxed_embed"` and the asset URI
  is safe.
- The iframe sandbox permission allowlist excludes `allow-same-origin`, so
  package-controlled content cannot combine same-origin and scripts.

## Swap Boundary

All expected backend-envelope assumptions are localized under
`lib/profile-cms/runtime/fetcher.ts`. When generated backend API models land,
the adapter can be replaced without changing the route, renderer, or profile
header contract.
