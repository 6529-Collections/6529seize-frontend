/** The 36 conformance vectors of P26 §13 and their topics (plan Appendix C). */
export const VECTOR_TOPICS = [
  "holdings",
  "consolidation",
  "editions",
  "boosts",
  "rounding",
  "decoding",
  "order",
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
  { id: "18-erc721-round-trip", topics: ["order"] },
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
];
