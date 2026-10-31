/**
 * Domain types for the 6529 Stream UI, re-exported from `lib/stream/model/*`.
 *
 * Every type follows a contract view, struct or event in 6529 Works
 * (`src/interfaces/*`), or an indexer-style read built from those events. The
 * comment on each names its source, so the chain data source can fill it
 * mechanically. Amounts are wei as `bigint`; times are Unix seconds; shares and
 * rates are out of `SPLITS_DENOMINATOR` (100,000) unless named otherwise.
 */
export type * from "@/lib/stream/model/base";
export type * from "@/lib/stream/model/sales";
export type * from "@/lib/stream/model/records";
export type * from "@/lib/stream/model/accounts";
