/**
 * The 89 conformance vectors of P26 §13 (01 to 88, and 12b, as of 6529chain
 * f840096) and their topics. Vectors 01-18 have hand-derived expected values
 * (18 updated for D131); 19-88 were generated with the Python reference and
 * their derivations checked by hand. 51-74 are the input rules made explicit
 * on 15 October 2026, in P26's second, third and fourth rounds that day;
 * 75-88 the input types settled in its fifth round, on 16 October.
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
  {
    id: "61-invalid-log-stamped-at-cutoff",
    topics: ["snapshot", "noResult"],
  },
  {
    id: "62-invalid-cutoff-block-timestamp",
    topics: ["snapshot", "noResult"],
  },
  {
    id: "63-invalid-transfer-at-ignored-log",
    topics: ["decoding", "noResult"],
  },
  { id: "64-invalid-ignored-log-order", topics: ["order", "noResult"] },
  { id: "65-registry-lists", topics: ["parameters", "consolidation"] },
  {
    id: "66-invalid-registry-list-order",
    topics: ["parameters", "noResult"],
  },
  { id: "67-removed-logs", topics: ["decoding"] },
  {
    id: "68-invalid-registry-out-of-type",
    topics: ["parameters", "noResult"],
  },
  {
    id: "69-invalid-removed-not-boolean",
    topics: ["decoding", "noResult"],
  },
  {
    id: "70-invalid-day-s-out-of-type",
    topics: ["parameters", "noResult"],
  },
  {
    id: "71-invalid-timestamp-out-of-range",
    topics: ["snapshot", "noResult"],
  },
  {
    id: "72-invalid-transfer-at-raw-transfer-log",
    topics: ["decoding", "noResult"],
  },
  { id: "73-registry-uint256", topics: ["parameters"] },
  { id: "74-cutoff-dates-and-top-block", topics: ["snapshot"] },
  { id: "75-invalid-day-s-uint32", topics: ["parameters", "noResult"] },
  { id: "76-amounts-after-cutoff", topics: ["decoding", "snapshot"] },
  {
    id: "77-invalid-amount-out-of-type",
    topics: ["decoding", "noResult"],
  },
  {
    id: "78-invalid-timestamp-with-empty-raw-logs",
    topics: ["snapshot", "noResult"],
  },
  {
    id: "79-invalid-timestamp-without-raw-logs",
    topics: ["snapshot", "noResult"],
  },
  { id: "80-invalid-negative-zero", topics: ["decoding", "noResult"] },
  { id: "81-invalid-token-id-string", topics: ["decoding", "noResult"] },
  {
    id: "82-invalid-timestamps-key-leading-zero",
    topics: ["snapshot", "noResult"],
  },
  {
    id: "83-invalid-claim-max-out-of-type",
    topics: ["editions", "noResult"],
  },
  {
    id: "84-invalid-claim-max-key-leading-zero",
    topics: ["editions", "noResult"],
  },
  {
    id: "85-invalid-transfers-at-one-position-recipient",
    topics: ["order", "noResult"],
  },
  {
    id: "86-invalid-transfers-at-one-position-sender",
    topics: ["order", "noResult"],
  },
  {
    id: "87-invalid-transfers-at-one-position-contract",
    topics: ["order", "noResult"],
  },
  { id: "88-cutoff-header-keys", topics: ["snapshot"] },
];

/** Where the vector set is pinned: 6529chain's git tree of the directory. */
export const VECTOR_SET = {
  specCommit: "f840096",
  path: "design/tdh-reference/vectors",
  tree: "086e5ffbabc6758365eaaaf33db3c68dfbb8e22d",
} as const;

export const VECTOR_COUNT = VECTORS.length;
