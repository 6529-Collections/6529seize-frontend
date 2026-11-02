/** @jest-environment node */
import { readFileSync } from "node:fs";
import path from "node:path";
import { REGISTRY_V14 } from "@/components/explained/engine/tdh";
import { lintNumbers, lintVoice } from "@/lib/explained/voice";

/**
 * The message files of How it works, Your wallets and Consolidation design
 * (TDH-DESIGN.md §2, EXPLAINED.md §12): every locale has the en-US keys with
 * the same placeholders, every string passes the voice and number lints,
 * and the few numbers the final copy spells out as words still match the
 * rule registry they describe.
 */
const MESSAGES = path.resolve(__dirname, "../../../../i18n/messages");
const FILES = ["explainedTdhHow", "explainedTdhWallets", "explainedTdhDesign"];
const LOCALES = ["en-US", "en-GB", "fr-FR", "es-ES", "de-DE"];

function load(name: string): Record<string, string> {
  return JSON.parse(readFileSync(path.join(MESSAGES, name), "utf8")) as Record<
    string,
    string
  >;
}

const holes = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();

describe.each(FILES)("%s", (file) => {
  const source = load(`${file}.en-US.json`);

  it.each(LOCALES)("%s has every key, with the same placeholders", (locale) => {
    const other = load(`${file}.${locale}.json`);
    expect(Object.keys(other).sort()).toEqual(Object.keys(source).sort());
    for (const [key, text] of Object.entries(source)) {
      expect([key, holes(other[key] ?? "")]).toEqual([key, holes(text)]);
    }
  });

  it.each(LOCALES)("%s passes the voice and number lints", (locale) => {
    const messages = load(`${file}.${locale}.json`);
    expect(lintVoice(messages)).toEqual([]);
    expect(lintNumbers(messages)).toEqual([]);
  });
});

describe("numbers the copy spells out", () => {
  const how = load("explainedTdhHow.en-US.json");
  const wallets = load("explainedTdhWallets.en-US.json");

  it("four wallets, a fifth pushed out: the registry's maximum", () => {
    expect(REGISTRY_V14.consolidation_max_wallets).toBe(4);
    expect(REGISTRY_V14.consolidation_ungated_max_wallets).toBe(3);
    expect(wallets["explained.tdh.wallets.title"]).toMatch(
      /Up to four wallets/
    );
    expect(wallets["explained.tdh.wallets.lens.break"]).toMatch(/fifth/);
    expect(wallets["explained.tdh.wallets.rule.body"]).toMatch(
      /Up to three wallets group as before/
    );
  });

  it("a sixth Gradient: one past the registry's five", () => {
    expect(REGISTRY_V14.gradient_max_count).toBe(5);
    expect(how["explained.tdh.how.boost.break"]).toMatch(/sixth/);
  });
});
