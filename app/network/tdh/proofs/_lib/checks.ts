/**
 * The D128 contract's checks on a submission, in the order it runs them
 * (the validator's contracts record, "What a submission must satisfy"),
 * with the errors the contract names for each (TStatementV1.sol and
 * TdhProvenRoots.sol at d49ffc7). Code names, not copy: the page prints
 * them as code.
 */
type CheckId =
  | "decoding"
  | "outputs"
  | "network"
  | "chaining"
  | "time"
  | "cycleRoot"
  | "anchors"
  | "proofs";

interface ContractCheck {
  readonly id: CheckId;
  /** The errors the contract reverts with for this check. */
  readonly refusals: readonly string[];
  /**
   * The check's line in the exact rule, in the contract's own terms. `{…}`
   * marks a value the page fills from a fact.
   */
  readonly rule: string;
}

export const CONTRACT_CHECKS: readonly ContractCheck[] = [
  {
    id: "decoding",
    refusals: ["StatementLength", "StatementTag", "StatementFieldTooWide"],
    rule: "len(A) = len(B) = {bytes}; {words} words, each in its width",
  },
  {
    id: "outputs",
    refusals: ["OutputsDiffer(word)"],
    rule: "B[w] = A[w] for every word w except anchorNumber, anchorHash",
  },
  {
    id: "network",
    refusals: ["WrongNetwork", "WrongRule", "PastHorizon"],
    rule: "networkId = NETWORK_ID; tdhRuleId = TDH_RULE_ID; cycleDay ≤ LAST_CYCLE_DAY",
  },
  {
    id: "chaining",
    refusals: ["NotNextCycle", "ChainMismatch"],
    rule: "cycleDay = head + 1; prevCut*, prevHistory* = the head's",
  },
  {
    id: "time",
    refusals: [
      "CycleNotOver",
      "CutoffNotBeforeBoundary",
      "CutoffBeforeCycle",
      "CutBeforePrevious",
      "HistoryShrank",
      "EmptyCycleMismatch",
    ],
    rule: "t_N = the midnight, UTC, that closes cycleDay; t_N ≤ block.timestamp; t_(N−1) ≤ cutTimestamp < t_N, or a day with no block repeats the last cut and history",
  },
  {
    id: "cycleRoot",
    refusals: ["CycleRootMismatch"],
    rule: 'cycleRoot = H("6529.TdhCycleRoot.v1", NETWORK_ID, cycleDay, t_N, tdhRuleId, cutNumber, cutHash, cutTimestamp, walletRoot, walletCount, identityCount, totalTDH, tokenRoot, tokenCount)',
  },
  {
    id: "anchors",
    refusals: ["AnchorNotAfterCut", "AnchorUnavailable", "AnchorMismatch"],
    rule: "anchorHash = BLOCKHASH | EIP-2935 | recordAnchor, for A and for B",
  },
  {
    id: "proofs",
    // The selectors are the contract's; ProofInvalid and VerificationFailed
    // are SP1's and RISC Zero's verifiers' own.
    refusals: [
      "WrongSp1Selector",
      "WrongRisc0Selector",
      "ProofInvalid",
      "VerificationFailed",
    ],
    rule: "SP1.verifyProof(PROGRAM_A_VKEY, A, proofA); RiscZero.verify(sealB, PROGRAM_B_IMAGE_ID, sha256(B)); pinned selectors only",
  },
];

/** The programs' own evidence rule, which runs before any proof exists (P53 §4.6). */
export const PROGRAM_RULE =
  "every block: its bloom proves absence, or its receipts rebuild receiptsRoot";
