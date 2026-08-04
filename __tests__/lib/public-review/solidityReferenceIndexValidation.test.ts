jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import { assertSolidityReferenceIndex } from "@/lib/public-review/solidityReferenceValidation.server";
import type { SolidityReferenceReviewIdentity } from "@/lib/public-review/solidityReferenceTypes";

const HISTORICAL_VERSION = "2026-07-26.1";
const PUBLIC_VERSION = "2026-07-27.1";
const DRAFT_VERSION = "2026-07-28.1";
const HISTORICAL_COMMIT = "9".repeat(40);
const PUBLIC_COMMIT = "a".repeat(40);
const DRAFT_COMMIT = "b".repeat(40);
const BUNDLE_SHA256 = `sha256:${"c".repeat(64)}`;

const IDENTITY: SolidityReferenceReviewIdentity = {
  activeSourceCommit: PUBLIC_COMMIT,
  activeVersion: PUBLIC_VERSION,
  availableVersions: [PUBLIC_VERSION, HISTORICAL_VERSION],
  reviewId: "6529-stream",
  sourceCommits: {
    [HISTORICAL_VERSION]: HISTORICAL_COMMIT,
    [PUBLIC_VERSION]: PUBLIC_COMMIT,
    [DRAFT_VERSION]: DRAFT_COMMIT,
  },
  sourceIndexActiveVersion: DRAFT_VERSION,
  sourceIndexAvailableVersions: [
    HISTORICAL_VERSION,
    PUBLIC_VERSION,
    DRAFT_VERSION,
  ],
  sourceRepository: "6529-Collections/6529Stream",
};

function versionEntry(version: string, commit: string) {
  return {
    version,
    commit,
    tree: "d".repeat(40),
    bundlePath: `/review-data/6529-stream/versions/${version}/reference-manifest.json`,
    bundleSha256: BUNDLE_SHA256,
  };
}

function sourceIndex() {
  return {
    schemaVersion: "public-review.solidity-reference-index.v1",
    reviewId: "6529-stream",
    activeVersion: DRAFT_VERSION,
    versions: [
      versionEntry(HISTORICAL_VERSION, HISTORICAL_COMMIT),
      versionEntry(PUBLIC_VERSION, PUBLIC_COMMIT),
      versionEntry(DRAFT_VERSION, DRAFT_COMMIT),
    ],
  };
}

function publishedIndex() {
  return {
    ...sourceIndex(),
    activeVersion: PUBLIC_VERSION,
    versions: [
      versionEntry(HISTORICAL_VERSION, HISTORICAL_COMMIT),
      versionEntry(PUBLIC_VERSION, PUBLIC_COMMIT),
    ],
  };
}

describe("Solidity reference source-index validation", () => {
  it("accepts a trusted source-active draft while keeping the public identity pinned", () => {
    expect(() =>
      assertSolidityReferenceIndex(sourceIndex(), IDENTITY)
    ).not.toThrow();
  });

  it("accepts the exact published projection without exposing the hidden draft", () => {
    expect(() =>
      assertSolidityReferenceIndex(publishedIndex(), IDENTITY)
    ).not.toThrow();
  });

  it("uses canonical source order instead of public display order", () => {
    expect(IDENTITY.availableVersions).toEqual([
      PUBLIC_VERSION,
      HISTORICAL_VERSION,
    ]);
    expect(publishedIndex().versions.map(({ version }) => version)).toEqual([
      HISTORICAL_VERSION,
      PUBLIC_VERSION,
    ]);
    expect(() =>
      assertSolidityReferenceIndex(publishedIndex(), IDENTITY)
    ).not.toThrow();
  });

  it("rejects a published projection in public display order", () => {
    const index = publishedIndex();
    index.versions.reverse();

    expect(() => assertSolidityReferenceIndex(index, IDENTITY)).toThrow(
      "Invalid Solidity reference index identity"
    );
  });

  it("rejects a public-active index with the full source version list", () => {
    const index = sourceIndex();
    index.activeVersion = PUBLIC_VERSION;

    expect(() => assertSolidityReferenceIndex(index, IDENTITY)).toThrow(
      "Invalid Solidity reference index identity"
    );
  });

  it("rejects a source-active index with only the published version list", () => {
    const index = publishedIndex();
    index.activeVersion = DRAFT_VERSION;

    expect(() => assertSolidityReferenceIndex(index, IDENTITY)).toThrow(
      "Invalid Solidity reference index identity"
    );
  });

  it("rejects a partial full-source version list", () => {
    const index = sourceIndex();
    index.versions = [versionEntry(DRAFT_VERSION, DRAFT_COMMIT)];

    expect(() => assertSolidityReferenceIndex(index, IDENTITY)).toThrow(
      "Invalid Solidity reference index identity"
    );
  });

  it("rejects an extra version in the published projection", () => {
    const index = publishedIndex();
    index.versions.push(versionEntry("2026-07-29.1", "e".repeat(40)));

    expect(() => assertSolidityReferenceIndex(index, IDENTITY)).toThrow(
      "Invalid Solidity reference index identity"
    );
  });

  it("rejects commit drift in the hidden source version", () => {
    const index = sourceIndex();
    index.versions[2]!.commit = "e".repeat(40);

    expect(() => assertSolidityReferenceIndex(index, IDENTITY)).toThrow(
      "Invalid Solidity reference version entry"
    );
  });

  it("rejects a retained draft whose trusted source identity is missing", () => {
    const sourceCommits = { ...IDENTITY.sourceCommits };
    delete sourceCommits[DRAFT_VERSION];
    const identity = {
      ...IDENTITY,
      sourceCommits,
    };

    expect(() => assertSolidityReferenceIndex(sourceIndex(), identity)).toThrow(
      "Invalid Solidity reference version entry"
    );
  });

  it("rejects commit drift in the published projection", () => {
    const index = publishedIndex();
    index.versions[1]!.commit = "e".repeat(40);

    expect(() => assertSolidityReferenceIndex(index, IDENTITY)).toThrow(
      "Invalid Solidity reference version entry"
    );
  });

  it("rejects a source identity that omits a required public version", () => {
    const identity = {
      ...IDENTITY,
      availableVersions: ["2026-07-25.1"],
      sourceCommits: {
        ...IDENTITY.sourceCommits,
        "2026-07-25.1": "f".repeat(40),
      },
    };

    expect(() => assertSolidityReferenceIndex(sourceIndex(), identity)).toThrow(
      "Missing public Solidity reference version"
    );
  });
});
