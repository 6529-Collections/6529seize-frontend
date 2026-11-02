import { PUBLIC_VECTORS_JSON } from "@/components/explained/engine/publicVectors";
import { REGISTRY_V14 } from "@/components/explained/engine/tdh";
import bundledManifest from "@/lib/tdh/formal/bundledManifest.json";
import reference from "@/lib/explained/data/reference.json";
import { createFactBook, fmt, type FactId } from "@/lib/explained/facts";
import type { FactInputs } from "@/lib/explained/factInputs";
import { fixtureFactInputs } from "@/lib/explained/fixtureInputs";
import type { ManifestSectionEntries } from "@/lib/explained/registry/formalFacts";
import type {
  HalfCent,
  ItemRow,
  RegistryRecord,
  VersionRow,
} from "@/lib/explained/registry/referenceFacts";
import { parseFormalManifest } from "@/lib/tdh/formal/manifest";

/**
 * The facts of the TDH reference pages (How sure and the shelf) on the
 * fixture feed of 2026-10-18 09:40 UTC: the manifest's counts by kind and
 * its theorems in Lean, the history the pages restate (each checked against
 * the source that ships with the site), and the values computed from the
 * registry and the editions.
 */
const inputs = fixtureFactInputs();
const book = createFactBook(inputs);
const show = (id: FactId, style: "short" | "long" = "short") =>
  fmt(book.get(id), "en-US", style);

/** The bundled manifest as if built from P26 before the rename (D136, D137). */
function v10Inputs(): FactInputs {
  const manifest = parseFormalManifest({
    ...bundledManifest,
    documents: {
      ...bundledManifest.documents,
      specification: {
        ...bundledManifest.documents.specification,
        lastChange: reference.names.v10.commit.padEnd(40, "0"),
        lastChangeDate: "2026-10-16T00:00:00Z",
      },
    },
  });
  if (!manifest.success) throw new Error("manifest does not parse");
  if (!inputs.manifest) throw new Error("no manifest in the fixture");
  return {
    ...inputs,
    manifest: { ...inputs.manifest, manifest: manifest.data },
  };
}

describe("How sure's facts, from the manifest", () => {
  it("names the rules a manifest is about by its specification commit", () => {
    // The bundled manifest (e252d5f) follows P26 as round 7 left it.
    expect(show("manifest.ruleVersion")).toBe("tdh-v1.4");
    expect(show("manifest.specCommit")).toBe("a731bca");
    expect(
      fmt(createFactBook(v10Inputs()).get("manifest.ruleVersion"), "en-US")
    ).toBe("tdh-v1.0");
  });

  it("sorts the eleven counterexamples by kind, from the entries", () => {
    expect(show("manifest.shownFalse.firstRule")).toBe("5");
    expect(show("manifest.shownFalse.netting")).toBe("2");
    expect(show("manifest.shownFalse.never")).toBe("2");
    expect(show("manifest.shownFalse.p53")).toBe("2");
    const kinds = [
      "manifest.shownFalse.firstRule",
      "manifest.shownFalse.netting",
      "manifest.shownFalse.never",
      "manifest.shownFalse.p53",
    ] as const;
    expect(kinds.reduce((sum, id) => sum + book.num(id), 0)).toBe(
      book.num("manifest.shownFalse")
    );
  });

  it("lists the sections in the manifest's order, each with its entries", () => {
    const ids = book.get<string[]>("manifest.sectionIds").value;
    expect(ids).toEqual(["1", "2", "3", "4", "5a", "5b", "6", "7", "stack"]);
    const entries = ids.flatMap(
      (id) =>
        book.get<ManifestSectionEntries>(`manifest.section.${id}`).value.entries
    );
    expect(entries).toHaveLength(book.num("manifest.entries"));
    const netting =
      book.get<ManifestSectionEntries>("manifest.section.1").value;
    expect(netting.title).toBe("Netting invariance");
    expect(netting.refs).toEqual(["P26 §7.1", "D131"]);
    // Every entry carries the manifest's sentence for it.
    expect(netting.entries.every((entry) => entry.statement !== null)).toBe(
      true
    );
    expect(() => book.get("manifest.section.99")).toThrow(/no section 99/);
  });

  it("prints each theorem in Lean at the manifest's commit, and only there", () => {
    const entries = book
      .get<string[]>("manifest.sectionIds")
      .value.flatMap(
        (id) =>
          book.get<ManifestSectionEntries>(`manifest.section.${id}`).value
            .entries
      );
    const withLean = entries.filter((entry) => entry.lean !== null);
    // The proved theorems and the counterexamples proved in the kernel.
    expect(withLean).toHaveLength(book.num("manifest.audited"));
    expect(show("manifest.leanStatements")).toBe(show("manifest.audited"));
    const headline = entries.find(
      (entry) => entry.id === "1.replayHoldings_invariance"
    );
    expect(headline?.lean).toMatch(/^theorem replayHoldings_invariance /);
    expect(headline?.lean).toContain("∀ k w, h₁.stack k w = h₂.stack k w");
    // The proof is left out.
    expect(headline?.lean).not.toContain(":= by");
    // A manifest from another commit shows no Lean.
    const other = v10Inputs();
    if (!other.manifest) throw new Error("no manifest");
    const moved = createFactBook({
      ...other,
      manifest: {
        ...other.manifest,
        manifest: {
          ...other.manifest.manifest,
          source: { ...other.manifest.manifest.source, commit: "0".repeat(40) },
        },
      },
    });
    expect(moved.maybe("manifest.leanStatements")).toBeNull();
    expect(
      moved
        .get<ManifestSectionEntries>("manifest.section.1")
        .value.entries.every((entry) => entry.lean === null)
    ).toBe(true);
  });

  it("reads what one build checked, from the manifest's own record", () => {
    expect(show("manifest.build.jobs")).toBe("71");
    expect(show("manifest.audit.theorems")).toBe(show("manifest.audited"));
    expect(book.get<string[]>("manifest.audit.axioms").value).toEqual([
      "propext",
      "Classical.choice",
      "Quot.sound",
    ]);
    expect(show("manifest.facts.checks")).toBe("57");
    expect(show("manifest.vectors.reasons.passed")).toBe("108");
    expect(show("manifest.vectors.netting.total")).toBe("4");
  });

  it("reads the Lean model's commit and date from the record", () => {
    expect(show("rules.leanDate")).toBe("Oct 18");
    expect(show("rules.leanCommit")).toBe(show("manifest.commit"));
  });
});

describe("the history the pages restate", () => {
  it("dates the netting sentence's three commits and how long each stood", () => {
    expect(show("netting.day")).toBe("Oct 15");
    expect(show("netting.first.at")).toBe("11:32 UTC");
    expect(show("netting.narrowed.at")).toBe("15:35 UTC");
    expect(show("netting.proved.at")).toBe("18:18 UTC");
    expect(show("netting.first.commit")).toBe("0621ed4");
    expect(show("netting.narrowed.commit")).toBe("16d70d0");
    expect(show("netting.proved.commit")).toBe("1c69528");
    expect(book.num("netting.first.minutes")).toBe(4 * 60 + 3);
    expect(book.num("netting.narrowed.minutes")).toBe(2 * 60 + 43);
  });

  it("states the counterexamples' numbers as the manifest does", () => {
    const sections = bundledManifest.sections ?? [];
    const text = sections.map((section) => section.limits ?? "").join(" ");
    const H = reference.cases.H;
    expect(text).toContain(
      `minted[1] rises from ${H.mintedBefore} to ${H.mintedAfter}`
    );
    expect(text).toContain("Meme 2's rate from 2.00 to 4.00");
    expect(text).toContain(
      `B's final from ${H.finalBefore} to ${H.finalAfter.toLocaleString("en-US")}`
    );
    const I = reference.cases.I;
    expect(text).toContain(`H rises from ${I.hBefore} to ${I.hAfter}`);
    expect(text).toContain(`goes from ${I.finalBefore} to ${I.finalAfter}`);
    const F = reference.cases.F;
    expect(text).toContain(
      `final ${F.wallet}; the identity has boost 1.04 and final ${F.identity}`
    );
    expect(show("cases.H.rate.before")).toBe("2.00");
    expect(show("cases.H.final.after")).toBe("1,600");
  });

  it("names the rules' old registry, the one the bundled manifest's model used", () => {
    expect(show("names.v10.name")).toBe("tdh-v1.0");
    expect(show("names.v10.registry", "long")).toBe(
      inputs.feed?.latest.day.implementations.rust.registryHash ??
        "a registry hash"
    );
    expect(show("names.renamedAt")).toBe("Oct 18");
    expect(show("names.v10.maxWallets")).toBe("3");
  });

  it("serves the public vectors the page lists", () => {
    const served = Object.keys(
      (JSON.parse(PUBLIC_VECTORS_JSON) as { vectors: Record<string, unknown> })
        .vectors
    );
    expect(book.get<string[]>("vectors.public").value).toEqual(served);
    expect(show("vectors.public.count")).toBe(String(served.length));
  });

  it("dates every past boost schedule and keeps them in order", () => {
    const past = book.get<VersionRow[]>("versions.past").value;
    expect(past.map((row) => row.version)).toEqual(["1.3", "1.2", "1.1"]);
    for (const row of past) {
      expect(Date.parse(row.from)).toBeLessThan(Date.parse(row.to));
    }
    expect(show("versions.current.since")).toBe("Oct 10");
  });
});

describe("values computed from the registry and the editions", () => {
  it("prints the registry the engine computes on", () => {
    const record = book.get<RegistryRecord>("rules.registryRecord").value;
    expect(record["edition_floor_cap"]).toBe(REGISTRY_V14.edition_floor_cap);
    expect(show("rules.firstgmAdjustment")).toBe("-2,588");
    expect(show("rules.additionalSetFirst")).toBe("0.05");
    expect(show("rules.additionalSetRatio")).toBe("0.6529");
    expect(show("rules.gateActivationSeconds")).toBe("1,792,022,400");
    expect(show("rules.gateDay", "long")).toBe("October 15, 2026");
    expect(show("rules.eligibilityAge")).toBe("86,400");
    expect(show("rules.contract.memes", "long")).toBe(REGISTRY_V14.memes);
  });

  it("counts FirstGM's minted copies as its edition less the adjustment", () => {
    expect(
      book.num("firstgm.minted") + book.num("rules.firstgmAdjustment")
    ).toBe(book.num("meme.8.edition"));
  });

  it("finds the half-cent editions of today's H and one that rounds down", () => {
    const trap = book.get<HalfCent>("engine.halfCent").value;
    expect(trap.h).toBe(book.num("engine.H"));
    expect(trap.editions).toEqual([8, 40, 56, 200, 280, 1400]);
    expect(trap.rate).toBe(trap.halfUp - 1);
    expect(trap.editions).toContain(trap.example);
  });

  it("pays the seasons before the current one, and the full set at most at the last boosted season", () => {
    expect(show("engine.seasons.paying")).toBe("16");
    expect(show("rules.fullSetCeiling")).toBe("2.00");
    expect(show("memes.readOn", "long")).toBe("October 18, 2026");
  });

  it("lists P26's deviations and issues by ID, one settled by D136", () => {
    const deviations = book.get<ItemRow[]>("spec.deviations").value;
    // P26 round 7 (a731bca) added DEV-20 to DEV-22 and BUG-16.
    expect(deviations).toHaveLength(22);
    expect(deviations.filter((item) => item.settled)).toEqual([
      { id: "DEV-11", settled: true },
    ]);
    expect(show("spec.deviations.inForce")).toBe("21");
    expect(show("spec.issues")).toBe("16");
    expect(book.get<string[]>("spec.issueIds").value[15]).toBe("BUG-16");
  });
});
