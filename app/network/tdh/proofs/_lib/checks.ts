/**
 * The D128 contract's checks on a submission, in the order it runs them
 * (the validator's contracts record, "What a submission must satisfy"),
 * with the refusals the record names for each. Code names, not copy: the
 * page prints them as code.
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
  /** The refusals the record names; empty where it names none. */
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
    refusals: [],
    rule: "len(A) = len(B) = {bytes}; {words} words, each in its width",
  },
  {
    id: "outputs",
    refusals: ["OutputsDiffer(word)"],
    rule: "B[w] = A[w] for every word w except anchorNumber, anchorHash",
  },
  {
    id: "network",
    refusals: ["WrongRule", "PastHorizon"],
    rule: "networkId = NETWORK_ID; tdhRuleId = TDH_RULE_ID; cycleDay ≤ LAST_CYCLE_DAY",
  },
  {
    id: "chaining",
    refusals: ["NotNextCycle", "ChainMismatch"],
    rule: "cycleDay = head + 1; prevCut*, prevHistory* = the head's",
  },
  {
    id: "time",
    refusals: [],
    rule: "t_N ≤ block.timestamp; cutTimestamp < t_N",
  },
  {
    id: "cycleRoot",
    refusals: ["CycleRootMismatch"],
    rule: "cycleRoot = ROOT(the statement's own words)",
  },
  {
    id: "anchors",
    refusals: ["AnchorMismatch"],
    rule: "anchorHash = BLOCKHASH | EIP-2935 | recordAnchor, for A and for B",
  },
  {
    id: "proofs",
    refusals: ["ProofInvalid", "VerificationFailed"],
    rule: "SP1.verifyProof(PROGRAM_A_VKEY, A, proofA); RiscZero.verify(sealB, PROGRAM_B_IMAGE_ID, sha256(B)); pinned selectors only",
  },
];

/** The programs' own evidence rule, which runs before any proof exists (P53 §4.6). */
export const PROGRAM_RULE =
  "every block: its bloom proves absence, or its receipts rebuild receiptsRoot";
