jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import {
  createStreamEditorialFeedbackPageContext,
  createStreamReviewFeedbackConfig,
  createStreamTechnicalFeedbackPageContext,
} from "@/lib/public-review/streamReviewFeedback.server";
import type { SolidityReferenceManifest } from "@/lib/public-review/solidityReferenceTypes";
import {
  STREAM_REVIEW_PAGES,
  STREAM_REVIEW_SLUG,
  STREAM_REVIEW_VERSION,
} from "@/lib/public-review/streamReviewDefinition";

jest.mock("@/lib/public-review/editorialContent", () => ({
  loadStreamEditorialContent: jest.fn(
    async (page: { readonly title: string }) =>
      `# ${page.title}\n\n## Exact section\n\nBody.`
  ),
}));

const SOURCE_PATH = "src/StreamCore.sol";
const SOURCE_COMMIT = "0123456789abcdef0123456789abcdef01234567";
const SOURCE_SHA256 = "a".repeat(64);

function makeManifest(): SolidityReferenceManifest {
  return {
    reviewId: STREAM_REVIEW_SLUG,
    reviewVersion: STREAM_REVIEW_VERSION,
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
    expect(config.categories).toContainEqual(
      expect.objectContaining({
        value: "possible-exploitable-security-vulnerability",
      })
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
    ).toBe(
      `/reviews/${STREAM_REVIEW_SLUG}/versions/${STREAM_REVIEW_VERSION}`
    );

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
});
