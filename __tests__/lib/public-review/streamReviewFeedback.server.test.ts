jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });
jest.mock("next/server", () => ({
  connection: jest.fn(async () => undefined),
}));

import { connection } from "next/server";
import {
  createStreamEditorialFeedbackPageContext,
  createStreamReviewFeedbackConfig,
  createStreamTechnicalFeedbackPageContext,
  resolveStreamReviewFeedbackDestination,
} from "@/lib/public-review/streamReviewFeedback.server";
import type { SolidityReferenceManifest } from "@/lib/public-review/solidityReferenceTypes";
import {
  STREAM_REVIEW_PAGES,
  STREAM_REVIEW_PREVIOUS_VERSION,
  STREAM_REVIEW_SLUG,
  STREAM_REVIEW_VERSION,
} from "@/lib/public-review/streamReviewDefinition";

jest.mock("@/lib/public-review/editorialContent", () => ({
  loadStreamEditorialContent: jest.fn(
    async (page: { readonly id: string }) =>
      `# ${page.id}\n\n## Exact section\n\nBody.`
  ),
}));

const SOURCE_PATH = "src/StreamCore.sol";
const SOURCE_COMMIT = "0123456789abcdef0123456789abcdef01234567";
const SOURCE_SHA256 = "a".repeat(64);
const DESTINATIONS_ENV = "PUBLIC_REVIEW_DISCUSSION_DESTINATIONS";
const STAGING_WAVE_ID = "22222222-2222-4222-8222-222222222222";

function makeManifest(
  reviewVersion = STREAM_REVIEW_VERSION
): SolidityReferenceManifest {
  return {
    reviewId: STREAM_REVIEW_SLUG,
    reviewVersion,
    source: {
      repository: "https://github.com/6529-Collections/6529Stream",
      commit: SOURCE_COMMIT,
    },
    files: [
      {
        path: SOURCE_PATH,
        lineCount: 420,
        sha256: SOURCE_SHA256,
      },
      {
        path: "src/StreamRegistry.sol",
        lineCount: 120,
        sha256: "b".repeat(64),
      },
    ],
  } as unknown as SolidityReferenceManifest;
}

describe("Stream review feedback manifest binding", () => {
  const originalDestinations = process.env[DESTINATIONS_ENV];

  afterEach(() => {
    jest.mocked(connection).mockClear();
    if (originalDestinations === undefined) {
      delete process.env[DESTINATIONS_ENV];
    } else {
      process.env[DESTINATIONS_ENV] = originalDestinations;
    }
  });

  it("derives source identity and the selected file from the requested manifest", async () => {
    const config = await createStreamReviewFeedbackConfig({
      manifest: makeManifest(),
      sourcePaths: [SOURCE_PATH],
    });

    expect(config).toMatchObject({
      reviewId: STREAM_REVIEW_SLUG,
      reviewVersion: STREAM_REVIEW_VERSION,
      source: {
        repository: "https://github.com/6529-Collections/6529Stream",
        commit: SOURCE_COMMIT,
        files: [
          {
            path: SOURCE_PATH,
            lineCount: 420,
            sha256: SOURCE_SHA256,
          },
        ],
      },
    });
    expect(config.pages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          value: "overview",
          sectionValues: ["exact-section"],
        }),
        expect.objectContaining({ value: "reference-function" }),
      ])
    );
    expect(config.submissionsOpen).toBe(true);
    expect(config.acceptsPublicExploitReports).toBe(true);
    expect(config.categories.map((option) => option.value)).toEqual([
      "question",
      "documentation",
      "artist-workflow",
      "product-or-ux",
      "protocol-design",
      "implementation-bug",
      "possible-exploitable-security-vulnerability",
      "testing-or-evidence-gap",
      "accessibility-or-localization",
    ]);
    expect(config.severityOptions.map((option) => option.value)).toEqual([
      "not-assessed",
      "informational",
      "low",
      "medium",
      "high",
      "critical",
    ]);
  });

  it("rejects editorial feedback context from another review version", () => {
    const editorialPage = STREAM_REVIEW_PAGES[0];
    if (!editorialPage) {
      throw new Error("Stream overview is missing.");
    }

    expect(() =>
      createStreamEditorialFeedbackPageContext({
        page: editorialPage,
        version: "not-a-retained-version",
      })
    ).toThrow("Feedback page does not belong to this review version.");
  });

  it("keeps the previous version readable while closing its feedback policy", async () => {
    const config = await createStreamReviewFeedbackConfig({
      manifest: makeManifest(STREAM_REVIEW_PREVIOUS_VERSION),
    });

    expect(config.reviewVersion).toBe(STREAM_REVIEW_PREVIOUS_VERSION);
    expect(config.submissionsOpen).toBe(false);
    expect(config.acceptsPublicExploitReports).toBe(false);
    expect(config.pages).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ value: "overview" }),
        expect.objectContaining({ value: "reference-function" }),
      ])
    );
  });

  it("rejects a file that is absent from the exact manifest", async () => {
    await expect(
      createStreamReviewFeedbackConfig({
        manifest: makeManifest(),
        sourcePaths: ["src/NotInThisVersion.sol"],
      })
    ).rejects.toThrow("absent");
  });

  it("creates immutable editorial and technical feedback paths", () => {
    const editorialPage = STREAM_REVIEW_PAGES[0];
    if (!editorialPage) {
      throw new Error("Stream overview is missing.");
    }

    expect(
      createStreamEditorialFeedbackPageContext({
        page: editorialPage,
        version: STREAM_REVIEW_VERSION,
      }).canonicalPath
    ).toBe(`/reviews/${STREAM_REVIEW_SLUG}/versions/${STREAM_REVIEW_VERSION}`);

    expect(
      createStreamTechnicalFeedbackPageContext({
        canonicalPath: `/reviews/${STREAM_REVIEW_SLUG}/versions/${STREAM_REVIEW_VERSION}/reference`,
        pageId: "reference-overview",
        pageTitle: "Technical reference",
      }).canonicalPath
    ).toContain(`/versions/${STREAM_REVIEW_VERSION}/`);

    expect(() =>
      createStreamTechnicalFeedbackPageContext({
        canonicalPath: `/reviews/${STREAM_REVIEW_SLUG}/reference`,
        pageId: "reference-overview",
        pageTitle: "Technical reference",
      })
    ).toThrow("immutable");
  });

  it("defers destination resolution until an incoming request exists", async () => {
    process.env[DESTINATIONS_ENV] = JSON.stringify({
      staging: { "stream-review": STAGING_WAVE_ID },
    });

    await expect(
      resolveStreamReviewFeedbackDestination("https://staging.6529.io")
    ).resolves.toEqual({
      environment: "staging",
      logicalKey: "stream-review",
      waveId: STAGING_WAVE_ID,
    });
    expect(connection).toHaveBeenCalledTimes(1);
  });
});
