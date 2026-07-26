const {
  getPublicationEnvironment,
  isHelpRecordPublished,
} = require("../../scripts/help-index-publication.cjs");

describe("sync-help-index publication policy", () => {
  const publicReviewRecord = {
    environments: ["local", "staging"],
    public_review_id: "6529-stream",
  };

  it("publishes a review record only when both environment and lifecycle allow it", () => {
    expect(
      isHelpRecordPublished(
        publicReviewRecord,
        "staging",
        new Set(["6529-stream"])
      )
    ).toBe(true);
    expect(
      isHelpRecordPublished(publicReviewRecord, "staging", new Set())
    ).toBe(false);
    expect(
      isHelpRecordPublished(
        publicReviewRecord,
        "production",
        new Set(["6529-stream"])
      )
    ).toBe(false);
  });

  it("leaves unrelated records governed only by their environment", () => {
    expect(
      isHelpRecordPublished(
        { environments: ["staging"] },
        "staging",
        new Set()
      )
    ).toBe(true);
    expect(isHelpRecordPublished({}, "production", new Set())).toBe(true);
  });

  it("fails closed when resolving an unknown publication environment", () => {
    expect(getPublicationEnvironment("https://staging.6529.io")).toBe(
      "staging"
    );
    expect(getPublicationEnvironment("http://localhost:3202")).toBe("local");
    expect(getPublicationEnvironment("invalid")).toBe("production");
  });
});
