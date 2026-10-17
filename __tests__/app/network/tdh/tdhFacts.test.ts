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
      /[Tt]hree things still read every step/
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

  it("keeps the fact list of 16 October 2026, round 7", () => {
    const text = (key: string) => MESSAGES[key] ?? "";
    // D116 covers the validator code only (with the Rust core, program B
    // and the vectors), never P26, the references or the Lean model.
    for (const key of [
      "network.tdh.formal.lede",
      "network.tdh.formal.check.body",
      "network.tdh.spec.versionRow.shaNote",
    ]) {
      expect(text(key)).not.toMatch(/D116/);
    }
    expect(text("network.tdh.impl.programs.intro")).toMatch(
      /The Rust core and program B are to be published with the validator code \(D116\); the references and the Lean model are in 6529’s private design repository/
    );
    // The Rust core against program B before signing is decided (D125,
    // P53 §4.5), not built in; nothing signs today.
    expect(text("network.tdh.formal.layers.desc")).toMatch(
      /As decided \(D125\), every validator is to check the Rust core against program B before it signs; program B is not in the validator yet, and nothing signs today/
    );
    expect(text("network.tdh.explainer.glossary.programs.def")).toMatch(
      /is to be the validators’ built-in second check \(D125, decided, not yet built in\)/
    );
    noMessageMatches(/TDH code is the validators’ built-in second check/);
    noMessageMatches(/independent checks are then the Python reference and/);
    noMessageMatches(/Before signing, a validator checks/);
    // Program B has run no real day.
    noMessageMatches(/agree on real days/);
    // Step 14: what changes is not "only" timing, and the backend's
    // results match netting (D132); the backend does not net.
    noMessageMatches(/differs only where today’s result depends/);
    noMessageMatches(/as 6529\.io’s backend already does/);
    // The four-wallet status in one form.
    noMessageMatches(/[Ww]hich applies is pending/);
    // The floor lifts a Meme with a claim limit, never a bare count.
    expect(text("network.tdh.how.s7.floorBand")).toMatch(
      /a claim limit of 310 or more counts as 310/
    );
    // The Rust core is a port of the Rust reference; the clean room read
    // P26 with its vectors and the documents it cites.
    noMessageMatches(/Rust core is a copy|of which the Rust core is a copy/);
    noMessageMatches(/written from P26 alone/);
    // No run time that the daily feed gives is fixed in the copy.
    noMessageMatches(/10 to 12 s/);
  });

  it("keeps the deep fact check of round 7 (b4b6553052)", () => {
    const text = (key: string) => MESSAGES[key] ?? "";
    // Round 5 proves the one-log rule (canonicalTransfers_oneLog); only the
    // strict reader is checked by vectors alone.
    for (const key of [
      "network.tdh.formal.not.inputs.body",
      "network.tdh.formal.not.inputs.bodyRaw",
    ]) {
      expect(text(key)).toMatch(/canonicalTransfers_oneLog/);
      expect(text(key)).toMatch(/checked by vectors only/);
    }
    noMessageMatches(/one-log rule and the strict reader; vectors and runs/);
    // Counterexamples are not claims.
    expect(text("network.tdh.formal.summary.false")).toBe("counterexamples");
    expect(text("network.tdh.formal.summary.falseBody")).toMatch(
      /Counterexamples are not claims/
    );
    // Not every first-rule value is a total; case G is an evaluation.
    noMessageMatches(/^Totals from the model/);
    expect(text("network.tdh.formal.st.firstRule.scope")).toMatch(
      /ZERO’s record in case B under the first rule; and identity \{A, B\}’s final in case C/
    );
    expect(text("network.tdh.formal.st.minted.scope")).toMatch(
      /^False by evaluation/
    );
    // The Lean model ran one real day; the 85 are the documented theorems,
    // the audit covers every theorem and definition.
    noMessageMatches(/on whole real days/);
    noMessageMatches(/audited at every build/);
    expect(text("network.tdh.formal.summary.provedBodyWhole")).toMatch(
      /every theorem and every definition of the model/
    );
    noMessageMatches(/adds no content/);
    noMessageMatches(/^Found by the model, and/);
    // Overview: E8 was settled in the vector format; the floors were
    // measured on October 11 and corrected on October 15.
    noMessageMatches(/Each finding became a rule in P26/);
    expect(text("network.tdh.explainer.found.difftest.body")).toMatch(
      /for an event’s default use case \(E8\), in the vector format and the references/
    );
    expect(text("network.tdh.explainer.found.floors.body")).toMatch(
      /measured on the October 11, 2026 cycle\. P26 was corrected on October 15, 2026/
    );
    noMessageMatches(/corrected the same day/);
    // How it works: the tables are rendered on the server; links between
    // identities are dashed; the floor needs a claim.
    noMessageMatches(/^Every worked example is computed in your browser/);
    expect(text("network.tdh.how.s10.graphDesc")).toMatch(
      /a confirmed link between two identities a dashed line/
    );
    expect(text("network.tdh.how.rate.keyUsedFloor")).toMatch(
      /the larger of the minted count and the floor/
    );
    // Implementations: D125's third check is not built; an event without a
    // use case takes the registry's.
    expect(text("network.tdh.impl.python.runsIn")).toMatch(
      /not built yet, and nothing signs today/
    );
    expect(text("network.tdh.impl.format.key.consolidation_events")).toMatch(
      /registry’s consolidation_use_case.*vector 65 sets 1000/
    );
    // Specification: the snapshot comes first, from the finalized chain.
    noMessageMatches(/which set the snapshot/);
    // Verification: four steps; the day's JSON gives the day's numbers;
    // the input's hash is of its text; LIVE_UNAVAILABLE includes an upload
    // that did not verify; the RSS feed is capped.
    expect(text("network.tdh.verify.check.sourceBody")).toMatch(/four steps/);
    noMessageMatches(/every number on this page/);
    noMessageMatches(/byte-identical/);
    expect(text("network.tdh.shared.pill.liveUnavailable")).toMatch(
      /missing or unverified/
    );
    expect(text("network.tdh.verify.tiles.liveMissing")).toMatch(
      /missing or did not verify/
    );
    noMessageMatches(/every published day \(RSS\)/);
    expect(text("network.tdh.verify.provenance.rss")).toMatch(/\{days\}/);
  });

  it("shows no sample data", () => {
    noMessageMatches(/\bsample\b/i);
  });
});
