import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const selection = require("../../scripts/museum-release-selection.cjs") as {
  CONTRACT: string;
  PACKS: Record<string, readonly string[]>;
  fileEffect: (file: string) => { effect: string; packs?: string[] };
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
    affected_pages: {
      affected_surfaces: string[];
      analysis_error?: string;
      file_effects: Array<{ file: string; effect: string; reason: string }>;
    } | null;
    browser_scope: string;
    classification: { tier: string };
    contract: string;
    selected_packs: string[];
    selection_digest: string;
    source_commit: string | null;
    static_scope: string;
  };
  verifySelectionDigest: (selection: unknown) => boolean;
};

const manifestMuseumPacks = (
  require("../../tests/packs.manifest.cjs") as {
    PACKS: Array<{
      alias?: string;
      changeScope?: string;
      environments: string[];
      scriptKey: string;
    }>;
  }
).PACKS.filter((pack) => pack.changeScope === "museum");

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
    expected_pr_browser_scope: string;
    expected_staging_packs: string[];
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

  it.each(["P1", "P2", "P3"])(
    "fails closed to every Museum pack for %s without an affected-page analysis",
    (tier) => {
      const result = selection.packSelection({ tier }, "production", {
        effective_mode: "tiered",
      });

      expect(result.selected_packs).toEqual(selection.PACKS["production"]);
      expect(result.static_scope).toBe("full");
    }
  );

  it("keeps Network IA as the PR gate and a deployed pack", () => {
    expect(selection.PACKS["pr"]).not.toContain("test:e2e:museum-network-ia");
    expect(selection.PACKS["staging"]).toContain("museum-network-ia");
    expect(selection.PACKS["production"]).toContain("museum-network-ia");
  });

  // Deployed E2E workflows validate selections against the deployed manifest,
  // so the selector must choose from exactly the packs that manifest defines.
  it.each(["staging", "production"])(
    "selects from exactly the %s Museum packs in the manifest",
    (environment) => {
      const manifestAliases = manifestMuseumPacks
        .filter((pack) => pack.environments.includes(environment))
        .map((pack) => pack.alias);
      expect([...(selection.PACKS[environment] ?? [])].sort()).toEqual(
        manifestAliases.sort()
      );
    }
  );

  it("selects from exactly the local Museum packs apart from the PR gate", () => {
    const localScripts = manifestMuseumPacks
      .filter((pack) => pack.environments.includes("local"))
      .map((pack) => pack.scriptKey);
    expect(
      [...(selection.PACKS["pr"] ?? []), "test:e2e:museum-network-ia"].sort()
    ).toEqual(localScripts.sort());
  });

  it.each([
    ["__tests__/components/museum/MuseumShell.test.tsx", "none"],
    [".github/workflows/deploy-staging.yml", "none"],
    ["app/about/page.tsx", "none"],
    [".github/workflows/app-pr-ci.yml", "gate"],
    ["pnpm-lock.yaml", "gate"],
    ["scripts/museum-release-selection.cjs", "all"],
    ["ops/testing-strategy/museum-surface-registry.v1.json", "all"],
    ["tests/packs.manifest.cjs", "all"],
    ["tests/museum/support-fixture.ts", "all"],
    ["lib/museum/publication/load.ts", "all"],
    ["components/museum/MuseumShell.tsx", "all"],
    ["tests/museum/rights-readonly.spec.ts", "packs"],
    ["components/museum/MuseumObjectMetadata.ts", "surfaces"],
    ["i18n/messages/museum.en-US.json", "surfaces"],
    ["public/museum/research/editorial/inside-system.svg", "surfaces"],
  ])("classifies %s as a %s selection effect", (file, effect) => {
    expect(selection.fileEffect(file).effect).toBe(effect);
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
    expect(shadowEvidence.fixtures).toHaveLength(5);

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
      expect(result.browser_scope).toBe(fixture.expected_pr_browser_scope);

      const staging = selection.selectMuseumRelease({
        activationMode: "tiered",
        base: fixture.base_sha,
        environment: "staging",
        head: fixture.head_sha,
        holdState: "clear",
        root: process.cwd(),
      });
      expect(staging.selected_packs).toEqual(fixture.expected_staging_packs);
    }
  });

  describe("affected-page selection on synthetic ranges", () => {
    function selectRange(
      files: Record<string, string>,
      environment: "pr" | "staging",
      baseFiles: Record<string, string> = {}
    ) {
      const root = fs.mkdtempSync(path.join(os.tmpdir(), "museum-affected-"));
      try {
        execFileSync("git", ["init"], { cwd: root, stdio: "ignore" });
        execFileSync("git", ["config", "user.name", "Museum test"], {
          cwd: root,
        });
        execFileSync(
          "git",
          ["config", "user.email", "museum@example.invalid"],
          { cwd: root }
        );
        write(root, "README.md", "base\n");
        for (const [file, source] of Object.entries(baseFiles)) {
          write(root, file, source);
        }
        const base = commit(root, "base");
        for (const [file, source] of Object.entries(files)) {
          write(root, file, source);
        }
        const head = commit(root, "head");
        return selection.selectMuseumRelease({
          activationMode: "tiered",
          base,
          environment,
          head,
          holdState: "clear",
          root,
        });
      } finally {
        fs.rmSync(root, { recursive: true, force: true });
      }
    }

    it("skips browser coverage for Museum unit tests and unrelated workflows", () => {
      const result = selectRange(
        {
          "__tests__/components/museum/MuseumShell.test.tsx": "it.todo('x');\n",
          ".github/workflows/deploy-staging.yml": "name: x\n",
        },
        "pr"
      );
      expect(result.browser_scope).toBe("none");
      expect(result.selected_packs).toEqual([]);
    });

    it("runs only the Network IA gate for dependency changes", () => {
      const files = { "package.json": "{}\n" };
      const pr = selectRange(files, "pr");
      expect(pr.browser_scope).toBe("gate-only");
      expect(pr.selected_packs).toEqual([]);
      expect(selectRange(files, "staging").selected_packs).toEqual([
        "museum-network-ia",
      ]);
    });

    it("runs the changed spec's pack for a Museum spec edit", () => {
      const result = selectRange(
        { "tests/museum/rights-readonly.spec.ts": "test.todo('x');\n" },
        "pr"
      );
      expect(result.browser_scope).toBe("affected-pages");
      expect(result.selected_packs).toEqual(["test:e2e:museum-rights"]);
    });

    it("runs every pack when the selection machinery changes", () => {
      const result = selectRange(
        { "scripts/museum-release-selection.cjs": "// changed\n" },
        "pr"
      );
      expect(result.browser_scope).toBe("all-museum-packs");
      expect(result.selected_packs).toEqual(selection.PACKS["pr"]);
    });

    it("fails closed to every pack when a page change cannot be mapped", () => {
      const result = selectRange(
        { "lib/museum/unmapped.ts": "export const value = 1;\n" },
        "staging"
      );
      expect(result.selected_packs).toEqual(selection.PACKS["staging"]);
      expect(result.affected_pages?.analysis_error).toEqual(expect.any(String));
    });

    it("matches copy keys only as exact literals", () => {
      const messages = JSON.stringify({ "museum.network.home": "Home" });
      const prefixOnly = selectRange(
        { "i18n/messages/museum.en-US.json": messages },
        "pr",
        {
          "components/museum/MuseumHome.tsx":
            'export const key = "museum.network.homeTitle";\n',
        }
      );
      const effect = prefixOnly.affected_pages?.file_effects.find(
        (entry) => entry.file === "i18n/messages/museum.en-US.json"
      );
      expect(effect).toMatchObject({
        effect: "all",
        reason: "The changed Museum file could not be mapped to a page.",
      });
      expect(prefixOnly.affected_pages?.analysis_error).toBeUndefined();

      // An exact literal is found and handed to the surface registry, which
      // this synthetic repository does not have.
      const exact = selectRange(
        { "i18n/messages/museum.en-US.json": messages },
        "pr",
        {
          "components/museum/MuseumHome.tsx":
            'export const key = "museum.network.home";\n',
        }
      );
      expect(exact.affected_pages?.analysis_error).toEqual(expect.any(String));
    });
  });
});
