import proofs from "../data/proofs.json";
import { RECORD_REFRESH, source } from "./helpers";
import { defineFact, type FactDef, type FactFormat } from "./types";

/**
 * The zero-knowledge proofs of a TDH day (6529chain P52, P53 §4.6, D119,
 * D128), as the validator's own records state them: the statement both
 * programs prove, program A's proof of the 2026-10-11 day (under the retired
 * tdh-v1.0), the two pairs both programs proved of a common test cycle (the
 * first under tdh-v1.0, the second under tdh-v1.4), the D128 contract's
 * tests and gas, and what has not happened yet. Each fact names the record and commit
 * it was read from (`lib/explained/data/proofs.json`); they are refreshed at
 * the fact gate, like the decision record.
 */

type SourceKey = keyof typeof proofs.sources;

const KIND: Record<SourceKey, "site" | "spec" | "decision"> = {
  contracts: "site",
  programA: "site",
  programAV14: "site",
  programB: "site",
  programBV14: "site",
  runbook: "site",
  p53: "spec",
  p52: "spec",
  runLog: "decision",
  sp1Update: "site",
  sp1Cve: "site",
  sp1Native: "site",
};

function proofSource(key: SourceKey) {
  const entry: {
    readonly ref: string;
    readonly writtenAt?: string;
    readonly url?: string;
  } = proofs.sources[key];
  return () =>
    source(KIND[key], entry.ref, {
      writtenAt: entry.writtenAt,
      url: entry.url,
    });
}

function fact<T extends number | string | readonly string[]>(
  from: SourceKey,
  format: FactFormat,
  value: T,
  extra: Partial<Pick<FactDef<T>, "unit" | "evidence" | "maturity">> = {}
): FactDef<T> {
  return defineFact<T>({
    format,
    refresh: RECORD_REFRESH,
    source: proofSource(from),
    ...extra,
    value: () => value,
  });
}

const count = (from: SourceKey, value: number) => fact(from, "count", value);

/** The steps of program A's proving run, by phase, from the previous build's profile. */
export type ProofPhase = {
  readonly id: string;
  readonly steps: number;
};

export const PROOF_FACTS = {
  "proofs.recordWrittenAt": fact(
    "contracts",
    "instant",
    proofs.sources.contracts.writtenAt
  ),
  "proofs.statement.words": count("p53", proofs.statement.words),
  "proofs.statement.bytes": fact("p53", "count", proofs.statement.bytes, {
    unit: "bytes",
  }),
  "proofs.statement.wordBytes": count("p53", proofs.statement.wordBytes),

  "proofs.day.date": fact("programA", "day", proofs.day.date),
  // The cycle is the statement's third word (P53 §4.6: cycleDay).
  "proofs.day.cycle": count(
    "programA",
    Number.parseInt(proofs.day.wordsA[2] ?? "", 16)
  ),
  "proofs.day.ruleVersion": fact("contracts", "text", proofs.day.ruleVersion),
  "proofs.day.wordsA": fact("programA", "list", proofs.day.wordsA, {
    evidence: "proved",
  }),
  "proofs.day.wordsB": fact("programB", "list", proofs.day.wordsB, {
    evidence: "tested",
  }),
  "proofs.day.nativeTotal": fact("programA", "count", proofs.day.nativeTotal, {
    unit: "TDH",
  }),
  "proofs.day.steps": count("programA", proofs.day.steps),
  "proofs.day.nativeSeconds": count("programA", proofs.day.nativeSeconds),
  "proofs.day.inputBytes": fact("programA", "count", proofs.day.inputBytes, {
    unit: "bytes",
  }),
  "proofs.day.blocks": count("programA", proofs.day.blocks),
  "proofs.day.bloomBlocks": count("programA", proofs.day.bloomBlocks),
  "proofs.day.receiptBlocks": count("programA", proofs.day.receiptBlocks),
  "proofs.day.txBlocks": count("programA", proofs.day.txBlocks),
  "proofs.day.dayLogs": count("programA", proofs.day.dayLogs),
  "proofs.day.receiptBytes": fact(
    "programA",
    "count",
    proofs.day.receiptBytes,
    { unit: "bytes" }
  ),
  "proofs.day.historyLogs": count("programA", proofs.day.historyLogs),
  "proofs.day.gpu": fact("contracts", "text", proofs.day.gpu),
  "proofs.day.hostMemoryGb": count("runbook", proofs.day.hostMemoryGb),
  "proofs.day.costUsd": count("runbook", proofs.day.costUsd),
  "proofs.day.provedOn": fact("contracts", "day", proofs.day.provedOn),

  "proofs.dayB.total": fact("programB", "count", proofs.dayB.total, {
    unit: "TDH",
    evidence: "tested",
  }),
  "proofs.dayB.userCycles": count("programBV14", proofs.dayB.userCycles),
  "proofs.dayB.totalCycles": count("programBV14", proofs.dayB.totalCycles),
  "proofs.dayB.segments": count("programBV14", proofs.dayB.segments),
  "proofs.dayB.gpuHoursLow": count("programBV14", proofs.dayB.gpuHoursLow),
  "proofs.dayB.gpuHoursHigh": count("programBV14", proofs.dayB.gpuHoursHigh),
  "proofs.dayB.costUsd": count("programBV14", proofs.dayB.costUsd),

  "proofs.phases.build": fact("programA", "commit", proofs.phases.build),
  "proofs.phases.total": count("programA", proofs.phases.total),
  "proofs.phases.parts": defineFact<readonly ProofPhase[]>({
    format: "list",
    refresh: RECORD_REFRESH,
    source: proofSource("programA"),
    value: () => proofs.phases.parts,
  }),

  "proofs.pair.cycle": count("contracts", proofs.pair.cycle),
  "proofs.pair.date": fact("contracts", "day", proofs.pair.date),
  "proofs.pair.provedOn": fact("contracts", "day", proofs.pair.provedOn),
  "proofs.pair.stepsA": count("contracts", proofs.pair.stepsA),
  "proofs.pair.stepsB": count("contracts", proofs.pair.stepsB),
  "proofs.pair.proofBytesA": fact(
    "contracts",
    "count",
    proofs.pair.proofBytesA,
    {
      unit: "bytes",
    }
  ),
  "proofs.pair.sealBytesB": fact("contracts", "count", proofs.pair.sealBytesB, {
    unit: "bytes",
  }),
  "proofs.pair.submitGas": fact("contracts", "count", proofs.pair.submitGas, {
    evidence: "tested",
  }),
  "proofs.pair.transactionGas": count("contracts", proofs.pair.transactionGas),
  "proofs.pair.executionGas": count("contracts", proofs.pair.executionGas),
  "proofs.pair.intrinsicGas": count("contracts", proofs.pair.intrinsicGas),
  "proofs.pair.coldCallGas": count("contracts", proofs.pair.coldCallGas),
  "proofs.pair.calldataBytes": fact(
    "contracts",
    "count",
    proofs.pair.calldataBytes,
    { unit: "bytes" }
  ),
  "proofs.pair.forkBlock": count("contracts", proofs.pair.forkBlock),

  "proofs.pairV14.cycle": count("contracts", proofs.pairV14.cycle),
  "proofs.pairV14.provedOn": fact("contracts", "day", proofs.pairV14.provedOn),
  "proofs.pairV14.stepsA": count("contracts", proofs.pairV14.stepsA),
  "proofs.pairV14.stepsB": count("contracts", proofs.pairV14.stepsB),
  "proofs.pairV14.submitGas": fact(
    "contracts",
    "count",
    proofs.pairV14.submitGas,
    { evidence: "tested" }
  ),
  "proofs.pairV14.ethCallBlock": count(
    "contracts",
    proofs.pairV14.ethCallBlock
  ),

  "proofs.gas.verifyA": count("contracts", proofs.gas.verifyA),
  "proofs.gas.verifyB": count("contracts", proofs.gas.verifyB),
  "proofs.gas.p52Estimate": count("p52", proofs.gas.p52Estimate),

  "proofs.a.zkvm": fact("contracts", "text", proofs.programs.a.zkvm),
  "proofs.a.wrapper": fact("contracts", "text", proofs.programs.a.wrapper),
  "proofs.a.vkey": fact("contracts", "hash", proofs.programs.a.vkey),
  "proofs.a.elfSha256": fact(
    "programAV14",
    "hash",
    proofs.programs.a.elfSha256
  ),
  "proofs.b.zkvm": fact("contracts", "text", proofs.programs.b.zkvm),
  "proofs.b.wrapper": fact("contracts", "text", proofs.programs.b.wrapper),
  "proofs.b.imageId": fact("contracts", "hash", proofs.programs.b.imageId),

  "proofs.contract.checks": count("contracts", proofs.contract.checks),
  "proofs.contract.unitTests": fact(
    "contracts",
    "count",
    proofs.contract.unitTests,
    { evidence: "tested", maturity: "built" }
  ),
  "proofs.contract.forkTests": fact(
    "contracts",
    "count",
    proofs.contract.forkTests,
    { evidence: "tested", maturity: "built" }
  ),
  "proofs.contract.testedOn": fact(
    "contracts",
    "day",
    proofs.contract.testedOn
  ),
  "proofs.contract.horizon": fact("contracts", "day", proofs.contract.horizon),
  "proofs.contract.retiredRuleId": fact(
    "contracts",
    "hash",
    proofs.contract.retiredRuleId
  ),

  "proofs.sp1Advisory.id": fact("sp1Cve", "text", proofs.sp1Advisory.id),
  "proofs.sp1Advisory.published": fact(
    "sp1Cve",
    "day",
    proofs.sp1Advisory.published
  ),
  "proofs.sp1Advisory.fixed": fact("sp1Cve", "text", proofs.sp1Advisory.fixed),
  "proofs.sp1Advisory.earlier": fact(
    "sp1Update",
    "day",
    proofs.sp1Advisory.earlier
  ),
  // SP1's newest advisory: its native verifier only, fixed before the SP1
  // that program A uses.
  "proofs.sp1Advisory.latestId": fact(
    "sp1Native",
    "text",
    proofs.sp1Advisory.latestId
  ),
  "proofs.sp1Advisory.latestPublished": fact(
    "sp1Native",
    "day",
    proofs.sp1Advisory.latestPublished
  ),
  "proofs.sp1Advisory.latestFixed": fact(
    "sp1Native",
    "text",
    proofs.sp1Advisory.latestFixed
  ),

  "proofs.catchup.chainStart": count("p53", proofs.catchup.chainStart),
  "proofs.catchup.millionBlocks": count(
    "programA",
    proofs.catchup.millionBlocks
  ),

  "proofs.milestones.firstProofs": fact(
    "contracts",
    "day",
    proofs.milestones.firstProofs
  ),
  "proofs.milestones.tdhV14": fact(
    "contracts",
    "day",
    proofs.milestones.tdhV14
  ),
  "proofs.milestones.pairV14": fact(
    "contracts",
    "day",
    proofs.milestones.pairV14
  ),

  "proofs.vectorFinding.vectors": count("runLog", proofs.vectorFinding.vectors),
  "proofs.vectorFinding.date": fact("runLog", "day", proofs.vectorFinding.date),
} as const;
