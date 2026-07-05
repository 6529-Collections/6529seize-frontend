# `any` exceptions ledger

Sites that keep `: any` / `as any` deliberately, with one-line justifications.
Everything not listed here is expected to stay at zero; the debt-ratchet
baseline (`scripts/debt-ratchet-baseline.json`, metric `any_casts`) is the
enforcement backstop.

Current floor: `any_casts` = 4 (3 permanent + 1 scan false positive).

## Permanent exceptions

| Site | Count | Justification |
| --- | --- | --- |
| `wagmiConfig/wagmiAppWalletConnector.ts` | 3 | wagmi `createConnector`'s `connect()` return type is conditional on the `withCapabilities` parameter; expressing it without `any` requires `as unknown as` double-casts that add no safety. Runtime shape matches the wagmi v2 connector contract. |

## Scan false positives (not `any` usages)

| Site | Count | Explanation |
| --- | --- | --- |
| `app/blog/disney-deekay-their-secret-to-animation/page.tsx` | 1 | The ratchet's textual `\bas\s+any\b` matches the prose "…as powerfully as any great art can" inside JSX copy. No TypeScript cast exists in the file; editorial copy is not changed to satisfy a counter. |

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

## Known scanner blind spot (for future calibration)

The ratchet regex counts `: any` and `as any` only; generic type arguments
like `useState<any>()` are invisible to it. A handful of such generics
remain in `components/delegation/CollectionDelegation.tsx`
(`revokeDelegationParams`, `batchRevokeDelegationParams`, three
`useState<any[]>` key arrays). They are outside the metric and were left
untouched by the typing wave; tighten them opportunistically when that
file is next split (Thread D owns the split).

Counts and per-file locations: `node scripts/debt-ratchet.cjs --details any_casts`.
