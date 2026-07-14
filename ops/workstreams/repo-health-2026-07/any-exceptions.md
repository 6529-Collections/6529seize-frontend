# `any` exceptions ledger

Sites that keep direct `: any` / `as any` deliberately, with one-line
justifications. Everything not listed here is expected to stay at zero; the
debt-ratchet baseline (`scripts/debt-ratchet-baseline.json`, metric
`any_casts`) is the enforcement backstop.

Current floor: `any_casts` = 0.

## Current exceptions

| Site | Count | Justification           |
| ---- | ----- | ----------------------- |
| None | 0     | Keep the floor at zero. |

## Resolved deferrals (history)

- `components/delegation/**` (60 sites): typed directly by the Thread G
  any-tail wave (2026-07-05, three PRs: write-config path, form-component
  clones, read path) once Thread C's styling verification showed no
  delegation rewrite was coming. One behavior-preserving double cast
  (`as unknown as boolean`, counts as zero `any`) remains in
  `CollectionDelegation.tsx` over the multicall envelope comparison whose
  underlying `.result` misread is tracked in issue #3078.
- `src/types/window.d.ts`: removed with the layout workstream's `src/`
  fold (resolved 2026-07-05).
- `wagmiConfig/wagmiAppWalletConnector.ts` (3 sites): replaced with a named
  wagmi connector return type and one targeted assertion at the
  `withCapabilities` conditional-generic boundary.
- `app/blog/disney-deekay-their-secret-to-animation/page.tsx` (1 site): removed
  as a scanner false positive by switching `any_casts` from textual matching to
  TypeScript AST matching.

## Known scanner blind spot (for future calibration)

The ratchet counts direct `: any`-style annotations, `as any` assertions, and
valid TypeScript `<any>` assertions only; generic type arguments like
`useState<any>()` are invisible to it. Invalid TSX angle-bracket assertion
syntax fails parsing instead of silently undercounting. A handful of such
generics remain in
`components/delegation/CollectionDelegation.tsx`
(`revokeDelegationParams`, `batchRevokeDelegationParams`, three
`useState<any[]>` key arrays). They are outside the metric and were left
untouched by the typing wave; tighten them opportunistically when that
file is next split (Thread D owns the split).

Counts and per-file locations: `node scripts/debt-ratchet.cjs --details any_casts`.
