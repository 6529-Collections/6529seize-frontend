import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const selection = require("../../scripts/museum-release-selection.cjs") as {
  CONTRACT: string;
  PACKS: Record<string, readonly string[]>;
  packSelection: (
    classification: { tier: string },
    environment: "pr" | "staging" | "production",
    activation: { effective_mode: "tiered" | "full" }
  ) => { selected_packs: string[]; static_scope: string };
  selectMuseumRelease: (input: {
    activationMode: string;
    base: string;
    environment: "pr" | "staging" | "production";
    head: string;
    holdState: string;
    root: string;
    sourceCommit?: string;
  }) => {
    activation: {
      effective_mode: string;
      hold_state: string;
    };
    classification: { tier: string };
    contract: string;
    selected_packs: string[];
    selection_digest: string;
    source_commit: string | null;
    static_scope: string;
  };
  verifySelectionDigest: (selection: unknown) => boolean;
};

const shadowEvidence = JSON.parse(
  fs.readFileSync(
    path.join(
      process.cwd(),
      "ops/testing-strategy/museum-release-shadow-evidence.v1.json"
    ),
    "utf8"
  )
) as {
  contract: string;
  fixtures: Array<{
    id: string;
    base_sha: string;
    head_sha: string;
    expected_tier: string;
    expected_pr_packs: string[];
  }>;
};

function commit(root: string, message: string) {
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "-m", message], {
    cwd: root,
    stdio: "ignore",
  });
  return execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: root,
    encoding: "utf8",
  }).trim();
}

function write(root: string, relativePath: string, source: string) {
  const target = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, source);
}

describe("Museum release selection", () => {
  it("selects only the About desktop/mobile source-shell contract for a synthetic P0", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "museum-selection-"));
    const component = "components/museum/MuseumNetworkProposition.tsx";
    const focusedTest =
      "__tests__/components/museum/MuseumNetworkProposition.test.tsx";
    try {
      execFileSync("git", ["init"], { cwd: root, stdio: "ignore" });
      execFileSync("git", ["config", "user.name", "Museum test"], {
        cwd: root,
      });
      execFileSync("git", ["config", "user.email", "museum@example.invalid"], {
        cwd: root,
      });
      write(
        root,
        component,
        '<p className={dynamicClass}><span className="tw-text-sm">Copy</span></p>\n'
      );
      write(
        root,
        focusedTest,
        'it("keeps copy readable", () => { expect("sm").toBe("sm"); });\n'
      );
      const base = commit(root, "base");
      write(
        root,
        component,
        '<p className={dynamicClass}><span className="tw-text-base">Copy</span></p>\n'
      );
      write(
        root,
        focusedTest,
        'it("keeps copy readable", () => { expect("sm").toBe("sm"); expect("source").toBe("source"); });\n'
      );
      const head = commit(root, "p0");

      const result = selection.selectMuseumRelease({
        activationMode: "tiered",
        base,
        environment: "pr",
        head,
        holdState: "clear",
        root,
      });

      expect(result).toMatchObject({
        contract: "museum-release-selection-v1",
        classification: { tier: "P0" },
        static_scope: "source-shell-sentinel",
      });
      expect(result.selected_packs).toEqual(["test:e2e:museum-about"]);
      expect(result.selection_digest).toMatch(/^[a-f0-9]{64}$/u);
      expect(selection.verifySelectionDigest(result)).toBe(true);
      expect(
        selection.verifySelectionDigest({
          ...result,
          selected_packs: ["test:e2e:museum-rights"],
        })
      ).toBe(false);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it.each(["P1", "P2", "P3"])("retains every Museum pack for %s", (tier) => {
    const result = selection.packSelection({ tier }, "production", {
      effective_mode: "tiered",
    });

    expect(result.selected_packs).toEqual(selection.PACKS["production"]);
    expect(result.static_scope).toMatch(/affected-plus-broad|full/u);
  });

  it("rejects an unvalidated environment at the exported pack boundary", () => {
    expect(() =>
      selection.packSelection({ tier: "P0" }, "preview" as never, {
        effective_mode: "tiered",
      })
    ).toThrow("environment must be pr, staging, or production");
  });

  it("binds an explicitly resolved source commit into the selection digest", () => {
    const root = process.cwd();
    const head = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: root,
      encoding: "utf8",
    }).trim();
    const base = execFileSync("git", ["rev-parse", "HEAD^"], {
      cwd: root,
      encoding: "utf8",
    }).trim();
    const sourceCommit = "b".repeat(40);

    const result = selection.selectMuseumRelease({
      activationMode: "tiered",
      base,
      environment: "production",
      head,
      holdState: "clear",
      root,
      sourceCommit,
    });

    expect(result.source_commit).toBe(sourceCommit);
    expect(result.selection_digest).toMatch(/^[a-f0-9]{64}$/u);
    expect(() =>
      selection.selectMuseumRelease({
        activationMode: "tiered",
        base,
        environment: "production",
        head,
        holdState: "clear",
        root,
        sourceCommit: "main",
      })
    ).toThrow("source commit must be an exact 40-hex SHA");
  });

  it("selects no Museum packs for unrelated work", () => {
    expect(
      selection.packSelection({ tier: "NONE" }, "staging", {
        effective_mode: "tiered",
      })
    ).toMatchObject({ selected_packs: [], static_scope: "none" });
  });

  it.each([
    ["full", "clear"],
    ["tiered", "active"],
    ["tiered", "unknown"],
    ["malformed", "clear"],
  ])(
    "immediately rolls P0 back to the complete pack inventory for mode %s and hold %s",
    (activationMode, holdState) => {
      const root = process.cwd();
      const head = execFileSync("git", ["rev-parse", "HEAD"], {
        cwd: root,
        encoding: "utf8",
      }).trim();
      const base = execFileSync("git", ["rev-parse", "HEAD^"], {
        cwd: root,
        encoding: "utf8",
      }).trim();
      const result = selection.selectMuseumRelease({
        activationMode,
        base,
        environment: "staging",
        head,
        holdState,
        root,
      });

      expect(result.activation.effective_mode).toBe("full");
      expect(result.selected_packs).toEqual(selection.PACKS["staging"]);
    }
  );

  it("keeps historical shadows exact and never claims a release-count threshold", () => {
    expect(shadowEvidence.contract).toBe("museum-release-shadow-evidence-v1");
    expect(shadowEvidence.fixtures).toHaveLength(3);

    for (const fixture of shadowEvidence.fixtures) {
      const result = selection.selectMuseumRelease({
        activationMode: "tiered",
        base: fixture.base_sha,
        environment: "pr",
        head: fixture.head_sha,
        holdState: "clear",
        root: process.cwd(),
      });

      expect(result.classification.tier).toBe(fixture.expected_tier);
      expect(result.selected_packs).toEqual(fixture.expected_pr_packs);
    }
  });
});
