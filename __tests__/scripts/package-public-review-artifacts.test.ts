import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const {
  assertProfileBundle,
  assertZipListing,
  assertZipListingSafety,
  expectedBundleEntries,
  parseCli,
  parseZipListing,
  prepareProfileBundle,
} = require("../../scripts/package-public-review-artifacts.cjs") as {
  assertProfileBundle(input: ArtifactInput): readonly ReviewEvidence[];
  assertZipListing(
    input: ArtifactInput & {
      readonly listingFile: string;
      readonly extractedRoot: string;
    }
  ): readonly ReviewEvidence[];
  assertZipListingSafety(
    input: ArtifactInput & { readonly listingFile: string }
  ): readonly ReviewEvidence[];
  expectedBundleEntries(bundleRoot: string): readonly string[];
  parseCli(argv: readonly string[]): {
    readonly command: "prepare" | "assert-listing" | "assert-zip";
    readonly profile: ArtifactProfile;
    readonly repoRoot: string;
    readonly bundleRoot: string;
    readonly listingFile?: string | undefined;
    readonly extractedRoot?: string | undefined;
  };
  parseZipListing(listing: string): readonly string[];
  prepareProfileBundle(input: ArtifactInput): readonly ReviewEvidence[];
};

const { bundleOutputSha256 } =
  require("../../scripts/public-reviews/solidity-reference-lib.cjs") as {
    bundleOutputSha256(bundle: Record<string, unknown>): string;
  };

type ArtifactProfile = "production" | "staging";

interface ArtifactInput {
  readonly repoRoot: string;
  readonly bundleRoot: string;
  readonly profile: ArtifactProfile;
}

interface ReviewEvidence {
  readonly reviewId: string;
  readonly reviewVersion: string;
  readonly sourceCommit: string;
  readonly sourceTree: string;
  readonly bundleSha256: string;
  readonly editorialSha256?: string | undefined;
}

const REVIEW_ID = "6529-stream";
const REVIEW_VERSION = "2026-07-26.1";
const SOURCE_COMMIT = "b1598aff93693c6fb8610f7a7a8d2fc3e4df8c1c";
const SOURCE_TREE = "c7075288c27601727f4ab7ef3be6c52e887ca663";
const SOURCE_REPOSITORY = "6529-Collections/6529Stream";
const SOURCE_PATH = "smart-contracts/StreamCore.sol";
const DEFINITION_ID = `${SOURCE_PATH}:StreamCore`;
const DEFINITION_KEY = Buffer.from(DEFINITION_ID).toString("base64url");

function sha256Urn(value: string | Buffer): string {
  return `sha256:${crypto.createHash("sha256").update(value).digest("hex")}`;
}

function normalizeLf(value: string): string {
  return value.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
}

function generatorSourceSha256(): string {
  const files = [
    "scripts/public-reviews/solidity-reference-lib.cjs",
    "scripts/public-reviews/solidity-reference.cjs",
  ];
  const normalized = files
    .map((file) => {
      const content = fs.readFileSync(path.join(process.cwd(), file), "utf8");
      return `${file}\n${normalizeLf(content)}`;
    })
    .join("\n");
  return sha256Urn(normalized);
}

function writeFile(root: string, relativePath: string, value: string | Buffer) {
  const filePath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, value);
  return filePath;
}

function writeJson(root: string, relativePath: string, value: unknown): string {
  return writeFile(root, relativePath, `${JSON.stringify(value, null, 2)}\n`);
}

function createFixture(lifecycleState = "PUBLIC_REVIEW"): {
  readonly repoRoot: string;
  readonly bundleRoot: string;
  readonly sourceFile: string;
  readonly shardFile: string;
  readonly editorialManifest: string;
  readonly bundleFile: string;
} {
  const repoRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), "public-review-artifact-")
  );
  const bundleRoot = path.join(repoRoot, "artifact", "bundle");
  fs.mkdirSync(bundleRoot, { recursive: true });
  writeFile(bundleRoot, "server.js", "console.log('fixture');\n");
  writeFile(repoRoot, "public/favicon.svg", "<svg />\n");
  writeFile(repoRoot, "public/agents.md", "staging agent corpus\n");

  const config = {
    schemaVersion: "public-review.solidity-source.v1",
    reviewId: REVIEW_ID,
    reviewVersion: REVIEW_VERSION,
    source: {
      repository: SOURCE_REPOSITORY,
      commit: SOURCE_COMMIT,
      tree: SOURCE_TREE,
    },
    output: {
      directory: `public/review-data/${REVIEW_ID}/versions/${REVIEW_VERSION}`,
      retainedVersions: [REVIEW_VERSION],
      bundleFile: "reference-manifest.json",
      definitionsDirectory: "definitions",
      sourcesDirectory: "sources",
      indexFile: `public/review-data/${REVIEW_ID}/index.json`,
    },
  };
  const configText = `${JSON.stringify(config, null, 2)}\n`;
  writeFile(
    repoRoot,
    `config/public-reviews/${REVIEW_ID}.reference.json`,
    configText
  );
  writeJson(repoRoot, `config/public-reviews/${REVIEW_ID}.publication.json`, {
    schemaVersion: "public-review.publication.v1",
    reviewId: REVIEW_ID,
    lifecycleState,
  });

  const sourceText = "contract StreamCore {}\n";
  const sourceFile = writeFile(
    repoRoot,
    `public/review-data/${REVIEW_ID}/versions/${REVIEW_VERSION}/sources/${SOURCE_PATH}`,
    sourceText
  );
  const shard = {
    shardSchemaVersion: "public-review.solidity-definition-shard.v1",
    definition: {
      id: DEFINITION_ID,
      key: DEFINITION_KEY,
      name: "StreamCore",
    },
  };
  const shardText = `${JSON.stringify(shard, null, 2)}\n`;
  const shardRelativePath = `${DEFINITION_KEY}.json`;
  const shardFile = writeFile(
    repoRoot,
    `public/review-data/${REVIEW_ID}/versions/${REVIEW_VERSION}/definitions/${shardRelativePath}`,
    shardText
  );

  const bundle = {
    bundleSchemaVersion: "public-review.solidity-reference.v3",
    reviewId: REVIEW_ID,
    reviewVersion: REVIEW_VERSION,
    source: {
      repository: SOURCE_REPOSITORY,
      commit: SOURCE_COMMIT,
      tree: SOURCE_TREE,
    },
    generator: {
      name: "6529-public-review-solidity-reference",
      version: "2",
      configSha256: sha256Urn(normalizeLf(configText)),
      sourceSha256: generatorSourceSha256(),
      outputSha256: null as string | null,
    },
    summary: {
      fileCount: 1,
      definitionCount: 1,
    },
    files: [
      {
        path: SOURCE_PATH,
        publicPath: `/review-data/${REVIEW_ID}/versions/${REVIEW_VERSION}/sources/${SOURCE_PATH}`,
        sha256: sha256Urn(sourceText),
        byteLength: Buffer.byteLength(sourceText),
      },
    ],
    definitionIndex: [
      {
        id: DEFINITION_ID,
        shardPath: `/review-data/${REVIEW_ID}/versions/${REVIEW_VERSION}/definitions/${shardRelativePath}`,
        shardSha256: sha256Urn(shardText),
      },
    ],
  };
  bundle.generator.outputSha256 = bundleOutputSha256(bundle);
  const bundleFile = writeJson(
    repoRoot,
    `public/review-data/${REVIEW_ID}/versions/${REVIEW_VERSION}/reference-manifest.json`,
    bundle
  );
  writeJson(repoRoot, `public/review-data/${REVIEW_ID}/index.json`, {
    schemaVersion: "public-review.solidity-reference-index.v1",
    reviewId: REVIEW_ID,
    activeVersion: REVIEW_VERSION,
    versions: [
      {
        version: REVIEW_VERSION,
        commit: SOURCE_COMMIT,
        tree: SOURCE_TREE,
        bundlePath: `/review-data/${REVIEW_ID}/versions/${REVIEW_VERSION}/reference-manifest.json`,
        bundleSha256: bundle.generator.outputSha256,
      },
    ],
  });

  writeFile(
    repoRoot,
    `content/public-reviews/${REVIEW_ID}/versions/${REVIEW_VERSION}/editorial/overview.md`,
    "# Overview\n\nFixture editorial content.\n"
  );
  const editorialManifest = writeJson(
    repoRoot,
    `content/public-reviews/${REVIEW_ID}/versions/${REVIEW_VERSION}/editorial/manifest.json`,
    {
      schema_version: 1,
      review_id: REVIEW_ID,
      review_version: REVIEW_VERSION,
      locale: "en-US",
      source_repository: `https://github.com/${SOURCE_REPOSITORY}`,
      source_commit: SOURCE_COMMIT,
      pages: [{ id: "overview", title: "Overview", file: "overview.md" }],
    }
  );

  return {
    repoRoot,
    bundleRoot,
    sourceFile,
    shardFile,
    editorialManifest,
    bundleFile,
  };
}

function mirrorTamper(sourcePath: string, repoRoot: string, value: string) {
  fs.writeFileSync(sourcePath, value);
  const relativePath = path.relative(repoRoot, sourcePath);
  fs.writeFileSync(
    path.join(repoRoot, "artifact", "bundle", relativePath),
    value
  );
}

function copyExtractedBundle(
  fixture: ReturnType<typeof createFixture>
): string {
  const extractedRoot = path.join(fixture.repoRoot, "artifact", "extracted");
  fs.cpSync(fixture.bundleRoot, extractedRoot, {
    recursive: true,
    dereference: false,
  });
  return extractedRoot;
}

const fixtureRoots: string[] = [];

afterEach(() => {
  for (const root of fixtureRoots.splice(0)) {
    const resolved = path.resolve(root);
    expect(resolved).toContain(path.resolve(os.tmpdir()));
    fs.rmSync(resolved, { recursive: true, force: true });
  }
});

describe("profile-aware public-review artifact packaging", () => {
  it("copies ordinary public assets while omitting every production review input", () => {
    const fixture = createFixture();
    fixtureRoots.push(fixture.repoRoot);

    expect(
      prepareProfileBundle({
        repoRoot: fixture.repoRoot,
        bundleRoot: fixture.bundleRoot,
        profile: "production",
      })
    ).toEqual([]);
    expect(
      fs.readFileSync(path.join(fixture.bundleRoot, "public/agents.md"), "utf8")
    ).toBe("staging agent corpus\n");
    expect(
      fs.existsSync(path.join(fixture.bundleRoot, "public/review-data"))
    ).toBe(false);
    expect(
      fs.existsSync(path.join(fixture.bundleRoot, "content/public-reviews"))
    ).toBe(false);
    expect(fs.readFileSync(fixture.sourceFile, "utf8")).toBe(
      "contract StreamCore {}\n"
    );
  });

  it("fails closed when Next standalone tracing carries editorial content into production", () => {
    const fixture = createFixture();
    fixtureRoots.push(fixture.repoRoot);
    writeFile(
      fixture.bundleRoot,
      "content/public-reviews/6529-stream/leaked.md",
      "must not ship\n"
    );

    expect(() =>
      prepareProfileBundle({
        repoRoot: fixture.repoRoot,
        bundleRoot: fixture.bundleRoot,
        profile: "production",
      })
    ).toThrow("Production bundle contains public-review evidence");
  });

  it.each([
    {
      entry: "public/review-data",
      message: "Production bundle contains public-review evidence",
    },
    {
      entry: "content/public-reviews",
      message: "Production bundle contains public-review evidence",
    },
    {
      entry: ".next/standalone/content/public-reviews",
      message: "Production bundle contains public-review evidence",
    },
  ])(
    "fails closed on an empty production review directory at $entry",
    ({ entry, message }) => {
      const fixture = createFixture();
      fixtureRoots.push(fixture.repoRoot);
      prepareProfileBundle({
        repoRoot: fixture.repoRoot,
        bundleRoot: fixture.bundleRoot,
        profile: "production",
      });
      fs.mkdirSync(path.join(fixture.bundleRoot, entry), { recursive: true });

      expect(() =>
        assertProfileBundle({
          repoRoot: fixture.repoRoot,
          bundleRoot: fixture.bundleRoot,
          profile: "production",
        })
      ).toThrow(message);
    }
  );

  it("rejects a production content symlink that aliases public-review evidence", () => {
    const fixture = createFixture();
    fixtureRoots.push(fixture.repoRoot);
    writeFile(
      fixture.bundleRoot,
      "payload/public-reviews/secret.md",
      "must not ship\n"
    );
    fs.symlinkSync(
      path.join(fixture.bundleRoot, "payload"),
      path.join(fixture.bundleRoot, "content"),
      process.platform === "win32" ? "junction" : "dir"
    );

    expect(() =>
      prepareProfileBundle({
        repoRoot: fixture.repoRoot,
        bundleRoot: fixture.bundleRoot,
        profile: "production",
      })
    ).toThrow("symbolic-link ancestor");
  });

  it("binds staging data, semantic hashes, source bytes, shards, and editorial identity", () => {
    const fixture = createFixture();
    fixtureRoots.push(fixture.repoRoot);

    const reviews = prepareProfileBundle({
      repoRoot: fixture.repoRoot,
      bundleRoot: fixture.bundleRoot,
      profile: "staging",
    });

    expect(reviews).toEqual([
      expect.objectContaining({
        reviewId: REVIEW_ID,
        reviewVersion: REVIEW_VERSION,
        sourceCommit: SOURCE_COMMIT,
        sourceTree: SOURCE_TREE,
        bundleSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/),
        editorialSha256: expect.stringMatching(/^sha256:[0-9a-f]{64}$/),
      }),
    ]);
    expect(
      fs.readFileSync(
        path.join(
          fixture.bundleRoot,
          `content/public-reviews/${REVIEW_ID}/versions/${REVIEW_VERSION}/editorial/overview.md`
        ),
        "utf8"
      )
    ).toContain("Fixture editorial content");
  });

  it("omits draft routes' raw evidence from staging artifacts", () => {
    const fixture = createFixture("DRAFT");
    fixtureRoots.push(fixture.repoRoot);

    expect(
      prepareProfileBundle({
        repoRoot: fixture.repoRoot,
        bundleRoot: fixture.bundleRoot,
        profile: "staging",
      })
    ).toEqual([]);
    expect(
      fs.existsSync(path.join(fixture.bundleRoot, "public/review-data"))
    ).toBe(false);
    expect(
      fs.existsSync(path.join(fixture.bundleRoot, "content/public-reviews"))
    ).toBe(false);
  });

  it.each([
    {
      label: "source",
      select: (fixture: ReturnType<typeof createFixture>) => fixture.sourceFile,
      value: "contract StreamCore { uint256 changed; }\n",
      message: "packaged source checksum drifted",
    },
    {
      label: "definition shard",
      select: (fixture: ReturnType<typeof createFixture>) => fixture.shardFile,
      value: '{"definition":{"id":"wrong"}}\n',
      message: "definition shard checksum drifted",
    },
  ])(
    "rejects mirrored $label tampering against signed manifest hashes",
    ({ select, value, message }) => {
      const fixture = createFixture();
      fixtureRoots.push(fixture.repoRoot);
      prepareProfileBundle({
        repoRoot: fixture.repoRoot,
        bundleRoot: fixture.bundleRoot,
        profile: "staging",
      });
      mirrorTamper(select(fixture), fixture.repoRoot, value);

      expect(() =>
        assertProfileBundle({
          repoRoot: fixture.repoRoot,
          bundleRoot: fixture.bundleRoot,
          profile: "staging",
        })
      ).toThrow(message);
    }
  );

  it("rejects editorial content whose immutable source identity drifts", () => {
    const fixture = createFixture();
    fixtureRoots.push(fixture.repoRoot);
    prepareProfileBundle({
      repoRoot: fixture.repoRoot,
      bundleRoot: fixture.bundleRoot,
      profile: "staging",
    });
    const manifest = JSON.parse(
      fs.readFileSync(fixture.editorialManifest, "utf8")
    );
    manifest.source_commit = "0".repeat(40);
    mirrorTamper(
      fixture.editorialManifest,
      fixture.repoRoot,
      `${JSON.stringify(manifest, null, 2)}\n`
    );

    expect(() =>
      assertProfileBundle({
        repoRoot: fixture.repoRoot,
        bundleRoot: fixture.bundleRoot,
        profile: "staging",
      })
    ).toThrow("editorial manifest identity drifted");
  });

  it("rejects a mirrored reference bundle whose semantic hash was not regenerated", () => {
    const fixture = createFixture();
    fixtureRoots.push(fixture.repoRoot);
    prepareProfileBundle({
      repoRoot: fixture.repoRoot,
      bundleRoot: fixture.bundleRoot,
      profile: "staging",
    });
    const bundle = JSON.parse(fs.readFileSync(fixture.bundleFile, "utf8"));
    bundle.summary.fileCount = 2;
    mirrorTamper(
      fixture.bundleFile,
      fixture.repoRoot,
      `${JSON.stringify(bundle, null, 2)}\n`
    );

    expect(() =>
      assertProfileBundle({
        repoRoot: fixture.repoRoot,
        bundleRoot: fixture.bundleRoot,
        profile: "staging",
      })
    ).toThrow("reference bundle semantic checksum drifted");
  });
});

describe("final package.zip listing contract", () => {
  it("requires the zip file set to exactly equal the verified bundle", () => {
    const fixture = createFixture();
    fixtureRoots.push(fixture.repoRoot);
    prepareProfileBundle({
      repoRoot: fixture.repoRoot,
      bundleRoot: fixture.bundleRoot,
      profile: "production",
    });
    const listingFile = writeFile(
      fixture.repoRoot,
      "package.listing",
      `${expectedBundleEntries(fixture.bundleRoot)
        .map((entry) => `./${entry}`)
        .join("\n")}\n`
    );
    const extractedRoot = copyExtractedBundle(fixture);

    expect(
      assertZipListing({
        repoRoot: fixture.repoRoot,
        bundleRoot: fixture.bundleRoot,
        profile: "production",
        listingFile,
        extractedRoot,
      })
    ).toEqual([]);

    fs.appendFileSync(listingFile, "public/review-data/leak.json\n");
    expect(() =>
      assertZipListing({
        repoRoot: fixture.repoRoot,
        bundleRoot: fixture.bundleRoot,
        profile: "production",
        listingFile,
        extractedRoot,
      })
    ).toThrow("does not exactly match");
  });

  it("binds final extracted bytes to the verified bundle", () => {
    const fixture = createFixture();
    fixtureRoots.push(fixture.repoRoot);
    prepareProfileBundle({
      repoRoot: fixture.repoRoot,
      bundleRoot: fixture.bundleRoot,
      profile: "production",
    });
    const listingFile = writeFile(
      fixture.repoRoot,
      "package.listing",
      `${expectedBundleEntries(fixture.bundleRoot).join("\n")}\n`
    );
    const extractedRoot = copyExtractedBundle(fixture);
    fs.writeFileSync(path.join(extractedRoot, "server.js"), "tampered\n");

    expect(() =>
      assertZipListing({
        repoRoot: fixture.repoRoot,
        bundleRoot: fixture.bundleRoot,
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
    expect(() => parseZipListing("content\\public-reviews\\leak.md\n")).toThrow(
      "unsafe path"
    );
    expect(() => parseZipListing("public\\review-data\\\n")).toThrow(
      "unsafe path"
    );
  });

  it("validates the listing before an archive is extracted", () => {
    const fixture = createFixture();
    fixtureRoots.push(fixture.repoRoot);
    prepareProfileBundle({
      repoRoot: fixture.repoRoot,
      bundleRoot: fixture.bundleRoot,
      profile: "production",
    });
    const listingFile = writeFile(
      fixture.repoRoot,
      "package.listing",
      "../escape/\n"
    );

    expect(() =>
      assertZipListingSafety({
        repoRoot: fixture.repoRoot,
        bundleRoot: fixture.bundleRoot,
        profile: "production",
        listingFile,
      })
    ).toThrow("unsafe path");
  });
});

describe("artifact packaging CLI", () => {
  it("runs the production prepare and final-listing checks end to end", () => {
    const fixture = createFixture();
    fixtureRoots.push(fixture.repoRoot);
    const script = path.join(
      process.cwd(),
      "scripts/package-public-review-artifacts.cjs"
    );
    const prepare = spawnSync(
      process.execPath,
      [
        script,
        "prepare",
        "--profile",
        "production",
        "--bundle-root",
        "artifact/bundle",
        "--repo-root",
        fixture.repoRoot,
      ],
      { encoding: "utf8" }
    );
    expect(prepare.status).toBe(0);
    expect(prepare.stdout).toContain("public-review evidence absent");

    const listingFile = writeFile(
      fixture.repoRoot,
      "package.listing",
      `${expectedBundleEntries(fixture.bundleRoot).join("\n")}\n`
    );
    const extractedRoot = copyExtractedBundle(fixture);
    const listingSafety = spawnSync(
      process.execPath,
      [
        script,
        "assert-listing",
        "--profile",
        "production",
        "--bundle-root",
        "artifact/bundle",
        "--repo-root",
        fixture.repoRoot,
        "--listing-file",
        listingFile,
      ],
      { encoding: "utf8" }
    );
    expect(listingSafety.status).toBe(0);
    const verify = spawnSync(
      process.execPath,
      [
        script,
        "assert-zip",
        "--profile",
        "production",
        "--bundle-root",
        "artifact/bundle",
        "--repo-root",
        fixture.repoRoot,
        "--listing-file",
        listingFile,
        "--extracted-root",
        extractedRoot,
      ],
      { encoding: "utf8" }
    );
    expect(verify.status).toBe(0);
    expect(verify.stdout).toContain("Verified production artifact profile");
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
