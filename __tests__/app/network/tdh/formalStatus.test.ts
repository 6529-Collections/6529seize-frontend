import {
  caseLetter,
  countOf,
  sureContext,
} from "@/app/network/tdh/formal/sureShared";
import { createFactBook } from "@/lib/explained/facts";
import type { FactInputs } from "@/lib/explained/factInputs";
import { fixtureFactInputs } from "@/lib/explained/fixtureInputs";
import { parseFormalManifest } from "@/lib/tdh/formal/manifest";
import roundThree from "./fixtures/roundThreeManifest.json";

/**
 * How sure reads its sections, their counts and its drift from the
 * manifest the feed serves: the bundled copy of Oct 16 (round 5, the rules
 * still named tdh-v1.0), an older one (round 3) and none at all.
 */
function withManifest(value: unknown): FactInputs {
  const base = fixtureFactInputs();
  const parsed = parseFormalManifest(value);
  if (!parsed.success || !base.manifest) {
    throw new Error("the fixture manifest does not parse");
  }
  return { ...base, manifest: { ...base.manifest, manifest: parsed.data } };
}

describe("How sure's reading of the manifest", () => {
  it("takes the sections in the manifest's order, with their counts and entries", () => {
    const ctx = sureContext(createFactBook(fixtureFactInputs()), "en-US");
    expect(ctx.sections.map((section) => section.id)).toEqual([
      "1",
      "2",
      "3",
      "4",
      "5a",
      "5b",
      "6",
      "7",
      "stack",
    ]);
    const netting = ctx.sections[0];
    expect(netting?.title).toBe("Netting invariance");
    expect(netting?.counts).toMatchObject({
      proved: 16,
      shownFalse: 7,
      limits: 2,
    });
    expect(
      ctx.sections.reduce((sum, section) => sum + section.entries.length, 0)
    ).toBe(107);
    // The bundled manifest is about TDH v1.4, built from the record's model.
    expect(ctx.olderRules).toBe(false);
    expect(ctx.leanMoved).toBe(false);
  });

  it("reads an older manifest the same way", () => {
    const ctx = sureContext(createFactBook(withManifest(roundThree)), "en-US");
    expect(ctx.sections.length).toBeGreaterThan(0);
    expect(
      ctx.sections.reduce((sum, section) => sum + section.entries.length, 0)
    ).toBe(roundThree.theorems.length);
    expect(ctx.olderRules).toBe(true);
  });

  it("shows no section and no drift without a manifest", () => {
    const ctx = sureContext(
      createFactBook({ ...fixtureFactInputs(), manifest: null }),
      "en-US"
    );
    expect(ctx.sections).toEqual([]);
    expect(ctx.olderRules).toBe(false);
  });

  it("names a counterexample by its letter, and counts carry their list's source", () => {
    expect(caseLetter("1.case-H")).toBe("H");
    expect(caseLetter("1.firstRule_sinks")).toBeNull();
    const book = createFactBook(fixtureFactInputs());
    const base = book.get("manifest.sections");
    expect(countOf(base, 3)).toMatchObject({
      id: "manifest.sections",
      value: 3,
      format: "count",
      source: base.source,
    });
    expect(countOf(null, 3)).toBeNull();
  });
});
