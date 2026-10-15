/**
 * The 61 conformance vectors of P26 §13 (01 to 60, and 12b, as of 6529chain
 * 16d70d0) and their topics. Vectors 01-18 have hand-derived expected values
 * (18 updated for D131); 19-60 were generated with the Python reference and
 * their derivations checked by hand. 51-60 are the input rules made explicit
 * on 15 October 2026.
 */
export const VECTOR_TOPICS = [
  "holdings",
  "consolidation",
  "editions",
  "boosts",
  "rounding",
  "decoding",
  "order",
  "netting",
  "snapshot",
  "eligibility",
  "parameters",
  "noResult",
] as const;

export type VectorTopic = (typeof VECTOR_TOPICS)[number];

export const VECTORS: ReadonlyArray<{
  readonly id: string;
  readonly topics: readonly VectorTopic[];
}> = [
  { id: "01-zero", topics: ["holdings"] },
  { id: "02-single-erc721", topics: ["editions", "boosts"] },
  { id: "03-erc1155-editions", topics: ["editions", "rounding"] },
  { id: "04-mid-period-transfer", topics: ["holdings"] },
  { id: "05-same-block-out-then-in", topics: ["order"] },
  { id: "06-consolidation-age-carry", topics: ["consolidation"] },
  {
    id: "07-consolidation-lifo-from-end",
    topics: ["consolidation", "holdings"],
  },
  { id: "08-burns", topics: ["holdings"] },
  { id: "09-firstgm", topics: ["editions"] },
  { id: "10-boost-tiers", topics: ["boosts"] },
  { id: "11-edition-floors", topics: ["editions"] },
  { id: "12-rounding-boundaries", topics: ["rounding"] },
  { id: "12b-final-ties", topics: ["rounding"] },
  { id: "13-log-decoding", topics: ["decoding"] },
  { id: "14-consolidation-clusters", topics: ["consolidation"] },
  { id: "15-cutoff-and-days", topics: ["snapshot"] },
  { id: "16-cluster-same-block", topics: ["order", "consolidation"] },
  { id: "17-creation-mint-eligibility", topics: ["eligibility"] },
  { id: "18-erc721-round-trip", topics: ["netting", "order"] },
  { id: "19-season-count", topics: ["boosts"] },
  { id: "20-held-zero-day", topics: ["boosts"] },
  { id: "21-zero-edition", topics: ["editions"] },
  { id: "22-no-eligible-meme", topics: ["editions"] },
  { id: "23-identity-sums", topics: ["consolidation", "boosts"] },
  { id: "24-ages-and-counts", topics: ["eligibility", "holdings"] },
  { id: "25-raw-log-cycle", topics: ["decoding", "consolidation"] },
  { id: "26-delegation-decoding", topics: ["decoding"] },
  { id: "27-malformed-transfer-logs", topics: ["decoding"] },
  { id: "28-registry-hash", topics: ["parameters"] },
  { id: "29-invalid-underflow", topics: ["noResult"] },
  { id: "30-invalid-duplicate-transfer", topics: ["noResult"] },
  { id: "31-invalid-zero-edition-holder", topics: ["noResult"] },
  { id: "32-invalid-rate-range", topics: ["noResult"] },
  { id: "33-invalid-final-range", topics: ["noResult"] },
  { id: "34-cutoff-edges", topics: ["snapshot", "noResult"] },
  { id: "35-edition-floor-threshold", topics: ["editions"] },
  { id: "36-erc1155-send-and-return", topics: ["netting"] },
  { id: "37-pass-through-cluster-carry", topics: ["netting", "consolidation"] },
  { id: "38-pairing-order", topics: ["netting"] },
  { id: "39-mint-forwarded", topics: ["netting", "eligibility"] },
  {
    id: "40-mint-and-burn-in-one-transaction",
    topics: ["netting", "editions"],
  },
  { id: "41-firstgm-netting", topics: ["netting"] },
  { id: "42-batch-repeated-id", topics: ["netting", "decoding"] },
  { id: "43-different-transactions", topics: ["netting", "order"] },
  {
    id: "44-invalid-underflow-before-netting",
    topics: ["netting", "noResult"],
  },
  { id: "45-inserted-round-trip", topics: ["netting"] },
  { id: "46-round-trip-before-sale", topics: ["netting"] },
  { id: "47-sink-round-trip", topics: ["netting"] },
  { id: "48-invalid-transaction-hash", topics: ["netting", "noResult"] },
  { id: "49-invalid-transaction-timestamp", topics: ["netting", "noResult"] },
  { id: "50-invalid-net-amount", topics: ["netting", "noResult"] },
  {
    id: "51-invalid-duplicate-delegation-event",
    topics: ["consolidation", "order", "noResult"],
  },
  {
    id: "52-invalid-duplicate-ignored-log",
    topics: ["decoding", "noResult"],
  },
  { id: "53-invalid-log-order", topics: ["order", "noResult"] },
  {
    id: "54-invalid-transfer-after-cutoff",
    topics: ["snapshot", "noResult"],
  },
  { id: "55-cutoff-header-order", topics: ["snapshot", "noResult"] },
  { id: "56-zero-to-zero", topics: ["eligibility", "editions"] },
  { id: "57-consolidated-sink", topics: ["consolidation", "holdings"] },
  { id: "58-invalid-balance-range", topics: ["holdings", "noResult"] },
  { id: "59-registry-overrides", topics: ["parameters"] },
  { id: "60-invalid-registry", topics: ["parameters", "noResult"] },
];

/** Where the vector set is pinned: 6529chain's git tree of the directory. */
export const VECTOR_SET = {
  specCommit: "16d70d0",
  path: "design/tdh-reference/vectors",
  tree: "49f66cad67ec52efb0ef2ca7123c5c1e5510e690",
} as const;

export const VECTOR_COUNT = VECTORS.length;
