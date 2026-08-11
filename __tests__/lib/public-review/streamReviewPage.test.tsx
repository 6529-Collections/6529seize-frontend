jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

jest.mock("next/navigation", () => ({
  notFound: jest.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
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
    page,
    sections,
    showEditorialContent,
  }: {
    readonly editorialMarkdown: string;
    readonly feedbackSlot: React.ReactNode;
    readonly introNotice?: React.ReactNode;
    readonly page: { readonly summaryKey: string };
    readonly sections: readonly unknown[];
    readonly showEditorialContent?: boolean;
  }) => (
    <div
      data-testid="review-shell"
      data-editorial-visible={showEditorialContent !== false}
      data-section-count={sections.length}
      data-summary-key={page.summaryKey}
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

jest.mock("@/components/public-review/StreamReviewForArtistsDetails", () => ({
  StreamReviewForArtistsDetails: () => <div>Artist details</div>,
}));

jest.mock("@/components/public-review/StreamReviewOverviewGuide", () => ({
  StreamReviewOverviewGuide: () => <div>Overview guide</div>,
}));

jest.mock("@/components/public-review/StreamReviewRolesGuide", () => ({
  STREAM_REVIEW_ROLES_GUIDE_SECTIONS: [
    { id: "start-with-status", title: "Start with status" },
    { id: "main-risks", title: "Main risks" },
  ],
  StreamReviewRolesGuide: () => <div>Roles guide</div>,
}));

jest.mock("@/lib/public-review/editorialContent", () => ({
  loadStreamEditorialContent: jest.fn(async (page: { readonly id: string }) => {
    if (page.id === "security-testing-and-known-limitations") {
      return "# Editorial title\n\nThe separately dated development update on the current Overview records work\ncompleted after this snapshot.\n\n## Technical section\n\nBody.";
    }
    if (page.id === "artwork-lifecycle") {
      return "# Artwork lifecycle\n\nA Stream artwork moves through a sequence of deliberate commitments. Collection\nidentity comes first. Artwork materials, distribution, payment, randomness, and\nmetadata are then assembled around it. Supply and Core configuration can later\nbe closed, preservation evidence can accumulate, and a final ceremony can make\nthe remaining artwork state terminal.\n\nThat sequence is a major part of the design. “Minted,” “sold,” “frozen,”\n“preserved,” and “final” describe different facts. Keeping them separate makes\neach commitment visible and reviewable.\n\nThis page follows one collection through the lifecycle and explains what each\nstage protects.\n\n## 1. The collection receives a permanent identity\n\nOld technical identity copy.\n\n## 2. The artwork package is assembled\n\nOld artwork package copy.\n\n## 3. The artist can approve a specific state\n\nOld artist approval copy.\n\n## 4. A distribution policy is selected\n\nDistribution body.\n\n## 5. Curation becomes a bound authorization\n\nOld curation copy.\n\n## 6. The selected mint lane executes atomically\n\nOld mint execution copy.";
    }
    return "# Editorial title\n\n## Technical section\n\nBody.";
  }),
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
import { notFound } from "next/navigation";

import {
  loadStreamEditorialContent,
  PublicReviewEditorialContentError,
} from "@/lib/public-review/editorialContent";
import { renderStreamReviewRoutePage } from "@/lib/public-review/streamReviewPage";

const loadStreamEditorialContentMock = jest.mocked(loadStreamEditorialContent);
const notFoundMock = jest.mocked(notFound);

describe("renderStreamReviewRoutePage", () => {
  it("renders the not-found route when editorial content is unavailable", async () => {
    loadStreamEditorialContentMock.mockRejectedValueOnce(
      new PublicReviewEditorialContentError("Editorial content is unavailable")
    );

    await expect(
      renderStreamReviewRoutePage({
        params: Promise.resolve({ review: "6529-stream" }),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });

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

  it("shows the plain-language opening on the current Artwork Lifecycle page", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          page: "artwork-lifecycle",
        }),
      })
    );

    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "The lifecycle in one minute"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "A Stream artwork is built step by step."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Minted, sold, frozen, preserved, and final are different stages."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "1. The collection gets a permanent identity"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Before anything is minted or sold, Stream gives the collection a permanent ID."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Why this matters: The artwork keeps one clear identity even when the tools around it change."
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "Old technical identity copy."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "2. The artwork package is prepared"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "A Stream artwork is more than an image."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "A tool can be replaced without giving the artwork a new identity."
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "Old artwork package copy."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "3. The artist can sign the current setup"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "This signature is evidence only."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "A missing or outdated signature does not pause or stop minting."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "A successful mint changes the live supply and token metadata."
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "Old artist approval copy."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "4. The minting rules are chosen"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "The same permission can cover later mints while the policy stays the same."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "An ADR, or Architecture Decision Record, is an accepted design decision."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "The paths do not share every check or counter. Each path must be reviewed on its own."
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "Distribution body."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "5. The selected drop receives signed approval"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "TDH, which means Total Days Held."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "The signer is a wallet trusted to approve the result."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "The contract does not choose the artist, calculate TDH, or decide whether the result is fair."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "In this path, one approval covers one token. After a successful use, it cannot be used again."
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "Old curation copy."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "6. The mint completes fully or not at all"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "All checks and changes happen in one blockchain transaction."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "These paths do not use the same approval or counters."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "The reviewed contracts do not yet enforce that check."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "A collector cannot receive a half-finished mint."
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "Old mint execution copy."
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "sequence of deliberate commitments"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-section-count",
      "7"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-summary-key",
      "publicReview.pages.artworkLifecycle.currentSummary"
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

  it("replaces the current For Artists editorial with plain-language details", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          page: "for-artists",
        }),
      })
    );

    expect(screen.getByText("Artist guide")).toBeInTheDocument();
    expect(screen.getByText("Artist details")).toBeInTheDocument();
    expect(screen.queryByText("Authorship note")).not.toBeInTheDocument();
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-editorial-visible",
      "false"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-section-count",
      "1"
    );
    expect(screen.getByTestId("feedback-section-count")).toHaveTextContent("1");
  });

  it("replaces the current roles editorial with a status-first guide", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          page: "roles-and-trust",
        }),
      })
    );

    expect(screen.getByText("Roles guide")).toBeInTheDocument();
    expect(screen.queryByText("Authorship note")).not.toBeInTheDocument();
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-editorial-visible",
      "false"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-section-count",
      "2"
    );
    expect(screen.getByTestId("feedback-section-count")).toHaveTextContent("2");
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
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-summary-key",
      "publicReview.pages.artworkLifecycle.summary"
    );
  });

  it("keeps immutable Artwork Lifecycle routes unchanged", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          version: "2026-08-01.1",
          page: "artwork-lifecycle",
        }),
      })
    );

    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "A Stream artwork moves through a sequence of deliberate commitments."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Old technical identity copy."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Old artwork package copy."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Old artist approval copy."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "4. A distribution policy is selected"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Distribution body."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "5. Curation becomes a bound authorization"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Old curation copy."
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "6. The selected mint lane executes atomically"
    );
    expect(screen.getByTestId("editorial-copy")).toHaveTextContent(
      "Old mint execution copy."
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "The lifecycle in one minute"
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "Before anything is minted or sold, Stream gives the collection a permanent ID."
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "A Stream artwork is more than an image."
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "The artist can sign the current setup"
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "The minting rules are chosen"
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "The selected drop receives signed approval"
    );
    expect(screen.getByTestId("editorial-copy")).not.toHaveTextContent(
      "The mint completes fully or not at all"
    );
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-section-count",
      "6"
    );
  });

  it("keeps immutable For Artists routes unchanged", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          page: "for-artists",
          version: "2026-08-01.1",
        }),
      })
    );

    expect(screen.queryByText("Artist guide")).not.toBeInTheDocument();
    expect(screen.queryByText("Artist details")).not.toBeInTheDocument();
    expect(screen.getByText("Authorship note")).toBeInTheDocument();
    expect(screen.getByTestId("review-shell")).toHaveAttribute(
      "data-editorial-visible",
      "true"
    );
  });

  it("keeps immutable roles routes unchanged", async () => {
    render(
      await renderStreamReviewRoutePage({
        params: Promise.resolve({
          review: "6529-stream",
          page: "roles-and-trust",
          version: "2026-08-01.1",
        }),
      })
    );

    expect(screen.queryByText("Roles guide")).not.toBeInTheDocument();
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
