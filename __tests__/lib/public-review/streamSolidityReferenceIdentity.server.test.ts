jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import streamReferenceConfig from "@/config/public-reviews/6529-stream.reference.json";
import streamReferenceIndex from "@/public/review-data/6529-stream/index.json";
import {
  STREAM_REVIEW_DEFINITION,
  STREAM_REVIEW_VERSION,
} from "@/lib/public-review/streamReviewDefinition";
import { STREAM_REVIEW_VERSION_IDENTITIES } from "@/lib/public-review/streamReviewPublication";
import {
  createStreamSolidityReferenceIdentity,
  STREAM_SOLIDITY_REFERENCE_IDENTITY,
} from "@/lib/public-review/streamSolidityReferenceIdentity.server";
import { assertSolidityReferenceIndex } from "@/lib/public-review/solidityReferenceValidation.server";

const RETAINED_DRAFT_VERSION = "2026-07-28.1";

describe("Stream Solidity retained snapshot identity", () => {
  it("validates every retained snapshot while preserving public and source-current behavior", () => {
    expect(
      STREAM_SOLIDITY_REFERENCE_IDENTITY.sourceIndexAvailableVersions
    ).toEqual(streamReferenceConfig.output.retainedVersions);
    expect(
      Object.keys(STREAM_SOLIDITY_REFERENCE_IDENTITY.sourceCommits)
    ).toEqual(streamReferenceConfig.output.retainedVersions);
    expect(
      STREAM_SOLIDITY_REFERENCE_IDENTITY.sourceCommits[RETAINED_DRAFT_VERSION]
    ).toBe(
      STREAM_REVIEW_VERSION_IDENTITIES.find(
        ({ version }) => version === RETAINED_DRAFT_VERSION
      )?.sourceCommit
    );
    expect(STREAM_SOLIDITY_REFERENCE_IDENTITY.activeVersion).toBe(
      STREAM_REVIEW_VERSION
    );
    expect(STREAM_SOLIDITY_REFERENCE_IDENTITY.availableVersions).toEqual(
      STREAM_REVIEW_DEFINITION.versions.map(({ version }) => version)
    );
    expect(STREAM_SOLIDITY_REFERENCE_IDENTITY.availableVersions).not.toContain(
      RETAINED_DRAFT_VERSION
    );
    expect(STREAM_SOLIDITY_REFERENCE_IDENTITY.sourceIndexActiveVersion).toBe(
      streamReferenceConfig.reviewVersion
    );
    expect(() =>
      assertSolidityReferenceIndex(
        streamReferenceIndex,
        STREAM_SOLIDITY_REFERENCE_IDENTITY
      )
    ).not.toThrow();
  });

  it("fails closed when a retained draft identity is missing", () => {
    expect(() =>
      createStreamSolidityReferenceIdentity({
        referenceConfig: streamReferenceConfig,
        reviewDefinition: STREAM_REVIEW_DEFINITION,
        trustedVersions: STREAM_REVIEW_VERSION_IDENTITIES.filter(
          ({ version }) => version !== RETAINED_DRAFT_VERSION
        ),
      })
    ).toThrow("The Stream Solidity source-index identity is invalid.");
  });

  it("fails closed when a retained draft identity has the wrong commit", () => {
    const mismatchedIdentity = createStreamSolidityReferenceIdentity({
      referenceConfig: streamReferenceConfig,
      reviewDefinition: STREAM_REVIEW_DEFINITION,
      trustedVersions: STREAM_REVIEW_VERSION_IDENTITIES.map((identity) =>
        identity.version === RETAINED_DRAFT_VERSION
          ? { ...identity, sourceCommit: "1".repeat(40) }
          : identity
      ),
    });

    expect(() =>
      assertSolidityReferenceIndex(streamReferenceIndex, mismatchedIdentity)
    ).toThrow("Invalid Solidity reference version entry.");
  });
});
