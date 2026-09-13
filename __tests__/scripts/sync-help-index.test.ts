jest.mock("prettier", () => ({ format: jest.fn() }));

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
    environments: ["local", "staging", "production"],
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
    ).toBe(true);
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

  it("generates the production help corpus with the published Stream summaries", () => {
    const publishedRecordIds = getPublishedRecordIds("https://6529.io");

    for (const recordId of STREAM_SUMMARY_RECORD_IDS) {
      expect(publishedRecordIds.has(recordId)).toBe(true);
    }
  });
});

describe("Desktop conversational answer metadata", () => {
  const { validateIndex } = require("../../scripts/sync-help-index.cjs");

  it.each([
    { brief_answer: "x".repeat(901) },
    { brief_answer: "" },
    { answer_links: [{ label: "Download", url: "https://example.com/app" }] },
    {
      answer_links: [
        {
          label: "Download",
          url: "https://6529.io/about/6529-apps/nonexistent-desktop-route",
        },
      ],
    },
    { answer_links: [null] },
  ])("rejects invalid short answer or public link metadata: %j", (fields) => {
    const index = JSON.parse(JSON.stringify(helpIndex));
    Object.assign(
      index.records.find(
        (record: { id: string }) => record.id === "desktop.overview"
      ),
      fields
    );
    const error = jest.spyOn(console, "error").mockImplementation(() => {});
    const exit = jest.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("validation rejected");
    });
    try {
      expect(() => validateIndex(index)).toThrow("validation rejected");
    } finally {
      error.mockRestore();
      exit.mockRestore();
    }
  });
});
