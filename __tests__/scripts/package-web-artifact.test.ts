import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type ArtifactProfile = "production" | "staging";

interface ArtifactInput {
  readonly repoRoot: string;
  readonly bundleRoot: string;
  readonly profile: ArtifactProfile;
}

const {
  assertProfileBundle,
  assertZipListing,
  assertZipListingSafety,
  expectedBundleEntries,
  parseCli,
  parseZipListing,
  prepareProfileBundle,
} = require("../../scripts/package-web-artifact.cjs") as {
  assertProfileBundle(input: ArtifactInput): void;
  assertZipListing(
    input: ArtifactInput & {
      readonly listingFile: string;
      readonly extractedRoot: string;
    }
  ): void;
  assertZipListingSafety(
    input: ArtifactInput & { readonly listingFile: string }
  ): void;
  expectedBundleEntries(bundleRoot: string): readonly string[];
  parseCli(argv: readonly string[]): {
    readonly command: "prepare" | "assert-listing" | "assert-zip";
    readonly profile: ArtifactProfile;
    readonly repoRoot: string;
    readonly bundleRoot: string;
  };
  parseZipListing(listing: string): readonly string[];
  prepareProfileBundle(input: ArtifactInput): void;
};

const SCRIPT = path.join(process.cwd(), "scripts/package-web-artifact.cjs");

function writeFile(root: string, relativePath: string, value: string): string {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
  return filePath;
}

function writeRuntimeConfig(
  bundleRoot: string,
  value: Record<string, unknown>
): void {
  writeFile(
    bundleRoot,
    ".next/PUBLIC_RUNTIME.json",
    `${JSON.stringify(value, null, 2)}\n`
  );
}

const fixtureRoots: string[] = [];

function createFixture(): { readonly repoRoot: string; bundleRoot: string } {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "web-artifact-"));
  fixtureRoots.push(repoRoot);
  const bundleRoot = path.join(repoRoot, "artifact", "bundle");
  writeFile(bundleRoot, "server.js", "console.log('fixture');\n");
  writeRuntimeConfig(bundleRoot, {
    BASE_ENDPOINT: "https://6529.io",
    GIPHY_API_KEY: "test-giphy-client-key",
  });
  writeFile(repoRoot, "public/favicon.svg", "<svg />\n");
  writeFile(repoRoot, "public/help-index.json", "{}\n");
  writeFile(repoRoot, "public/emojis/smile.webp", "webp\n");
  return { repoRoot, bundleRoot };
}

function copyExtractedBundle(fixture: { readonly repoRoot: string }): string {
  const extractedRoot = path.join(fixture.repoRoot, "artifact", "extracted");
  fs.cpSync(path.join(fixture.repoRoot, "artifact", "bundle"), extractedRoot, {
    recursive: true,
    dereference: false,
  });
  return extractedRoot;
}

function writeListing(fixture: {
  readonly repoRoot: string;
  readonly bundleRoot: string;
}): string {
  return writeFile(
    fixture.repoRoot,
    "package.listing",
    `${expectedBundleEntries(fixture.bundleRoot)
      .map((entry) => `./${entry}`)
      .join("\n")}\n`
  );
}

afterEach(() => {
  for (const root of fixtureRoots.splice(0)) {
    const resolved = path.resolve(root);
    expect(resolved).toContain(path.resolve(os.tmpdir()));
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});

describe("web artifact packaging", () => {
  it.each(["production", "staging"] as const)(
    "replaces a traced standalone public tree with the exact source tree (%s)",
    (profile) => {
      const fixture = createFixture();
      writeFile(fixture.bundleRoot, "public/stale.txt", "stale\n");

      prepareProfileBundle({ ...fixture, profile });

      expect(
        fs.existsSync(path.join(fixture.bundleRoot, "public/stale.txt"))
      ).toBe(false);
      expect(
        fs.readFileSync(
          path.join(fixture.bundleRoot, "public/emojis/smile.webp"),
          "utf8"
        )
      ).toBe("webp\n");
    }
  );

  it("refuses to replace a symbolic-link standalone public destination", () => {
    const fixture = createFixture();
    const externalPublic = path.join(fixture.repoRoot, "external-public");
    writeFile(fixture.repoRoot, "external-public/keep.txt", "keep\n");
    fs.symlinkSync(
      externalPublic,
      path.join(fixture.bundleRoot, "public"),
      process.platform === "win32" ? "junction" : "dir"
    );

    expect(() =>
      prepareProfileBundle({ ...fixture, profile: "production" })
    ).toThrow("Refusing to replace symbolic-link destination");
    expect(fs.readFileSync(path.join(externalPublic, "keep.txt"), "utf8")).toBe(
      "keep\n"
    );
  });

  it("rejects a bundle whose public tree drifted from the source", () => {
    const fixture = createFixture();
    prepareProfileBundle({ ...fixture, profile: "staging" });
    writeFile(fixture.bundleRoot, "public/extra.txt", "extra\n");

    expect(() =>
      assertProfileBundle({ ...fixture, profile: "staging" })
    ).toThrow("staging public directory does not match");
  });

  it("rejects a production bundle built for a non-production endpoint", () => {
    const fixture = createFixture();
    writeRuntimeConfig(fixture.bundleRoot, {
      BASE_ENDPOINT: "http://localhost:3001",
      GIPHY_API_KEY: "test-giphy-client-key",
    });

    expect(() =>
      prepareProfileBundle({ ...fixture, profile: "production" })
    ).toThrow("Production bundle BASE_ENDPOINT must equal https://6529.io.");
  });

  it("rejects a production bundle without GIPHY client configuration", () => {
    const fixture = createFixture();
    writeRuntimeConfig(fixture.bundleRoot, {
      BASE_ENDPOINT: "https://6529.io",
      GIPHY_API_KEY: " ",
    });

    expect(() =>
      prepareProfileBundle({ ...fixture, profile: "production" })
    ).toThrow("Production bundle GIPHY_API_KEY must be configured.");
  });

  it("rejects a production bundle with missing runtime configuration", () => {
    const fixture = createFixture();
    fs.rmSync(path.join(fixture.bundleRoot, ".next/PUBLIC_RUNTIME.json"));

    expect(() =>
      prepareProfileBundle({ ...fixture, profile: "production" })
    ).toThrow("Production bundle is missing .next/PUBLIC_RUNTIME.json.");
  });

  it("does not require production runtime configuration for staging", () => {
    const fixture = createFixture();
    fs.rmSync(path.join(fixture.bundleRoot, ".next/PUBLIC_RUNTIME.json"));

    expect(() =>
      prepareProfileBundle({ ...fixture, profile: "staging" })
    ).not.toThrow();
  });
});

describe("final package.zip listing contract", () => {
  it("requires the zip file set to exactly equal the verified bundle", () => {
    const fixture = createFixture();
    prepareProfileBundle({ ...fixture, profile: "production" });
    const listingFile = writeListing(fixture);
    const extractedRoot = copyExtractedBundle(fixture);

    expect(() =>
      assertZipListing({
        ...fixture,
        profile: "production",
        listingFile,
        extractedRoot,
      })
    ).not.toThrow();

    fs.appendFileSync(listingFile, "public/leak.json\n");
    expect(() =>
      assertZipListing({
        ...fixture,
        profile: "production",
        listingFile,
        extractedRoot,
      })
    ).toThrow("does not exactly match");
  });

  it("binds final extracted bytes to the verified bundle", () => {
    const fixture = createFixture();
    prepareProfileBundle({ ...fixture, profile: "production" });
    const listingFile = writeListing(fixture);
    const extractedRoot = copyExtractedBundle(fixture);
    fs.writeFileSync(path.join(extractedRoot, "server.js"), "tampered\n");

    expect(() =>
      assertZipListing({
        ...fixture,
        profile: "production",
        listingFile,
        extractedRoot,
      })
    ).toThrow("bytes do not exactly match");
  });

  it("rejects traversal, duplicate, and Windows-style zip paths", () => {
    expect(() => parseZipListing("../escape\n")).toThrow("unsafe path");
    expect(() => parseZipListing("../escape/\n")).toThrow("unsafe path");
    expect(() => parseZipListing("/absolute/\n")).toThrow("unsafe path");
    expect(() => parseZipListing("same\nsame\n")).toThrow("duplicates");
    expect(() => parseZipListing("public\\leak.json\n")).toThrow(
      "unsafe path"
    );
  });

  it("validates the listing before an archive is extracted", () => {
    const fixture = createFixture();
    prepareProfileBundle({ ...fixture, profile: "production" });
    const listingFile = writeFile(
      fixture.repoRoot,
      "package.listing",
      "../escape/\n"
    );

    expect(() =>
      assertZipListingSafety({ ...fixture, profile: "production", listingFile })
    ).toThrow("unsafe path");
  });
});

describe("web artifact packaging CLI", () => {
  function run(args: readonly string[]) {
    return spawnSync(process.execPath, [SCRIPT, ...args], {
      encoding: "utf8",
    });
  }

  it("runs the production prepare and final-listing checks end to end", () => {
    const fixture = createFixture();
    const common = [
      "--profile",
      "production",
      "--bundle-root",
      "artifact/bundle",
      "--repo-root",
      fixture.repoRoot,
    ];

    const prepare = run(["prepare", ...common]);
    expect(prepare.status).toBe(0);
    expect(prepare.stdout).toContain("Verified production artifact bundle");

    const listingFile = writeListing(fixture);
    const extractedRoot = copyExtractedBundle(fixture);
    expect(
      run(["assert-listing", ...common, "--listing-file", listingFile]).status
    ).toBe(0);
    const verify = run([
      "assert-zip",
      ...common,
      "--listing-file",
      listingFile,
      "--extracted-root",
      extractedRoot,
    ]);
    expect(verify.status).toBe(0);
    expect(verify.stdout).toContain("Verified production artifact bundle");
  });

  it("rejects unsupported profiles and bundle paths outside the repository", () => {
    expect(() =>
      parseCli(["prepare", "--profile", "preview", "--bundle-root", "artifact"])
    ).toThrow("Unsupported artifact profile");
    expect(() =>
      parseCli([
        "prepare",
        "--profile",
        "production",
        "--bundle-root",
        "../outside",
      ])
    ).toThrow("must resolve below");
  });
});
