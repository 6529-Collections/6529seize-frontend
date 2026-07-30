const {
  getPublicationEnvironment,
  getPublishedHelpRecords,
  isHelpRecordPublished,
} = require("../../scripts/help-index-publication.cjs");
const helpIndex = require("../../ops/help/help-index.json");

const STREAM_SUMMARY_RECORD_IDS = [
  "public-reviews.stream",
  "public-reviews.stream.feedback-status",
] as const;

function getPublishedRecordIds(baseEndpoint: string): Set<string> {
  const records = getPublishedHelpRecords({
    records: helpIndex.records,
    publicationEnvironment: getPublicationEnvironment(baseEndpoint),
    repoRoot: process.cwd(),
  });
  return new Set(records.map((record: { id: string }) => record.id));
}

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
      isHelpRecordPublished({ environments: ["staging"] }, "staging", new Set())
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

  it("generates the staging help corpus with the published Stream summaries", () => {
    const publishedRecordIds = getPublishedRecordIds("https://staging.6529.io");

    for (const recordId of STREAM_SUMMARY_RECORD_IDS) {
      expect(publishedRecordIds.has(recordId)).toBe(true);
    }
  });

  it("generates a production-filtered help corpus without Stream summaries", () => {
    const publishedRecordIds = getPublishedRecordIds("https://6529.io");

    for (const recordId of STREAM_SUMMARY_RECORD_IDS) {
      expect(publishedRecordIds.has(recordId)).toBe(false);
    }
  });
});
