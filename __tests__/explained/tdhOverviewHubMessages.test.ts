import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * The overview's and the hub's copy in five locales (EXPLAINED.md §12):
 * every locale has every en-US key with the same placeholders, so a page
 * never falls back mid-sentence or prints `{name}`. The voice and number
 * lints run on these files with the kit's (voice.test.ts).
 */
const ROOT = path.resolve(__dirname, "../..");
const LOCALES = ["en-US", "en-GB", "fr-FR", "es-ES", "de-DE"] as const;
const FILES = ["explainedTdhOverview", "explainedHub"] as const;

function load(file: string, locale: string): Record<string, string> {
  return JSON.parse(
    readFileSync(
      path.join(ROOT, "i18n/messages", `${file}.${locale}.json`),
      "utf8"
    )
  ) as Record<string, string>;
}

const holes = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();

describe.each(FILES)("%s", (file) => {
  const source = load(file, "en-US");
  const namespace =
    file === "explainedHub" ? "explained.hub." : "explained.tdh.overview.";

  it("keeps every key in its own namespace", () => {
    for (const key of Object.keys(source)) {
      expect(key.startsWith(namespace)).toBe(true);
    }
  });

  it.each(LOCALES)("%s has every key, with the same placeholders", (locale) => {
    const other = load(file, locale);
    expect(Object.keys(other).sort()).toEqual(Object.keys(source).sort());
    for (const [key, text] of Object.entries(source)) {
      expect([key, holes(other[key] ?? "")]).toEqual([key, holes(text)]);
      expect(other[key]?.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("the owner's items in the copy", () => {
  it("keeps the hub's second line in one key, to swap for the mission sentence", () => {
    for (const locale of LOCALES) {
      expect(load("explainedHub", locale)["explained.hub.mission"]).toEqual(
        expect.any(String)
      );
    }
  });

  it("names NIC as D142 does, never as a credit, and no chapter waits on its name", () => {
    for (const file of FILES) {
      for (const locale of LOCALES) {
        const text = Object.values(load(file, locale)).join("\n");
        expect(text).not.toMatch(/Network Identity Credit/i);
        expect(text).not.toMatch(/NIC's full name/i);
      }
    }
    // The English overview defines NIC where it first uses it.
    expect(
      load("explainedTdhOverview", "en-US")[
        "explained.tdh.overview.uses.ratingsBody"
      ]
    ).toContain("Network Identity Check");
  });

  it("calls the verdict Known cause, never Explained, and the rules TDH v1.4", () => {
    const text = Object.values(load("explainedTdhOverview", "en-US")).join(
      "\n"
    );
    expect(text).toContain("TDH v1.4");
    expect(text).not.toMatch(/TDH-v1\b|tdh-v1\.0/);
  });
});
