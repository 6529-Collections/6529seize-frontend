import {
  resolveStreamReviewRoute,
  type StreamReviewRouteParams,
} from "@/lib/public-review/streamReviewRoutes";
import {
  STREAM_REVIEW_SOURCE_COMMIT,
  STREAM_REVIEW_VERSION,
} from "@/lib/public-review/streamReviewDefinition";

const ACTIVE_REVIEW: StreamReviewRouteParams = {
  review: "6529-stream",
};

describe("6529 Stream public review routes", () => {
  it("resolves active and immutable version paths on allowed environments", () => {
    expect(
      resolveStreamReviewRoute({
        baseEndpoint: "https://staging.6529.io",
        params: ACTIVE_REVIEW,
      })?.canonicalPath
    ).toBe("/reviews/6529-stream");

    expect(
      resolveStreamReviewRoute({
        baseEndpoint: "http://localhost:3101",
        params: {
          ...ACTIVE_REVIEW,
          version: STREAM_REVIEW_VERSION,
          page: "for-artists",
        },
      })?.canonicalPath
    ).toBe(
      `/reviews/6529-stream/versions/${STREAM_REVIEW_VERSION}/for-artists`
    );
  });

  it("rejects unknown reviews, pages, and versions", () => {
    const baseEndpoint = "https://staging.6529.io";
    expect(
      resolveStreamReviewRoute({
        baseEndpoint,
        params: { review: "unknown" },
      })
    ).toBeUndefined();
    expect(
      resolveStreamReviewRoute({
        baseEndpoint,
        params: { ...ACTIVE_REVIEW, page: "reference" },
      })
    ).toBeUndefined();
    expect(
      resolveStreamReviewRoute({
        baseEndpoint,
        params: { ...ACTIVE_REVIEW, version: "draft" },
      })
    ).toBeUndefined();
  });

  it("returns no route model or source identifiers in production", () => {
    const model = resolveStreamReviewRoute({
      baseEndpoint: "https://6529.io",
      params: ACTIVE_REVIEW,
    });

    expect(model).toBeUndefined();
    const serialized = JSON.stringify(model) ?? "";
    expect(serialized).not.toContain(STREAM_REVIEW_SOURCE_COMMIT);
    expect(serialized).not.toMatch(/wave|subwave|discussion/i);
  });
});
