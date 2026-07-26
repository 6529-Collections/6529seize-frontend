jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import { existsSync } from "node:fs";
import path from "node:path";

import {
  createSolidityReferenceReader,
  SolidityReferenceNotFoundError,
} from "@/lib/public-review/solidityReferenceData";
import {
  encodeSoliditySemanticId,
  getSolidityDeclarationHref,
  getSolidityDefinitionHref,
  getSolidityInterfaceHref,
  getSoliditySourceHref,
  resolveSoliditySourcePath,
} from "@/lib/public-review/solidityReferenceRoutes";
import type { SolidityReferenceReviewIdentity } from "@/lib/public-review/solidityReferenceTypes";
import {
  STREAM_REVIEW_DEFINITION,
  STREAM_REVIEW_SLUG,
  STREAM_REVIEW_VERSION,
} from "@/lib/public-review/streamReviewDefinition";

const FIXTURE_ROOT =
  process.env["PUBLIC_REVIEW_SOLIDITY_FIXTURE_ROOT"] ??
  path.resolve(process.cwd(), "public");
const FIXTURE_INDEX = path.join(
  FIXTURE_ROOT,
  "review-data",
  STREAM_REVIEW_SLUG,
  "index.json"
);
const describeFixture = existsSync(FIXTURE_INDEX) ? describe : describe.skip;

const IDENTITY: SolidityReferenceReviewIdentity = {
  activeSourceCommit: STREAM_REVIEW_DEFINITION.source.commit,
  activeVersion: STREAM_REVIEW_VERSION,
  availableVersions: [STREAM_REVIEW_VERSION],
  reviewId: STREAM_REVIEW_SLUG,
  sourceRepository: STREAM_REVIEW_DEFINITION.source.repository,
};

describe("Solidity reference route identities", () => {
  const definitionId = "smart-contracts/StreamCore.sol:StreamCore";
  const declarationId = `${definitionId}#function:0x6799a46a`;
  const definitionKey = encodeSoliditySemanticId(definitionId);
  const declarationKey = encodeSoliditySemanticId(declarationId);

  it("uses lossless semantic base64url keys for overload-safe routes", () => {
    expect(Buffer.from(definitionKey, "base64url").toString("utf8")).toBe(
      definitionId
    );
    expect(Buffer.from(declarationKey, "base64url").toString("utf8")).toBe(
      declarationId
    );
    expect(
      getSolidityDeclarationHref({
        declarationKey,
        definitionKey,
        kind: "functions",
        reviewSlug: STREAM_REVIEW_SLUG,
      })
    ).toBe(
      `/reviews/${STREAM_REVIEW_SLUG}/reference/definitions/${definitionKey}/functions/${declarationKey}`
    );
  });

  it("constructs active and immutable canonical routes", () => {
    expect(
      getSolidityDefinitionHref({
        definitionKey,
        reviewSlug: STREAM_REVIEW_SLUG,
        version: STREAM_REVIEW_VERSION,
      })
    ).toBe(
      `/reviews/${STREAM_REVIEW_SLUG}/versions/${STREAM_REVIEW_VERSION}/reference/definitions/${definitionKey}`
    );
    expect(
      getSolidityInterfaceHref({
        definitionKey,
        reviewSlug: STREAM_REVIEW_SLUG,
      })
    ).toBe(
      `/reviews/${STREAM_REVIEW_SLUG}/reference/interfaces/${definitionKey}`
    );
    expect(
      getSoliditySourceHref({
        reviewSlug: STREAM_REVIEW_SLUG,
        sourcePath: "smart-contracts/Stream Core.sol",
      })
    ).toBe(
      `/reviews/${STREAM_REVIEW_SLUG}/reference/sources/smart-contracts/Stream%20Core.sol`
    );
  });

  it("rejects traversal and ambiguous source segments", () => {
    expect(
      resolveSoliditySourcePath(["smart-contracts", "StreamCore.sol"])
    ).toBe("smart-contracts/StreamCore.sol");
    expect(resolveSoliditySourcePath(["..", "secret.sol"])).toBeUndefined();
    expect(
      resolveSoliditySourcePath(["smart-contracts\\StreamCore.sol"])
    ).toBeUndefined();
    expect(
      resolveSoliditySourcePath(["smart-contracts/StreamCore.sol"])
    ).toBeUndefined();
  });
});

describeFixture("generated Stream Solidity reference fixture", () => {
  const reader = createSolidityReferenceReader({
    identity: IDENTITY,
    publicRoot: FIXTURE_ROOT,
  });

  it("validates the exact index, bundle identity, checksums, and summary", async () => {
    const { index, manifest, versionEntry } = await reader.loadManifest(
      STREAM_REVIEW_VERSION
    );

    expect(index.activeVersion).toBe(STREAM_REVIEW_VERSION);
    expect(versionEntry.commit).toBe(STREAM_REVIEW_DEFINITION.source.commit);
    expect(manifest.reviewId).toBe(STREAM_REVIEW_SLUG);
    expect(manifest.reviewVersion).toBe(STREAM_REVIEW_VERSION);
    expect(manifest.source.repository).toBe(
      STREAM_REVIEW_DEFINITION.source.repository
    );
    expect(manifest.summary.definitionCount).toBe(
      manifest.definitionIndex.length
    );
    expect(manifest.summary.fileCount).toBe(manifest.files.length);
    expect(manifest.definitionIndex.length).toBeGreaterThan(400);
    expect(manifest.files.length).toBeGreaterThan(200);
  });

  it("materializes every generated route identity without duplicates", async () => {
    const inventory = await reader.loadRouteInventory(STREAM_REVIEW_VERSION);
    const allIdentities = [
      ...inventory.definitions.map(
        ({ definitionKey }) => `definition:${definitionKey}`
      ),
      ...inventory.functions.map(
        ({ declarationKey, definitionKey }) =>
          `function:${definitionKey}:${declarationKey}`
      ),
      ...inventory.events.map(
        ({ declarationKey, definitionKey }) =>
          `event:${definitionKey}:${declarationKey}`
      ),
      ...inventory.errors.map(
        ({ declarationKey, definitionKey }) =>
          `error:${definitionKey}:${declarationKey}`
      ),
      ...inventory.interfaces.map(
        ({ definitionKey }) => `interface:${definitionKey}`
      ),
      ...inventory.sources.map(({ source }) => `source:${source.join("/")}`),
      ...inventory.topLevelDeclarations.map(
        ({ declarationKey }) => `top-level:${declarationKey}`
      ),
    ];

    expect(new Set(allIdentities).size).toBe(allIdentities.length);
    expect(inventory.definitions.length).toBeGreaterThan(400);
    expect(inventory.functions.length).toBeGreaterThan(500);
    expect(inventory.events.length).toBeGreaterThan(100);
    expect(inventory.errors.length).toBeGreaterThan(150);
  }, 60_000);

  it("keeps overloaded declarations distinct beneath their definition", async () => {
    const { shard } = await reader.loadDefinition(
      STREAM_REVIEW_VERSION,
      encodeSoliditySemanticId("smart-contracts/StreamCore.sol:StreamCore")
    );
    const overloads = shard.definition.declarations.functions.filter(
      (declaration) => declaration.name === "artistSignature"
    );

    expect(overloads).toHaveLength(2);
    expect(new Set(overloads.map((declaration) => declaration.key)).size).toBe(
      2
    );
    expect(
      new Set(overloads.map((declaration) => declaration.canonicalSignature))
        .size
    ).toBe(2);
  });

  it("loads exact source bytes and rejects traversal before filesystem access", async () => {
    const { document } = await reader.loadSource(STREAM_REVIEW_VERSION, [
      "smart-contracts",
      "StreamCore.sol",
    ]);
    expect(document.file.sha256).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(document.lines.length).toBe(document.file.lineCount);
    expect(document.source).toContain("contract StreamCore");

    await expect(
      reader.loadSource(STREAM_REVIEW_VERSION, ["..", "secret.sol"])
    ).rejects.toBeInstanceOf(SolidityReferenceNotFoundError);
  });

  it("fails closed when the expected review identity does not match", async () => {
    const wrongIdentityReader = createSolidityReferenceReader({
      identity: {
        ...IDENTITY,
        activeSourceCommit: "0".repeat(40),
      },
      publicRoot: FIXTURE_ROOT,
    });
    await expect(wrongIdentityReader.loadIndex()).rejects.toThrow(
      "Invalid Solidity reference"
    );
  });
});
