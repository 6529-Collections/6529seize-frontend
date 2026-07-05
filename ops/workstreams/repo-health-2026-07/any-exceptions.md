# `any` exceptions ledger

Sites that keep `: any` / `as any` / generic-argument `any` deliberately,
with one-line justifications. Everything not listed here is expected to
stay at zero; the debt-ratchet baseline
(`scripts/debt-ratchet-baseline.json`, metric `any_casts`) is the
enforcement backstop.

Current floor: `any_casts` = 27 (3 permanent + 1 scan false positive + 23
generic-argument sites newly visible to the extended scanner; burn-down
inventory below).

## Permanent exceptions

| Site | Count | Justification |
| --- | --- | --- |
| `wagmiConfig/wagmiAppWalletConnector.ts` | 3 | wagmi `createConnector`'s `connect()` return type is conditional on the `withCapabilities` parameter; expressing it without `any` requires `as unknown as` double-casts that add no safety. Runtime shape matches the wagmi v2 connector contract. |

## Scan false positives (not `any` usages)

| Site | Count | Explanation |
| --- | --- | --- |
| `app/blog/disney-deekay-their-secret-to-animation/page.tsx` | 1 | The ratchet's textual `\bas\s+any\b` matches the prose "…as powerfully as any great art can" inside JSX copy. No TypeScript cast exists in the file; editorial copy is not changed to satisfy a counter. |

## Generic-argument burn-down inventory (fixable, not exceptions)

Made visible by the 2026-07 scanner extension (the `any_casts` regex now
also matches generic type arguments such as `useState<any>()` and
`Record<string, any>`). These 23 sites predate the extension; the ratchet
stops new ones, and these should be typed by whichever thread next owns
each area:

| Area | Count | Shape |
| --- | --- | --- |
| `app/api/pepe/resolve/route.ts` | 6 | `fetchJson<any>` / `tokenscanJson<any>` responses |
| `components/drops/view/item/rate/give/clap/DropListItemRateGiveClap.tsx` | 5 | `useState<any>` mo-js animation handles |
| `components/waves/drop/SingleWaveDropTraits.tsx` | 4 | `Record<keyof TraitsData, any>` write casts |
| `components/allowlist-tool/allowlist-tool.types.ts` | 1 | `params: Record<string, any>` |
| `components/drops/view/item/content/media/MediaDisplayGLB.tsx` | 1 | `useRef<any>` model ref |
| `components/nextGen/admin/NextGenAdminUploadAL.tsx` | 1 | `useState<any>` allowlist file |
| `components/nextGen/collections/collectionParts/hooks/useSlideshowAutoplay.ts` | 1 | `useState<any>` swiper instance |
| `components/react-query-wrapper/ReactQueryWrapper.tsx` | 1 | `Record<string, any>` in a values type |
| `components/rememes/alchemy-sdk-types.ts` | 1 | `metadata: Record<string, any>` |
| `components/user/identity/statements/consolidated-addresses/UserPageIdentityStatementsConsolidatedAddressesItem.tsx` | 1 | `useState<any>` status message |
| `components/waves/memes/traits/schema.ts` | 1 | `Record<string, any>` initial values |

## Resolved deferrals (history)

- `components/delegation/**` (60 sites): typed directly by the Thread G
  any-tail wave (2026-07-05, three PRs: write-config path, form-component
  clones, read path) once Thread C's styling verification showed no
  delegation rewrite was coming. The behavior-preserving
  `as unknown as boolean` double cast over the multicall envelope
  comparison was removed by the issue #3078 fix once the envelope read
  became honest.
- `components/delegation/**` generic arguments (5 sites:
  `revokeDelegationParams`, `batchRevokeDelegationParams`, three
  disclosure-key `useState<any[]>` arrays): typed by the
  CollectionDelegation split thread in the same PR that extended the
  scanner (2026-07-05); the delegation area now counts zero.
- `src/types/window.d.ts`: removed with the layout workstream's `src/`
  fold (resolved 2026-07-05).

## Scanner coverage notes (for future calibration)

The 2026-07 extension added generic-argument detection: `any` delimited by
`<` or `,` before and `,`/`>`/`[`/`)`/`|`/`&` after. Remaining known blind
spot, kept deliberately until a real instance appears: `any` as a tuple
member (`[any, string]`) — tuple brackets are also markdown-link and
comparison syntax, so matching them textually would trade a currently
non-existent miss for real false positives. Pattern and rationale live in
`scripts/debt-ratchet.cjs` (`ANY_CASTS_PATTERN`), pinned by
`__tests__/scripts/debt-ratchet.test.ts`.

Counts and per-file locations: `node scripts/debt-ratchet.cjs --details any_casts`.
