import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import record from "@/lib/explained/data/record.json";
import {
  findDrift,
  namedInDriftNotes,
  unknownDecisions,
  type DecisionRef,
} from "@/lib/explained/drift";
import pages from "@/lib/explained/pages.json";

/**
 * The drift check, run in CI (SCORECARD.md S4): no page relies on a
 * decision that a newer one in the record touches, unless the page names
 * the newer one in a DriftNote. The record snapshot is refreshed from
 * 6529chain by scripts/explained/sync-record.mjs at the fact gate.
 */
const ROOT = path.resolve(__dirname, "../..");

/** The files a page's `sources` globs name: `dir/*` one level, `dir/**` all. */
function sourceFiles(globs: readonly string[]): string[] {
  const files: string[] = [];
  const walk = (dir: string, deep: boolean) => {
    let names: string[];
    try {
      names = readdirSync(dir);
    } catch {
      return;
    }
    for (const name of names) {
      const full = path.join(dir, name);
      if (statSync(full).isDirectory()) {
        if (deep) walk(full, true);
      } else if (/\.(tsx?|json)$/.test(name)) {
        files.push(full);
      }
    }
  };
  for (const glob of globs) {
    const deep = glob.endsWith("/**");
    const shallow = glob.endsWith("/*");
    if (deep || shallow) {
      walk(path.join(ROOT, glob.replace(/\/\*\*?$/, "")), deep);
    } else {
      try {
        if (statSync(path.join(ROOT, glob)).isFile())
          files.push(path.join(ROOT, glob));
      } catch {
        // a page not built yet has no sources
      }
    }
  }
  return files;
}

const decisions: readonly DecisionRef[] = record.decisions;

describe("the drift check", () => {
  it("reads a snapshot of the record with every decision and its citations", () => {
    expect(record.head.newestDecision).toMatch(/^D\d+$/);
    expect(decisions.length).toBeGreaterThan(100);
    const d137 = decisions.find((decision) => decision.id === "D137");
    expect(d137?.refs).toContain("D112");
  });

  it.each(pages.pages.map((page) => [page.id, page] as const))(
    "%s relies on no decision a newer one touches without naming it",
    (_id, page) => {
      expect(unknownDecisions(page, decisions)).toEqual([]);
      const named = new Set<string>();
      for (const file of sourceFiles(page.sources)) {
        for (const id of namedInDriftNotes(readFileSync(file, "utf8")))
          named.add(id);
      }
      expect(findDrift(page, decisions, named)).toEqual([]);
    }
  );

  it("fails on a newer decision that touches a page, until a DriftNote names it", () => {
    const newer = [...decisions, { id: "D142", refs: ["D136", "D86"] }];
    const page = { id: "wallets", dependsOn: ["D136"], checkedThrough: "D141" };
    expect(findDrift(page, newer, new Set())).toEqual([
      { page: "wallets", decision: "D142", touches: ["D136"] },
    ]);
    const source = 'x <DriftNote by={["D142"]} locale={locale}>…</DriftNote>';
    expect(findDrift(page, newer, namedInDriftNotes(source))).toEqual([]);
    // a page re-checked through D142 no longer needs the note
    expect(
      findDrift({ ...page, checkedThrough: "D142" }, newer, new Set())
    ).toEqual([]);
    // a newer decision that touches nothing the page relies on is not drift
    expect(
      findDrift({ ...page, dependsOn: ["D89"] }, newer, new Set())
    ).toEqual([]);
  });

  it("names the drift notes a source carries, several per note", () => {
    const named = namedInDriftNotes(
      '<DriftNote locale={l} by={["D136", "D137"]}>a</DriftNote>\n<DriftNote by={["D132"]} inline>b</DriftNote>'
    );
    expect([...named].sort()).toEqual(["D132", "D136", "D137"]);
  });

  it("flags a decision the record does not have", () => {
    expect(
      unknownDecisions(
        { id: "x", dependsOn: ["D999"], checkedThrough: "D141" },
        decisions
      )
    ).toEqual(["D999"]);
  });
});
