import { BUNDLED_FORMAL_MANIFEST } from "@/lib/tdh/formal/bundledManifest";
import { formalManifestSchema } from "@/lib/tdh/formal/manifest";
import {
  DIFFTEST_ROUNDS,
  knownBuild,
  P26,
  PROGRAM_CONFORMANCE,
  VALIDATOR_BUILD,
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
import profile from "@/i18n/messages/networkTdhProfile.en-US.json";
import metrics from "@/i18n/messages/networkMetrics.en-US.json";
import about from "@/i18n/messages/about.en-US.json";
import { DELEGATION_CONSOLIDATION_BUILDER_MESSAGES as builder } from "@/i18n/messages/delegation-consolidation-builder";
import {
  REGISTRY_HASH,
  RETIRED_REGISTRY_HASH_V1_0,
  RULE_CLUSTERS,
  RULE_ID,
  RULE_PAIR_STATE,
  RULE_REGISTRY,
} from "@/app/network/tdh/shared/tdhRules";
import { PARAMETERS } from "@/app/network/tdh/specification/specData";

/**
 * Guards for the dated facts the TDH pages repeat in many places: the
 * conformance vector set (P26 at 6529chain 3bfa7b0: 104 vectors, 01 to 103
 * and 12b), the Lean model's proof manifest, the validator's build
 * (a1463f9: the Rust core and program B on all 104), the daily
 * job's builds (read from the feed, never fixed in the copy), the privacy of
 * the daily feed, and D136 and D137 (TDH v1.4, four-wallet consolidation).
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
  ...profile,
  ...metrics,
  ...about,
  ...builder,
};

function noMessageMatches(pattern: RegExp) {
  for (const [key, text] of Object.entries(MESSAGES)) {
    expect([key, text]).not.toEqual([key, expect.stringMatching(pattern)]);
  }
}

describe("TDH page facts", () => {
  it("lists P26's 104 conformance vectors, from one set of facts", () => {
    expect(VECTOR_COUNT).toBe(104);
    expect(VECTOR_COUNT).toBe(P26.vectorCount);
    expect(P26.commit).toBe("3bfa7b0");
    expect(VECTOR_SET.specCommit).toBe(P26.commit);
    expect(VECTORS.at(-1)?.id.startsWith(String(P26.lastVector))).toBe(true);
    expect(new Set(VECTORS.map((vector) => vector.id)).size).toBe(104);
    for (const vector of VECTORS) {
      expect(
        (impl as Record<string, string>)[`network.tdh.impl.v.${vector.id}`]
      ).toEqual(expect.any(String));
    }
    expect(PROGRAM_CONFORMANCE.python.vectors).toBe(P26.vectorCount);
    expect(PROGRAM_CONFORMANCE.rustReference.vectors).toBe(P26.vectorCount);
    // The validator's build a1463f9 follows P26 at 3bfa7b0 (D136): the
    // Rust core and program B pass all 104. Its software is numbered below
    // 1.0 (D137). a1463f9 is not on the validator's development branch
    // (still at 99f1ef0, the round-5 core), so the copy never says it is.
    noMessageMatches(/development branch/);
    expect(VALIDATOR_BUILD).toMatchObject({
      commit: "a1463f9",
      release: "0.1.0",
    });
    expect(PROGRAM_CONFORMANCE.rustCoreCurrent).toMatchObject({
      specCommit: P26.commit,
      vectors: P26.vectorCount,
      checks: 1_307,
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
    // Redeployed on 18 October 2026: TDH v1.4, D136.
    expect(knownBuild("a1463f9d9e316c17e0c2371628ad4d0f4f561627")).toEqual({
      spec: "3bfa7b0",
      vectors: 104,
    });
    expect(knownBuild("3bfa7b052202e40b0f178ee6de7f75f86ba5261c")).toEqual({
      spec: "3bfa7b0",
      vectors: 104,
    });
    expect(knownBuild("abcdef0123456789")).toBeNull();
    // The copy never names the daily job's build: the pages read it.
    noMessageMatches(/\be127676\b|\b2b17216\b/);
    noMessageMatches(/daily job (still )?runs/);
  });

  it("counts six rounds of differential tests, all settled but E13, E8 outside P26", () => {
    expect(DIFFTEST_ROUNDS).toHaveLength(6);
    expect(DIFFTEST_ROUNDS[3]?.settledBy).toBe("f840096");
    expect(DIFFTEST_ROUNDS[3]?.findings).toEqual(["F8", "F9", "E12"]);
    expect(DIFFTEST_ROUNDS[4]).toMatchObject({
      settledBy: null,
      findings: ["E13"],
    });
    // The sixth, on TDH v1.4, found nothing new.
    expect(DIFFTEST_ROUNDS.at(-1)).toMatchObject({
      settledBy: null,
      findings: [],
    });
    noMessageMatches(/\bfive rounds of (differential|generated)/i);
    // The fifth round's E13 is open, and the second round's E8 was settled
    // in the vector format and the references (6529chain 1c69528), not in
    // P26's text: no copy says every round's findings became P26 rules.
    noMessageMatches(
      /\b(each|every) round[’']s findings (became|were|are)[^.]*\bP26\b(?![^.]*\bE8\b)/i
    );
    noMessageMatches(
      /\bfindings became rules in P26\b|\ball settled in P26\b/i
    );
    expect(spec["network.tdh.spec.evidence.difftest.body"]).toMatch(
      /\bE8\b[^.]*vector format and the references/
    );
    expect(spec["network.tdh.spec.evidence.difftest.body"]).toMatch(
      /still open \(E13\)/
    );
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
    // P26's fifth round had 89 vectors; 89 is only ever stated as that
    // round's (f840096) or the Lean model's published build's.
    for (const [key, text] of Object.entries(MESSAGES)) {
      if (/\b89 (conformance )?vectors\b|\ball 89\b|\b89 of\b/.test(text)) {
        expect([key, text]).toEqual([
          key,
          expect.stringMatching(/f840096|fifth round|round 5/),
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
    noMessageMatches(
      /(fully checked|full (history|check))[^.]*\b(October|Oct) \d+|\b(October|Oct) \d+[^.]*(is|be|gets?) fully checked/
    );
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

  it("follows D137: TDH v1.4, rule version tdh-v1.4, the validator below 1.0", () => {
    // The old name is gone from every message.
    noMessageMatches(/TDH-v1\b/);
    // tdh-v1.0 only ever as the name P26 used until October 18, 2026.
    for (const [key, text] of Object.entries(MESSAGES)) {
      if (/tdh-v1\.0/.test(text)) {
        expect([key, text]).toEqual([
          key,
          expect.stringMatching(/until (October 18|18 October), 2026|retired/),
        ]);
      }
    }
    // Said once, on the overview: TDH v1.4 is 6529.io's name for its
    // current rules, and the validators compute them exactly.
    const once = Object.entries(explainer).filter(([, text]) =>
      /TDH v1\.4 is 6529\.io’s name for its current TDH rules, and the validators compute them exactly/.test(
        text
      )
    );
    expect(once).toHaveLength(1);
    // "Validator v1" only ever as the design's name.
    for (const [key, text] of Object.entries(MESSAGES)) {
      if (/Validator v1\b/.test(text)) {
        expect([key, text]).toEqual([
          key,
          expect.stringMatching(/design’s name|design name/),
        ]);
      }
    }
    expect(explainer["network.tdh.explainer.glossary.validator.def"]).toMatch(
      /numbered below 1\.0, at 0\.1\.0/
    );
  });

  it("follows D136: four wallets, as 6529.io counts them, with nothing pending", () => {
    noMessageMatches(/pending an owner decision|whether it allows four/i);
    noMessageMatches(/[Pp]ending an owner/);
    // The rule stated plainly where consolidation is explained.
    expect(how["network.tdh.how.s10.fourth"]).toMatch(
      /one wallet of the four must have links with each of the other three registered in both directions from October 15, 2026, 00:00 UTC/
    );
    expect(spec["network.tdh.spec.s6-3.body"]).toMatch(
      /Up to three wallets group as before\. A fourth wallet joins only if the group of four then has one wallet whose links with each of the other three were registered in both directions from October 15, 2026, 00:00 UTC.*P26 and 6529\.io group wallets identically/
    );
    expect(consolidation["network.tdhConsolidation.rules.limit.body"]).toMatch(
      /Up to three count as before\. A group of four counts only when one of its wallets has links with each of the other three registered in both directions/
    );
    expect(
      builder["delegation.consolidationBuilder.wallets.fourthNote"]
    ).toMatch(/on 6529\.io and in TDH v1\.4/);
    // The rule blocks and the registry: P26 §6.2, §6.3 and §10 at 3bfa7b0.
    expect(RULE_PAIR_STATE).toMatch(/REGISTER\(a, b\) at t:/);
    expect(RULE_CLUSTERS).toMatch(/canJoin\(C, n\)/);
    expect(RULE_CLUSTERS).toMatch(/consolidation_max_wallets \(4\)/);
    expect(RULE_CLUSTERS).toMatch(/by ascending\s+pair key/);
    expect(RULE_REGISTRY).toMatch(
      /uint32 consolidation_max_wallets, consolidation_ungated_max_wallets;\nuint64 consolidation_gate_activation_s;/
    );
    expect(
      PARAMETERS.map((row) => [row.name, row.value]).filter(([name]) =>
        name.startsWith("consolidation_")
      )
    ).toEqual(
      expect.arrayContaining([
        ["consolidation_max_wallets", "4"],
        ["consolidation_ungated_max_wallets", "3"],
        [
          "consolidation_gate_activation_s",
          "1,792,022,400 (2026-10-15 00:00:00 UTC)",
        ],
      ])
    );
    // tdh-v1.4's registry hash and rule ID (P26 §10, vector 28).
    expect(REGISTRY_HASH).toBe(
      "0x3cfa0e6eae7b8769516597e117ecd55580ecb6b75194139f053d3e0ec09d9f36"
    );
    expect(RULE_ID).toBe(
      "0x772d61ed465c80ed3a801927d81183895e4d1f37b069bb9ceaef959a7418ab3f"
    );
    expect(RETIRED_REGISTRY_HASH_V1_0).not.toBe(REGISTRY_HASH);
    // The retired hash is only ever named as tdh-v1.0's.
    for (const [key, text] of Object.entries(MESSAGES)) {
      if (/0x74b4a8f9|0x63e242fa/.test(text)) {
        expect([key, text]).toEqual([key, expect.stringMatching(/tdh-v1\.0/)]);
      }
    }
  });

  it("keeps the fact check of D136 and D137 (f18652e795)", () => {
    // Vector 90: the newest links seed the group, so the wallet the gate
    // refuses is the old member A1, not D4, the wallet linked last (6529chain
    // 3bfa7b0, its derivation); vector 97's refused wallet holds nothing.
    expect(impl["network.tdh.impl.v.90-four-wallet-gate-fails"]).toMatch(
      /the gate refuses the wallet that would join fourth, the old member A1, not D4$/
    );
    noMessageMatches(/so the gate refuses it$/);
    noMessageMatches(/a refused fourth wallet gets fresh time/);
    // DEV-11: 67269e2 was written on October 10 and reached the backend's
    // main branch on October 14, 2026 (PR #2148).
    expect(spec["network.tdh.spec.dev.11.old"]).toMatch(
      /by pair key on the backend’s main branch since October 14, 2026 \(67269e2, written October 10\)$/
    );
    noMessageMatches(/pair key since October 10/);
    // The feed's proof manifest adds generatedAt, source and documents, so
    // its SHA-256 never equals the committed file's.
    expect(formal["network.tdh.formal.builds.shaCommitted"]).toMatch(
      /so its SHA-256 will differ/
    );
    noMessageMatches(/can be matched against it/);
  });

  it("shows no sample data", () => {
    noMessageMatches(/\bsample\b/i);
  });
});
