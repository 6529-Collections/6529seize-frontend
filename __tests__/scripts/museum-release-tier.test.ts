import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const classifier = require("../../scripts/museum-release-tier.cjs");

const componentPath = "components/museum/MuseumNetworkProposition.tsx";
const testPath =
  "__tests__/components/museum/MuseumNetworkProposition.test.tsx";

function classify(
  entries: Array<{ file: string; status: string }>,
  before = '<p className="tw-text-sm">Copy</p>',
  after = '<p className="tw-text-base">Copy</p>'
) {
  return classifier.classifyEntries(entries, {
    readFileAt: (side: "base" | "head") => (side === "base" ? before : after),
  });
}

describe("Museum release report-only classifier", () => {
  it("classifies an exact registered className-only component change as P0", () => {
    const result = classify([
      { file: componentPath, status: "M" },
      { file: testPath, status: "M" },
    ]);

    expect(result.tier).toBe("P0");
    expect(result.affected_surfaces).toEqual(["museum.about.proposition"]);
    expect(result.presentation_proof).toMatchObject({ eligible: true });
  });

  it.each([
    [
      "JSX structure",
      '<p className="tw-text-sm">Copy</p>',
      '<div><p className="tw-text-base">Copy</p></div>',
    ],
    [
      "behavior",
      '<p className="tw-text-sm">Copy</p>',
      '<p className="tw-text-base" onClick={() => alert(1)}>Copy</p>',
    ],
    [
      "non-literal className",
      '<p className="tw-text-sm">Copy</p>',
      "<p className={value}>Copy</p>",
    ],
    [
      "restricted presentation token",
      '<p className="tw-text-sm">Copy</p>',
      '<p className="tw-hidden">Copy</p>',
    ],
  ])("escalates a %s change", (_name, before, after) => {
    expect(
      classify([{ file: componentPath, status: "M" }], before, after).tier
    ).toBe("P2");
  });

  it("classifies publication and classifier policy changes as P3", () => {
    expect(
      classify([{ file: "lib/museum/publication/runtime.ts", status: "M" }])
        .tier
    ).toBe("P3");
    expect(
      classify([{ file: "scripts/museum-release-tier.cjs", status: "M" }]).tier
    ).toBe("P3");
  });

  it("classifies unrelated paths as NONE", () => {
    expect(
      classify([{ file: "components/header/AppHeader.tsx", status: "M" }]).tier
    ).toBe("NONE");
  });

  it("classifies a Museum copy or stylesheet change as P1", () => {
    expect(classify([{ file: "styles/museum.css", status: "M" }]).tier).toBe(
      "P1"
    );
  });

  it.each([
    [
      { file: "app/museum/network/page.tsx", status: "M" },
      { file: "styles/museum.css", status: "M" },
    ],
    [
      { file: "styles/museum.css", status: "M" },
      { file: "app/museum/network/page.tsx", status: "M" },
    ],
  ])(
    "keeps a mixed P1/P2 change at P2 regardless of file order",
    (...entries) => {
      expect(classify(entries).tier).toBe("P2");
    }
  );

  it("fails closed when the registered component is added or deleted", () => {
    expect(classify([{ file: componentPath, status: "A" }]).tier).toBe("P2");
    expect(classify([{ file: componentPath, status: "D" }]).tier).toBe("P2");
  });

  it("falls back to P2 when a registered presentation blob is unreadable", () => {
    const result = classifier.classifyEntries(
      [{ file: componentPath, status: "M" }],
      {
        readFileAt: () => {
          throw new Error("missing blob");
        },
      }
    );

    expect(result.tier).toBe("P2");
  });

  it("rejects a missing option value instead of consuming the next flag", () => {
    expect(classifier.readOption(["--base", "--head", "HEAD"], "--base")).toBe(
      ""
    );
  });

  it("classifies an exact committed Git range and binds its identity", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "museum-tier-"));
    try {
      execFileSync("git", ["init"], { cwd: root, stdio: "ignore" });
      execFileSync("git", ["config", "user.name", "Museum test"], {
        cwd: root,
      });
      execFileSync("git", ["config", "user.email", "museum@example.invalid"], {
        cwd: root,
      });
      const component = path.join(root, componentPath);
      fs.mkdirSync(path.dirname(component), { recursive: true });
      fs.writeFileSync(component, '<p className="tw-text-sm">Copy</p>\n');
      execFileSync("git", ["add", componentPath], { cwd: root });
      execFileSync("git", ["commit", "-m", "base"], {
        cwd: root,
        stdio: "ignore",
      });
      const base = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      }).trim();
      fs.writeFileSync(component, '<p className="tw-text-base">Copy</p>\n');
      execFileSync("git", ["add", componentPath], { cwd: root });
      execFileSync("git", ["commit", "-m", "head"], {
        cwd: root,
        stdio: "ignore",
      });
      const head = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      }).trim();

      const result = classifier.classifyRange(root, base, head);

      expect(result).toMatchObject({
        base_sha: base,
        head_sha: head,
        mode: "report_only",
        tier: "P0",
      });
      expect(result.classification_digest).toMatch(/^[a-f0-9]{64}$/u);
      const { classification_digest: digest, ...unsigned } = result;
      expect(digest).toBe(
        classifier.withClassificationDigest(unsigned).classification_digest
      );
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
