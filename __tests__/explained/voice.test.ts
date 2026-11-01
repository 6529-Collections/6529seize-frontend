import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  AMBER,
  lintNumbers,
  lintVoice,
  typedNumbers,
} from "@/lib/explained/voice";

/**
 * SCORECARD.md S3 and S8: the voice lint list passes on every 6529
 * Explained string, no copy types a number a fact should fill, and no
 * Explained file uses amber.
 */
const ROOT = path.resolve(__dirname, "../..");
const MESSAGES = path.join(ROOT, "i18n/messages");

const explainedFiles = readdirSync(MESSAGES).filter((name) =>
  /^explained[A-Za-z]*\.[a-z]{2}-[A-Z]{2}\.json$/.test(name)
);

function load(name: string): Record<string, string> {
  return JSON.parse(readFileSync(path.join(MESSAGES, name), "utf8")) as Record<
    string,
    string
  >;
}

function walk(dir: string, out: string[] = []): string[] {
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch {
    return out;
  }
  for (const name of names) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(tsx?|css)$/.test(name)) out.push(full);
  }
  return out;
}

describe("the voice lint", () => {
  it("finds the message files of every locale", () => {
    expect(explainedFiles).toEqual(
      expect.arrayContaining([
        "explainedKit.en-US.json",
        "explainedKit.en-GB.json",
        "explainedKit.fr-FR.json",
        "explainedKit.es-ES.json",
        "explainedKit.de-DE.json",
      ])
    );
  });

  it.each(explainedFiles)("%s passes the lint list", (name) => {
    expect(lintVoice(load(name))).toEqual([]);
  });

  it.each(explainedFiles)("%s types no number a fact should fill", (name) => {
    expect(lintNumbers(load(name))).toEqual([]);
  });

  it("every locale has the en-US keys, with the same placeholders", () => {
    const source = load("explainedKit.en-US.json");
    for (const name of explainedFiles.filter((file) =>
      file.startsWith("explainedKit.")
    )) {
      const other = load(name);
      expect(Object.keys(other).sort()).toEqual(Object.keys(source).sort());
      for (const [key, text] of Object.entries(source)) {
        const holes = (value: string) => (value.match(/\{\w+\}/g) ?? []).sort();
        expect([name, key, holes(other[key] ?? "")]).toEqual([
          name,
          key,
          holes(text),
        ]);
      }
    }
  });

  it("catches each item of the lint list", () => {
    const hit = (text: string, key = "explained.x") =>
      lintVoice({ [key]: text }).map((h) => h.rule);
    expect(hit("Recomputed independently every day")).toEqual(["independent"]);
    expect(hit("Proof A is proved to Ethereum")).toEqual([
      "proved-to-ethereum",
      "proven-on-ethereum",
    ]);
    expect(hit("Proven on Ethereum")).toEqual(["proven-on-ethereum"]);
    expect(hit("Proofs of a day, checked on Ethereum.")).toEqual([
      "proven-on-ethereum",
    ]);
    expect(hit("Auf Ethereum bewiesen")).toEqual(["proven-on-ethereum"]);
    expect(hit("Not recorded on Ethereum yet.")).toEqual([]);
    expect(hit("Proof A lives on Ethereum now")).toEqual([
      "proof-a-on-ethereum",
    ]);
    expect(hit("Recorded on Ethereum, once both proofs exist")).toEqual([]);
    expect(hit("TDH is checked in public")).toEqual(["checked-in-public"]);
    expect(hit("Fully verified.")).toEqual(["overclaim"]);
    expect(hit("trustless and mathematically proven")).toEqual(["overclaim"]);
    expect(hit("The rules of TDH-v1 apply")).toEqual(["old-rule-name"]);
    expect(hit("rule version tdh-v1.0")).toEqual(["old-rule-name"]);
    expect(hit("TDH v1.4")).toEqual([]);
    expect(hit("The fourth wallet is pending an owner decision.")).toEqual([
      "fourth-wallet-pending",
    ]);
    expect(hit("Validator v1 agrees on TDH once a day")).toEqual([
      "validator-v1",
    ]);
    expect(hit("Explained", "explained.kit.verdict.knownCause")).toEqual([
      "explained-verdict",
    ]);
    expect(hit("6529 Explained")).toEqual([]);
    // D142 named NIC: the name is allowed, the credit never.
    expect(hit("Network Identity Check")).toEqual([]);
    expect(hit("Network Identity Credits")).toEqual(["nic-credit"]);
    expect(hit("a Network Identity Credit")).toEqual(["nic-credit"]);
    expect(hit("Network Identity Credit")).toEqual(["nic-credit"]);
    expect(hit("NIC is Network Identity Check (D142)")).toEqual([]);
    expect(hit("CCO art")).toEqual(["cco"]);
    expect(hit("CC0 art")).toEqual([]);
    expect(hit("a DAO")).toEqual(["dao"]);
    expect(hit("to the moon")).toEqual(["casino"]);
  });

  it("allows names with digits, and flags quantities", () => {
    expect(
      typedNumbers(
        "CC0 for The Memes, D89; P26 §5.2; card #562; 6529.io; SHA-256; TDH v1.4; {count} cards"
      )
    ).toEqual([]);
    expect(typedNumbers("about 3,941 a day")).toEqual(["3,941"]);
    expect(typedNumbers("version 0.1.0")).toEqual(["0.1.0"]);
    expect(typedNumbers("a 24-hour average")).toEqual(["24"]);
  });
});

describe("no amber", () => {
  const roots = ["components/explained", "lib/explained", "app/explained"].map(
    (dir) => path.join(ROOT, dir)
  );
  const kitFiles = roots
    .flatMap((dir) => walk(dir))
    .filter((file) => !file.endsWith("voice.ts"));
  // A page built on the kit imports its UI. The engine (lane E) is
  // arithmetic, not UI: the TDH pages that only compute with it keep their
  // own colours until their chapter lane rebuilds them on the kit.
  const KIT_UI_IMPORT = /@\/components\/explained\/(?!engine\/)/;
  const kitUsers = walk(path.join(ROOT, "app")).filter((file) =>
    KIT_UI_IMPORT.test(readFileSync(file, "utf8"))
  );

  it("scans the kit and every page built on it", () => {
    expect(kitFiles.length).toBeGreaterThan(20);
  });

  it.each(
    [...new Set([...kitFiles, ...kitUsers])].map((file) => [
      path.relative(ROOT, file),
    ])
  )("%s uses no amber", (file) => {
    expect(AMBER.test(readFileSync(path.join(ROOT, file), "utf8"))).toBe(false);
  });
});
