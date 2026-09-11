import {
  acceptsPublicReviewExploitReports,
  getPublicReviewLifecycleCapabilities,
  PUBLIC_REVIEW_LIFECYCLE_STATES,
} from "@/lib/public-review/publicReviewLifecycle";

describe("public review lifecycle capabilities", () => {
  it("exposes routes for every configured state except draft", () => {
    expect(
      PUBLIC_REVIEW_LIFECYCLE_STATES.filter(
        (state) =>
          getPublicReviewLifecycleCapabilities(state).publicRoutesAvailable
      )
    ).toEqual(
      PUBLIC_REVIEW_LIFECYCLE_STATES.filter((state) => state !== "DRAFT")
    );
  });

  it("opens feedback and public exploit reports only during public review", () => {
    expect(
      PUBLIC_REVIEW_LIFECYCLE_STATES.filter(
        (state) =>
          getPublicReviewLifecycleCapabilities(state).feedbackSubmissionsOpen
      )
    ).toEqual(["PUBLIC_REVIEW"]);
    expect(
      PUBLIC_REVIEW_LIFECYCLE_STATES.filter(acceptsPublicReviewExploitReports)
    ).toEqual(["PUBLIC_REVIEW"]);
  });

  it("switches deployed reviews to the post-deployment disclosure policy", () => {
    expect(
      getPublicReviewLifecycleCapabilities("DEPLOYED").securityFindingPolicy
    ).toBe("POST_DEPLOYMENT_POLICY");
  });
});
