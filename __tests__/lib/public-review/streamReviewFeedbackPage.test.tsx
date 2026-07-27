jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

jest.mock("@/components/public-review/PublicReviewLedger", () => ({
  __esModule: true,
  default: ({
    internalSourceBasePath,
  }: {
    readonly internalSourceBasePath: string;
  }) => <div data-testid="source-base">{internalSourceBasePath}</div>,
}));

jest.mock("@/components/public-review/PublicReviewStatusBanner", () => ({
  PublicReviewStatusBanner: () => null,
}));

jest.mock("@/config/publicReviews", () => ({
  isPublicReviewEnabled: () => true,
}));

jest.mock("@/lib/public-review/streamReviewFeedback.server", () => ({
  createStreamReviewFeedbackConfig: jest.fn(async () => ({})),
  resolveStreamReviewFeedbackDestination: jest.fn(async () => ({})),
}));

jest.mock("@/lib/public-review/streamSolidityReference", () => ({
  getStreamSolidityReferenceReader: () => ({
    loadManifest: jest.fn(async (version: string) => ({
      manifest: {
        reviewId: "6529-stream",
        reviewVersion: version,
        source: {
          repository: "6529-Collections/6529Stream",
          commit: "513bd7e079eafe109df6ae1ae21bfbca6fec6786",
        },
      },
    })),
  }),
}));

import { render, screen } from "@testing-library/react";

import { renderStreamReviewFeedbackPage } from "@/lib/public-review/streamReviewFeedbackPage";

describe("renderStreamReviewFeedbackPage", () => {
  it("keeps active ledger source links on the active review route", async () => {
    render(
      await renderStreamReviewFeedbackPage({
        baseEndpoint: "https://staging.6529.io",
      })
    );

    expect(screen.getByTestId("source-base")).toHaveTextContent(
      "/reviews/6529-stream"
    );
  });

  it("lets the ledger build immutable source links from the review root", async () => {
    render(
      await renderStreamReviewFeedbackPage({
        baseEndpoint: "https://staging.6529.io",
        version: "2026-07-26.1",
      })
    );

    expect(screen.getByTestId("source-base")).toHaveTextContent(
      "/reviews/6529-stream"
    );
  });
});
