jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

jest.mock("next/navigation", () => ({
  notFound: jest.fn(),
}));

jest.mock("@/components/providers/metadata", () => ({
  getAppMetadata: () => ({}),
}));

jest.mock("@/config/env", () => ({
  publicEnv: { BASE_ENDPOINT: "https://staging.6529.io" },
}));

jest.mock("@/config/publicReviews", () => ({
  isPublicReviewEnabled: () => true,
}));

jest.mock("@/components/public-review/PublicReviewEditorialFeedback", () => ({
  PublicReviewEditorialFeedback: ({
    sections,
  }: {
    readonly sections: readonly unknown[];
  }) => <div data-testid="feedback-section-count">{sections.length}</div>,
}));

jest.mock("@/components/public-review/PublicReviewShell", () => ({
  PublicReviewShell: ({
    editorialMarkdown,
    feedbackSlot,
    introNotice,
    sections,
    showEditorialContent,
  }: {
    readonly editorialMarkdown: string;
    readonly feedbackSlot: React.ReactNode;
    readonly introNotice?: React.ReactNode;
    readonly sections: readonly unknown[];
    readonly showEditorialContent?: boolean;
  }) => (
    <div
      data-testid="review-shell"
      data-editorial-visible={showEditorialContent !== false}
      data-section-count={sections.length}
    >
      {introNotice}
      <div data-testid="editorial-copy">{editorialMarkdown}</div>
      {feedbackSlot}
    </div>
  ),
}));

jest.mock("@/components/public-review/StreamReviewBotAuthorshipNote", () => ({
  StreamReviewBotAuthorshipNote: () => <div>Authorship note</div>,
}));

jest.mock("@/components/public-review/StreamReviewDevelopmentStatus", () => ({
  StreamReviewDevelopmentStatus: () => <div>Development update</div>,
  StreamReviewReviewerPrompts: () => <div>Reviewer prompts</div>,
}));

jest.mock("@/components/public-review/StreamReviewForArtistsGuide", () => ({
  StreamReviewForArtistsGuide: () => <div>Artist guide</div>,
}));

jest.mock("@/components/public-review/StreamReviewOverviewGuide", () => ({
  StreamReviewOverviewGuide: () => <div>Overview guide</div>,
}));

jest.mock("@/lib/public-review/editorialContent", () => ({
  loadStreamEditorialContent: jest.fn(async (page: { readonly id: string }) =>
    page.id === "security-testing-and-known-limitations"
      ? "# Editorial title\n\nThe separately dated development update on the current Overview records work\ncompleted after this snapshot.\n\n## Technical section\n\nBody."
      : "# Editorial title\n\n## Technical section\n\nBody."
  ),
  PublicReviewEditorialContentError: class extends Error {},
}));

jest.mock("@/lib/public-review/streamReviewFeedback.server", () => ({
  createStreamEditorialFeedbackPageContext: jest.fn(() => ({})),
  createStreamReviewFeedbackConfig: jest.fn(async () => ({})),
  resolveStreamReviewFeedbackDestination: jest.fn(async () => ({})),
}));

jest.mock("@/lib/public-review/streamSolidityReference", () => ({
  getStreamSolidityReferenceReader: () => ({
    loadManifest: jest.fn(async () => ({
      manifest: {
        source: {
          repository: "6529-Collections/6529Stream",
          commit: "513bd7e079eafe109df6ae1ae21bfbca6fec6786",
        },
      },
    })),
  }),
}));

import { render, screen } from "@testing-library/react";

import { renderStreamReviewRoutePage } from "@/lib/public-review/streamReviewPage";

describe("renderStreamReviewRoutePage", () => {
  it("ends the current Overview after its plain-language guide", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({ review: "6529-stream" }),
      })
    );

    expect(screen.getByText("Overview guide")).toBeInTheDocument();
    expect(screen.queryByText("Development update")).not.toBeInTheDocument();
    expect(screen.queryByText("Reviewer prompts")).not.toBeInTheDocument();
    expect(screen.queryByText("Authorship note")).not.toBeInTheDocument();
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-editorial-visible",
      "false"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-section-count",
      "0"
    );
    expect(screen.getByTestId("feedback-section-count")).toHaveTextContent("0");
  });

  it("puts the current development update on Where Development Stands", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          page: "security-testing-and-known-limitations",
        }),
      })
    );

    expect(screen.getByText("Development update")).toBeInTheDocument();
    expect(screen.queryByText("Reviewer prompts")).not.toBeInTheDocument();
    expect(screen.queryByText("Authorship note")).not.toBeInTheDocument();
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-editorial-visible",
      "true"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "The separately dated development update above records work completed after this snapshot."
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "on the current Overview"
    );
  });

  it("puts current reviewer prompts and authorship on Community Review", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          page: "community-review",
        }),
      })
    );

    expect(screen.getByText("Reviewer prompts")).toBeInTheDocument();
    expect(screen.getByText("Authorship note")).toBeInTheDocument();
    expect(screen.queryByText("Development update")).not.toBeInTheDocument();
  });

  it("keeps immutable Overview routes unchanged", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          version: "2026-08-01.1",
        }),
      })
    );

    expect(screen.queryByText("Overview guide")).not.toBeInTheDocument();
    expect(screen.queryByText("Development update")).not.toBeInTheDocument();
    expect(screen.queryByText("Reviewer prompts")).not.toBeInTheDocument();
    expect(screen.getByText("Authorship note")).toBeInTheDocument();
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-editorial-visible",
      "true"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-section-count",
      "1"
    );
  });
});
