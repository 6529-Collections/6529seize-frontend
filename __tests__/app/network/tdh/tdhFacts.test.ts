import { BUNDLED_FORMAL_MANIFEST } from "@/lib/tdh/formal/bundledManifest";
import { formalManifestSchema } from "@/lib/tdh/formal/manifest";
import {
  DIFFTEST_ROUNDS,
  P26,
  P26_ROUND_4,
  PROGRAM_CONFORMANCE,
} from "@/app/network/tdh/shared/tdhFacts";
import {
  VECTOR_COUNT,
  VECTOR_SET,
  VECTORS,
} from "@/app/network/tdh/implementations/vectors";
import explainer from "@/i18n/messages/networkTdhExplainer.en-US.json";
import formal from "@/i18n/messages/networkTdhFormal.en-US.json";
import how from "@/i18n/messages/networkTdhHow.en-US.json";
import impl from "@/i18n/messages/networkTdhImpl.en-US.json";
import spec from "@/i18n/messages/networkTdhSpec.en-US.json";
import verify from "@/i18n/messages/networkTdhVerify.en-US.json";
import consolidation from "@/i18n/messages/networkTdhConsolidation.en-US.json";

/**
 * Guards for the dated facts the TDH pages repeat in many places: the
 * conformance vector set (P26 at 6529chain f840096: 89 vectors, 01 to 88 and
 * 12b), the Lean model's proof manifest (6529chain 7bf579a: 68 vectors), the
 * versions the daily job runs, and the privacy of the daily feed.
 */
const MESSAGES: Record<string, string> = {
  ...explainer,
  ...formal,
  ...how,
  ...impl,
  ...spec,
  ...verify,
  ...consolidation,
};

function noMessageMatches(pattern: RegExp) {
  for (const [key, text] of Object.entries(MESSAGES)) {
    expect([key, text]).not.toEqual([key, expect.stringMatching(pattern)]);
  }
}

describe("TDH page facts", () => {
  it("lists P26's 89 conformance vectors, from one set of facts", () => {
    expect(VECTOR_COUNT).toBe(89);
    expect(VECTOR_COUNT).toBe(P26.vectorCount);
    expect(VECTOR_SET.specCommit).toBe(P26.commit);
    expect(VECTORS.at(-1)?.id.startsWith(String(P26.lastVector))).toBe(true);
    expect(new Set(VECTORS.map((vector) => vector.id)).size).toBe(89);
    for (const vector of VECTORS) {
      expect(
        (impl as Record<string, string>)[`network.tdh.impl.v.${vector.id}`]
      ).toEqual(expect.any(String));
    }
    expect(PROGRAM_CONFORMANCE.python.vectors).toBe(P26.vectorCount);
    expect(PROGRAM_CONFORMANCE.rustReference.vectors).toBe(P26.vectorCount);
    // The validator's current code (merged 2026-10-15) follows P26's fourth
    // round, not yet its fifth; the daily job still runs the version that
    // follows 0621ed4.
    expect(PROGRAM_CONFORMANCE.rustCoreCurrent.vectors).toBe(
      P26_ROUND_4.vectorCount
    );
    expect(PROGRAM_CONFORMANCE.programBCurrent.vectors).toBe(
      P26_ROUND_4.vectorCount
    );
    expect(PROGRAM_CONFORMANCE.rustCoreDaily.vectors).toBe(51);
    expect(
      VECTORS.filter(
        (vector) => Number.parseInt(vector.id, 10) < P26_ROUND_4.vectorCount
      ).length
    ).toBe(P26_ROUND_4.vectorCount);
  });

  it("counts four rounds of differential tests, each settled in P26", () => {
    expect(DIFFTEST_ROUNDS).toHaveLength(4);
    expect(DIFFTEST_ROUNDS.at(-1)?.settledBy).toBe(P26.commit);
    expect(DIFFTEST_ROUNDS.at(-1)?.findings).toEqual(["F8", "F9", "E12"]);
    noMessageMatches(
      /\bthree rounds of (differential|generated)|in three rounds\b/
    );
    noMessageMatches(/not yet merged|\bin review\b|being updated/);
  });

  it("never presents an earlier vector count as the whole set", () => {
    noMessageMatches(
      /\b(36|61) (conformance )?vectors\b|\ball (51|61|68|75)\b|\b1,094\b|\b1,098\b|\b1,211\b|\b16d70d0\b/
    );
    // The validator's current code and the Lean model's round 4 pass the 75
    // vectors of P26's fourth round; 75 is only ever stated as that round's.
    for (const [key, text] of Object.entries(MESSAGES)) {
      if (/\b75 (conformance )?vectors\b|\b75 of\b/.test(text)) {
        expect([key, text]).toEqual([
          key,
          expect.stringMatching(/fourth round|a4db4ae/),
        ]);
      }
    }
    // The daily job's versions predate the later vectors; the 51 they pass is
    // only ever stated as theirs.
    for (const [key, text] of Object.entries(MESSAGES)) {
      if (/\b51 vectors\b|\b976 checks\b/.test(text)) {
        expect([key, text]).toEqual([key, expect.stringMatching(/daily job/)]);
      }
    }
  });

  it("takes the formal model's vector counts from its proof manifest", () => {
    const manifest = formalManifestSchema.parse(BUNDLED_FORMAL_MANIFEST);
    const p26 = manifest.vectors.find((run) => run.id === "p26");
    expect(p26).toMatchObject({ passed: 68, total: 68, checks: 1_190 });
    expect(manifest.facts.checks).toBe(21);
    for (const [key, text] of Object.entries(formal)) {
      expect([key, text]).not.toEqual([
        key,
        expect.stringMatching(
          /\b(61|68) (conformance )?vectors\b|\b1,190\b|\b16 (numeric )?checks\b/
        ),
      ]);
    }
  });

  it("never promises per-holder detail or calls every difference explained", () => {
    noMessageMatches(
      /every difference is published|every difference explained|Holders appear only as labels/
    );
  });

  it("does not overclaim the netting theorem", () => {
    noMessageMatches(
      /cannot change TDH|changes no value|and so no balance|no balance and no raw|stacks, balances and raw days only|order in which logs arrive|cannot change any(one)?[’']s? holdings/
    );
  });

  it("shows no sample data", () => {
    noMessageMatches(/\bsample\b/i);
  });
});
