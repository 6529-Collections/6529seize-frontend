# JSON-LD Structured Data Workstream

## Charter

Implement page-specific schema.org JSON-LD for high-value public 6529 routes,
covering P0 and P1 structured-data scope from the June 2026 site audit.

## Owned Paths

- `lib/structured-data/**`
- `app/page.tsx`
- `app/the-memes/[id]/page.tsx`
- `app/meme-lab/[id]/page.tsx`
- `app/nextgen/token/[token]/[[...view]]/page.tsx`
- `app/nextgen/collection/[collection]/[[...view]]/page.tsx`
- `app/[user]/_lib/userTabPageFactory.tsx`
- `app/waves/waves-page.shared.tsx`
- focused tests for structured-data builders

## Constraints

- Use the repo-local `6529` wrapper for project commands.
- Preserve unrelated worktree changes.
- Do not edit generated files directly.
- Use CC0 license metadata for Meme Cards, Meme Lab, and NextGen.
- Leave Gradient license metadata blank.

## Validation Bar

- Focused unit tests for JSON-LD builders and script escaping.
- `6529 run lint:changed`
- `6529 run typecheck:changed` or stronger if needed
- `6529 run react-doctor:diff` because routes/TSX are touched.
