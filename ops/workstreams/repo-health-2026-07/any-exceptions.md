# `any` exceptions ledger

Sites that keep `: any` / `as any` deliberately, with one-line justifications.
Everything not listed here is expected to stay at zero; the debt-ratchet
baseline (`scripts/debt-ratchet-baseline.json`, metric `any_casts`) is the
enforcement backstop.

## Permanent exceptions

| Site | Count | Justification |
| --- | --- | --- |
| `wagmiConfig/wagmiAppWalletConnector.ts` | 3 | wagmi `createConnector`'s `connect()` return type is conditional on the `withCapabilities` parameter; expressing it without `any` requires `as unknown as` double-casts that add no safety. Runtime shape matches the wagmi v2 connector contract. |

## Scan false positives (not `any` usages)

| Site | Count | Explanation |
| --- | --- | --- |
| `app/blog/disney-deekay-their-secret-to-animation/page.tsx` | 1 | The ratchet's textual `\bas\s+any\b` matches the prose "…as powerfully as any great art can" inside JSX copy. No TypeScript cast exists in the file; editorial copy is not changed to satisfy a counter. |

## Deferred to other workstreams (not exceptions)

- `components/delegation/**` (~60 sites at last count): owned by the styling
  workstream (Thread C), which is rewriting these files; typing them here
  would churn against that migration.
- `src/types/window.d.ts` was listed here until the layout workstream's
  `src/` fold removed the file (resolved 2026-07-05).

Counts and per-file locations: `node scripts/debt-ratchet.cjs --details any_casts`.
