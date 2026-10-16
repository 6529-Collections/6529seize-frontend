import { BUNDLED_FORMAL_MANIFEST } from "@/lib/tdh/formal/bundledManifest";
import { formalManifestSchema } from "@/lib/tdh/formal/manifest";
import {
  DIFFTEST_ROUNDS,
  knownBuild,
  P26,
  PROGRAM_CONFORMANCE,
  VALIDATOR_DEVELOPMENT,
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
import shared from "@/i18n/messages/networkTdhShared.en-US.json";
import historic from "@/i18n/messages/networkTdh.en-US.json";

/**
 * Guards for the dated facts the TDH pages repeat in many places: the
 * conformance vector set (P26 at 6529chain f840096: 89 vectors, 01 to 88 and
 * 12b), the Lean model's proof manifest, the validator's development branch
 * (30bf8f9: the Rust core and program B on all 89), the daily job's builds
 * (read from the feed, never fixed in the copy), and the privacy of the
 * daily feed.
 */
const MESSAGES: Record<string, string> = {
  ...explainer,
  ...formal,
  ...how,
  ...impl,
  ...spec,
  ...verify,
  ...consolidation,
  ...shared,
  ...historic,
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
    // The validator's development branch (30bf8f9) follows P26's fifth
    // round: the Rust core and program B pass all 89.
    expect(VALIDATOR_DEVELOPMENT.commit).toBe("30bf8f9");
    expect(PROGRAM_CONFORMANCE.rustCoreCurrent).toMatchObject({
      specCommit: P26.commit,
      vectors: P26.vectorCount,
      checks: 1_253,
    });
    expect(PROGRAM_CONFORMANCE.programBCurrent).toMatchObject({
      specCommit: P26.commit,
      vectors: P26.vectorCount,
    });
  });

  it("reads the daily job's builds from the feed, annotating only known ones", () => {
    // The builds of the feed's first days port 6529chain 0621ed4 (51
    // vectors); a build the pages do not know gets no annotation.
    expect(knownBuild("e1276762ec5cf014bfb30efcb081f940d3d02154")).toEqual({
      spec: "0621ed4",
      vectors: 51,
    });
    expect(knownBuild("2b17216")).toEqual({ spec: "0621ed4", vectors: 51 });
    expect(knownBuild("0621ed4651e7a3be37bfa1862648d0d0291215d5")).toEqual({
      spec: "0621ed4",
      vectors: 51,
    });
    // The job redeployed on 16 October 2026: the round-5 core and Python.
    expect(knownBuild("0d25aa6c4a60599662f56c18f8c4d6d208b6cff8")).toEqual({
      spec: "f840096",
      vectors: 89,
    });
    expect(knownBuild("f8400962310de6636b256c3b53bbfddbdec8f329")).toEqual({
      spec: "f840096",
      vectors: 89,
    });
    expect(knownBuild("abcdef0123456789")).toBeNull();
    // The copy never names the daily job's build: the pages read it.
    noMessageMatches(/\be127676\b|\b2b17216\b/);
    noMessageMatches(/daily job (still )?runs/);
  });

  it("counts five rounds of differential tests, all settled in P26 but E13", () => {
    expect(DIFFTEST_ROUNDS).toHaveLength(5);
    expect(DIFFTEST_ROUNDS[3]?.settledBy).toBe(P26.commit);
    expect(DIFFTEST_ROUNDS[3]?.findings).toEqual(["F8", "F9", "E12"]);
    expect(DIFFTEST_ROUNDS.at(-1)).toMatchObject({
      settledBy: null,
      findings: ["E13"],
    });
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
    // The bundled copy is the feed's manifest of the model's round 5.
    expect(manifest.source.commit.startsWith("6b32f3f")).toBe(true);
    expect(p26).toMatchObject({ passed: 89, total: 89, checks: 1_253 });
    expect(manifest.facts.checks).toBe(46);
    expect(manifest.summary).toMatchObject({
      proved: 78,
      counterexample: 11,
      deferred: 9,
      audited: 85,
    });
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

  it("keeps the fact-check corrections of 16 October 2026", () => {
    // The validator's round-4 code is on its development branch, not merged
    // into main; the daily runs are scheduled from 16 October (D132).
    noMessageMatches(/\bmerged (on )?October|75 merged|current code, merged/);
    // (6529.io's four-wallet consolidation does date from October 15.)
    noMessageMatches(
      /daily (runs?|comparison|job)[^.]*since October 15|^Since October 15$/
    );
    // P53 §11.3 pins the edition-floor adapter since P26 f840096.
    noMessageMatches(/stays open/);
    // Sinks send too (mints come from the zero address).
    noMessageMatches(/only ever receive|sinks only receive/);
    // The Lean model uses Lean's core and standard library.
    noMessageMatches(/core library only/);
    // The netting theorem is about holding stacks, under its conditions.
    noMessageMatches(/acquisition record/);
    noMessageMatches(/removes the newest copies first/);
    // P26 §6.3 decides groups of four: three form an identity, the fourth
    // counts alone.
    noMessageMatches(/how a group of four counts[^.]*not settled/);
    noMessageMatches(/does not (yet )?say how a fourth counts/);
    // The feed's identity counts include the two sink identities.
    noMessageMatches(/\{(total|identities)\} collectors|collectors equal/i);
    // Program B read the design record too, not only the specifications.
    noMessageMatches(/specifications and the vector files only/);
    // Vector 40: a burn to 0x…dead credits the sink.
    expect(
      (impl as Record<string, string>)[
        "network.tdh.impl.v.40-mint-and-burn-in-one-transaction"
      ]
    ).toMatch(/0x…dead credits the sink/);
    // No real token or cycle in the vector anatomy.
    noMessageMatches(/observed on the 2026-10-11 cycle|10000000049/i);
  });

  it("keeps the fact list of 16 October 2026, round 6", () => {
    // History stays unchecked until the full check runs against 6529's own
    // node; no date is tied to it.
    noMessageMatches(/October 18|Oct 18|2026-10-18/);
    noMessageMatches(/until 6529’s own Ethereum node[^.]*is synced\.$/);
    // The cutover is "about October 23" (D132), never a fixed date.
    for (const [key, text] of Object.entries(MESSAGES)) {
      if (/cutover/i.test(text) && /\bOct(ober)? 23\b/.test(text)) {
        expect([key, text]).toEqual([
          key,
          expect.stringMatching(/about Oct(ober)? 23|around October 23/),
        ]);
      }
    }
    expect(verify["network.tdh.verify.calendar.rangeCutover"]).toMatch(
      /cutover about \{cutover\}/
    );
    // Three things read the transfers before netting (P26 §3.3, §7.1).
    noMessageMatches(/One thing still reads every step/);
    expect(how["network.tdh.how.s5.limit"]).toMatch(
      /Three things still read every step/
    );
    // Since Lean round 4 selection and decoding are in the model.
    noMessageMatches(/round 5 brings selection/);
    noMessageMatches(/so it computes real days/);
    // CI: 1,000 seeded random inputs through Lean, Python and Rust.
    noMessageMatches(/6,000 random inputs[^.]*Rust reference/);
    // The built-in pre-signing check is the Rust core against program B;
    // Python is an optional third check (D125, P53 §4.5).
    noMessageMatches(/a validator would not sign this result\.$/i);
    // The four-wallet consolidation: stated plainly, nothing more.
    noMessageMatches(/a fourth (wallet )?(then )?counts on its own/);
    noMessageMatches(/splits that way at the cutover/);
  });

  it("shows no sample data", () => {
    noMessageMatches(/\bsample\b/i);
  });
});
