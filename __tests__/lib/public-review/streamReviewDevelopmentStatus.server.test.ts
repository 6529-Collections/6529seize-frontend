jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import developmentStatus from "@/config/public-reviews/6529-stream.development-status.json";
import {
  parseStreamReviewDevelopmentStatus,
  STREAM_REVIEW_DEVELOPMENT_STATUS,
} from "@/lib/public-review/streamReviewDevelopmentStatus.server";

describe("Stream review development status", () => {
  it("loads a source-pinned, deeply immutable current update", () => {
    expect(STREAM_REVIEW_DEVELOPMENT_STATUS.source.commit).toHaveLength(40);
    expect(
      STREAM_REVIEW_DEVELOPMENT_STATUS.evidenceSummary.requirements
    ).toEqual({
      complete: 2,
      pending: 3,
      missing: 15,
    });
    expect(Object.isFrozen(STREAM_REVIEW_DEVELOPMENT_STATUS)).toBe(true);
    expect(
      Object.isFrozen(STREAM_REVIEW_DEVELOPMENT_STATUS.recentlyCompleted)
    ).toBe(true);
    expect(
      Object.isFrozen(STREAM_REVIEW_DEVELOPMENT_STATUS.recentlyCompleted[0])
    ).toBe(true);
  });

  it.each([
    {
      label: "non-canonical timestamp",
      mutate: (candidate: typeof developmentStatus) => {
        candidate.checkedAt = "2026-08-01";
      },
    },
    {
      label: "unsafe evidence path",
      mutate: (candidate: typeof developmentStatus) => {
        candidate.recentlyCompleted[0]!.evidencePath = "../secret";
      },
    },
    {
      label: "unknown review page",
      mutate: (candidate: typeof developmentStatus) => {
        candidate.reviewerPrompts[0]!.pageId = "missing-page";
      },
    },
    {
      label: "duplicate item id",
      mutate: (candidate: typeof developmentStatus) => {
        candidate.workingOn[0]!.id = candidate.recentlyCompleted[0]!.id;
      },
    },
  ])("rejects a $label", ({ mutate }) => {
    const candidate = JSON.parse(
      JSON.stringify(developmentStatus)
    ) as typeof developmentStatus;
    mutate(candidate);
    expect(() => parseStreamReviewDevelopmentStatus(candidate)).toThrow(
      "The Stream development-status config is invalid."
    );
  });
});
