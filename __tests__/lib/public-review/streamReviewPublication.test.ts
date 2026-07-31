import {
  getStreamReviewVersionPublication,
  parseStreamReviewPublicationMetadata,
  parseStreamReviewVersionIdentities,
  STREAM_REVIEW_PRODUCTION_ENABLED,
  STREAM_REVIEW_VERSION_IDENTITIES,
} from "@/lib/public-review/streamReviewPublication";

const SOURCE_COMMIT = "513bd7e079eafe109df6ae1ae21bfbca6fec6786";

describe("Stream public-review version identities", () => {
  it("publishes the review on the production host", () => {
    expect(STREAM_REVIEW_PRODUCTION_ENABLED).toBe(true);
  });

  it("pins every retained public and draft version to an explicit source commit", () => {
    expect(STREAM_REVIEW_VERSION_IDENTITIES).toEqual([
      {
        version: "2026-07-26.1",
        lifecycleState: "REVIEW_CLOSED",
        sourceCommit: SOURCE_COMMIT,
      },
      {
        version: "2026-07-27.1",
        lifecycleState: "REVIEW_CLOSED",
        sourceCommit: SOURCE_COMMIT,
      },
      {
        version: "2026-07-28.1",
        lifecycleState: "DRAFT",
        sourceCommit: SOURCE_COMMIT,
      },
      {
        version: "2026-07-28.2",
        lifecycleState: "DRAFT",
        sourceCommit: SOURCE_COMMIT,
      },
      {
        version: "2026-07-30.1",
        lifecycleState: "PUBLIC_REVIEW",
        sourceCommit: SOURCE_COMMIT,
      },
    ]);
  });

  it("exposes immutable per-version publication records", () => {
    expect(
      Object.isFrozen(getStreamReviewVersionPublication("2026-07-30.1"))
    ).toBe(true);
  });

  it("accepts a draft identity before publication metadata is assigned", () => {
    expect(parseStreamReviewPublicationMetadata({}, "DRAFT")).toBeUndefined();
  });

  it.each([
    {
      label: "published version without metadata",
      lifecycleState: "PUBLIC_REVIEW" as const,
      metadata: {},
    },
    {
      label: "draft with partial metadata",
      lifecycleState: "DRAFT" as const,
      metadata: { deploymentStatus: "NOT_DEPLOYED" },
    },
  ])("rejects a $label", ({ lifecycleState, metadata }) => {
    expect(() =>
      parseStreamReviewPublicationMetadata(metadata, lifecycleState)
    ).toThrow("The Stream public-review version config is invalid.");
  });

  it.each([
    {
      label: "missing source commit",
      versions: [
        {
          version: "2026-07-28.1",
          lifecycleState: "DRAFT",
        },
      ],
    },
    {
      label: "malformed source commit",
      versions: [
        {
          version: "2026-07-28.1",
          lifecycleState: "DRAFT",
          sourceCommit: "not-a-commit",
        },
      ],
    },
    {
      label: "duplicate version identity",
      versions: [
        {
          version: "2026-07-28.1",
          lifecycleState: "DRAFT",
          sourceCommit: SOURCE_COMMIT,
        },
        {
          version: "2026-07-28.1",
          lifecycleState: "DRAFT",
          sourceCommit: SOURCE_COMMIT,
        },
      ],
    },
  ])("rejects a $label", ({ versions }) => {
    expect(() => parseStreamReviewVersionIdentities(versions)).toThrow(
      "The Stream public-review version config is invalid."
    );
  });
});
