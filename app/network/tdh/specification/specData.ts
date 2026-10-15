/**
 * Structured content of the specification page: P26 §2's contracts and topic
 * hashes, §10's parameter registry, §11's deviations and §12's issues, pinned
 * to the P26 text of 15 October 2026. Values are quoted verbatim; their plain
 * descriptions live in the `network.tdh.spec.*` messages.
 */

export const CONTRACTS = [
  {
    key: "memes",
    address: "0x33fd426905f149f8376e227d0c9d3340aad17af1",
    standard: "ERC-1155",
    events: "TransferSingle, TransferBatch",
  },
  {
    key: "gradients",
    address: "0x0c58ef43ff3032005e472cb5709f8908acb00205",
    standard: "ERC-721",
    events: "Transfer",
  },
  {
    key: "nextgen",
    address: "0x45882f9bc325e14fbb298a1df930c43a874b83ae",
    standard: "ERC-721",
    events: "Transfer",
  },
  {
    key: "delegation",
    address: "0x2202cb9c00487e7e8ef21e6d8e914b32e709f43d",
    standard: null,
    events: null,
  },
  {
    key: "manifold",
    address: "0x26bbea7803dcac346d5f5f135b57cf2c752a02be",
    standard: null,
    events: null,
  },
] as const;

export const TOPICS = [
  [
    "TransferSingle(address,address,address,uint256,uint256)",
    "0xc3d58168c5ae7397731d063d5bbf3d657854427343f4c083240f7aacaa2d0f62",
  ],
  [
    "TransferBatch(address,address,address,uint256[],uint256[])",
    "0x4a39dc06d4c0dbc64b70af90fd698a233a518aa5d07e595d983b8c0526c8f7fb",
  ],
  [
    "Transfer(address,address,uint256)",
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
  ],
  [
    "RegisterDelegation(address,address,address,uint256,bool,uint256)",
    "0xcf23f2b40be0e08bb0a6b6d6bef575e6441f3137f93730338475a86920fd2217",
  ],
  [
    "RevokeDelegation(address,address,address,uint256)",
    "0xeb2716ae908a1e27125f13f2a948ee7b067d22f92b1fc0152355e0085d80177e",
  ],
  [
    "RegisterDelegationUsingSubDelegation(address,address,address,address,uint256,bool,uint256)",
    "0xbd5af040fa27449f00e35a368bb558ba6b619f0da43b8f35722fe7f8de754b5f",
  ],
  [
    "RevokeDelegationUsingSubDelegation(address,address,address,address,uint256)",
    "0x3fc9853b549d505712a2e247960ed1ec823b23c592b38d4b438cc603c2c55d70",
  ],
] as const;

/** The rule's symbols and the P26 section that defines each (shown in order of first use). */
export const SYMBOLS = [
  { symbol: "N", key: "N", section: "4.1" },
  { symbol: "M = t_N", key: "M", section: "4.1" },
  { symbol: "B", key: "B", section: "4.2" },
  { symbol: "T = ts(B)", key: "T", section: "4.2" },
  { symbol: "days(a)", key: "days", section: "4.3" },
  { symbol: "n_memes", key: "nmemes", section: "5.1" },
  { symbol: "E[i]", key: "E", section: "5.2" },
  { symbol: "H", key: "H", section: "5.2" },
  { symbol: "G", key: "G", section: "5.3" },
  { symbol: "N_c", key: "Nc", section: "5.3" },
  { symbol: "net(w)", key: "net", section: "7.1" },
  { symbol: "raw", key: "raw", section: "7.2" },
  { symbol: "base", key: "base", section: "7.2" },
  { symbol: "sets", key: "sets", section: "8.3" },
  { symbol: "ADD(sets)", key: "ADD", section: "8.3" },
  { symbol: "beta", key: "beta", section: "8.3" },
  { symbol: "B64(x)", key: "B64", section: "1" },
  { symbol: "HALFUP(x)", key: "HALFUP", section: "1" },
  { symbol: "SINKS", key: "SINKS", section: "1" },
] as const;

/** P26 §10, without the provenance column. */
export const PARAMETERS = [
  {
    name: "memes",
    value: "0x33fd426905f149f8376e227d0c9d3340aad17af1, ERC-1155",
    key: "memes",
  },
  {
    name: "gradients",
    value: "0x0c58ef43ff3032005e472cb5709f8908acb00205, ERC-721",
    key: "gradients",
  },
  {
    name: "nextgen",
    value: "0x45882f9bc325e14fbb298a1df930c43a874b83ae, ERC-721",
    key: "nextgen",
  },
  {
    name: "nextgen_collection_divisor",
    value: "10,000,000,000",
    key: "nextgen_collection_divisor",
  },
  { name: "sinks", value: "ZERO, DEAD", key: "sinks" },
  {
    name: "eligibility_min_age_s",
    value: "86,400",
    key: "eligibility_min_age_s",
  },
  { name: "day_s", value: "86,400", key: "day_s" },
  {
    name: "cycle_boundary",
    value: "t_N = N * 86400 (00:00:00 UTC)",
    key: "cycle_boundary",
  },
  { name: "age_reference", value: "T = ts(B)", key: "age_reference" },
  { name: "cutoff_finality", value: "finalized chain", key: "cutoff_finality" },
  {
    name: "firstgm_id, firstgm_edition_adjustment",
    value: "8, -2,588",
    key: "firstgm",
  },
  {
    name: "firstgm_burn_tx",
    value: "0xa6c27335d3c4f87064a938e987e36525885cc3d136ebb726f4c5d374c0d2d854",
    key: "firstgm_burn_tx",
  },
  { name: "edition_floor_cap", value: "310", key: "edition_floor_cap" },
  {
    name: "edition_floor_threshold",
    value: "300",
    key: "edition_floor_threshold",
  },
  {
    name: "manifold_lazy_claim",
    value: "0x26bbea7803dcac346d5f5f135b57cf2c752a02be",
    key: "manifold_lazy_claim",
  },
  {
    name: "gradient_rate_minimum",
    value: "1.00",
    key: "gradient_rate_minimum",
  },
  { name: "rate_decimals", value: "2 (HALFUP via B64)", key: "rate_decimals" },
  { name: "base_rounding", value: "3 then 0 decimals", key: "base_rounding" },
  {
    name: "delegation",
    value: "0x2202cb9c00487e7e8ef21e6d8e914b32e709f43d",
    key: "delegation",
  },
  {
    name: "consolidation_use_case",
    value: "999",
    key: "consolidation_use_case",
  },
  {
    name: "consolidation_collections",
    value: "Memes, 0x8888888888888888888888888888888888888888",
    key: "consolidation_collections",
  },
  {
    name: "consolidation_max_wallets",
    value: "3",
    key: "consolidation_max_wallets",
  },
  { name: "base_multiplier", value: "1.00", key: "base_multiplier" },
  { name: "boost_decimals", value: "2", key: "boost_decimals" },
  {
    name: "boost_intermediate_decimals",
    value: "6",
    key: "boost_intermediate_decimals",
  },
  {
    name: "season_bonus, last_boosted_season",
    value: "0.05, 20",
    key: "season",
  },
  {
    name: "additional_set_first, additional_set_ratio",
    value: "0.05, 0.6529",
    key: "additional_set",
  },
  {
    name: "genesis_ids, genesis_bonus",
    value: "{1, 2, 3}, 0.01",
    key: "genesis",
  },
  { name: "nakamoto_ids, nakamoto_bonus", value: "{4}, 0.01", key: "nakamoto" },
  {
    name: "gradient_bonus, gradient_max_count",
    value: "0.02, 5",
    key: "gradient",
  },
  {
    name: "season_starts",
    value:
      "1, 48, 87, 119, 152, 181, 213, 246, 279, 311, 343, 375, 407, 439, 477, 516, 556",
    key: "season_starts",
  },
] as const;

export type DeviationDecision = "adopted" | "dev2" | "kept" | "dev13";
export type DeviationGroup = "changes" | "kept" | "other";

export interface Deviation {
  readonly id: number;
  readonly decision: DeviationDecision;
  readonly group: DeviationGroup;
}

const KEPT = new Set([10, 12, 14, 17]);

export const DEVIATIONS: readonly Deviation[] = Array.from(
  { length: 19 },
  (_, index) => {
    const id = index + 1;
    let decision: DeviationDecision = "adopted";
    if (id === 2) {
      decision = "dev2";
    } else if (id === 13) {
      decision = "dev13";
    } else if (KEPT.has(id)) {
      decision = "kept";
    }
    let group: DeviationGroup = "other";
    if (id === 2) {
      group = "changes";
    } else if (KEPT.has(id) || id === 13) {
      group = "kept";
    }
    return { id, decision, group };
  }
);

export const BUG_IDS = Array.from({ length: 15 }, (_, index) => index + 1);

export const DECISION_IDS = [
  "D112",
  "D116",
  "D118",
  "D119",
  "D121",
  "D122",
  "D125",
  "D128",
  "D130",
  "D131",
  "D132",
] as const;
