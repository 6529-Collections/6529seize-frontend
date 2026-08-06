import { render, screen, waitFor } from "@testing-library/react";

import { PublicReviewShell } from "@/components/public-review/PublicReviewShell";
import { StreamReviewBotAuthorshipNote } from "@/components/public-review/StreamReviewBotAuthorshipNote";
import {
  STREAM_REVIEW_DEFINITION,
  STREAM_REVIEW_SOURCE_COMMIT,
  getStreamReviewVersion,
} from "@/lib/public-review/streamReviewDefinition";

const ACTIVE_REVIEW_VERSION = getStreamReviewVersion();
if (!ACTIVE_REVIEW_VERSION) {
  throw new Error("Stream review active version is missing");
}

describe("PublicReviewShell", () => {
  it("renders a source-pinned, audience-aware fourteen-page review shell", () => {
    const overview = ACTIVE_REVIEW_VERSION.pages[0];
    if (!overview) {
      throw new Error("Stream review overview is missing");
    }

    render(
      <PublicReviewShell
        editorialMarkdown={"# Editorial title\n\n## The short answer\n\nBody."}
        page={overview}
        review={STREAM_REVIEW_DEFINITION}
        reviewVersion={ACTIVE_REVIEW_VERSION}
        sections={[{ id: "the-short-answer", title: "The short answer" }]}
        displayedVersion={STREAM_REVIEW_DEFINITION.activeVersion}
        feedbackSlot={<div>Feedback form</div>}
        introNotice={<StreamReviewBotAuthorshipNote />}
        source={ACTIVE_REVIEW_VERSION.source}
      />
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Overview" })
    ).toBeInTheDocument();
    expect(screen.getByText("Public review")).toBeInTheDocument();
    expect(screen.getByText("Preparing for launch")).toBeInTheDocument();
    expect(screen.getByText("Audit planned")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 14")).toBeInTheDocument();
    expect(
      screen.getByRole("complementary", { name: "A small human disclosure" })
    ).toHaveTextContent(
      "punk6529 would like the record to show that bots wrote this"
    );
    expect(
      screen.getByRole("heading", { name: "Choose a reading path" })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("navigation", {
        name: "All contract review pages",
      })
    ).toHaveLength(2);
    expect(
      screen.getByRole("navigation", {
        name: "Previous and next contract review pages",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: `Open the exact 6529 Stream source commit ${STREAM_REVIEW_SOURCE_COMMIT}`,
      })
    ).toHaveAttribute(
      "href",
      `https://github.com/6529-Collections/6529Stream/tree/${STREAM_REVIEW_SOURCE_COMMIT}`
    );
    expect(
      screen.getAllByRole("link", { name: /Community Review/ })
    ).not.toHaveLength(0);
    const commentsToggle = screen.getByRole("button", {
      name: "Show feedback",
    });
    expect(commentsToggle).toHaveAttribute(
      "aria-controls",
      "public-review-feedback"
    );
    expect(commentsToggle).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById("public-review-feedback")).toHaveAttribute(
      "hidden"
    );
    const mobileReviewWideNavigation = screen.getByRole("navigation", {
      name: "Review-wide destinations in mobile review navigation",
    });
    expect(mobileReviewWideNavigation).toHaveAttribute(
      "aria-labelledby",
      "public-review-wide-destinations-mobile"
    );
    const sidebarReviewWideNavigation = screen.getByRole("navigation", {
      name: "Review-wide destinations in review sidebar",
    });
    expect(sidebarReviewWideNavigation).toHaveAttribute(
      "aria-labelledby",
      "public-review-wide-destinations-sidebar"
    );
    expect(
      screen.getAllByRole("link", { name: "Technical reference" })
    ).toHaveLength(2);
    expect(
      screen.getAllByRole("link", { name: "All public feedback" })
    ).toHaveLength(2);
    expect(
      screen.queryByRole("link", { name: "Review" })
    ).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: "The short answer" })
    ).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: "Start the Artists path" })
    ).toHaveAttribute("href", "/reviews/6529-stream/for-artists");
    expect(
      screen.queryByText("View all 12 pages in this path")
    ).not.toBeInTheDocument();
    expect(document.querySelector("main")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Review status" })
    ).not.toBeInTheDocument();
  });

  it("focuses the comment panel only after a feedback hash reveals it", async () => {
    const overview = ACTIVE_REVIEW_VERSION.pages[0];
    if (!overview) {
      throw new Error("Stream review overview is missing");
    }
    window.localStorage.setItem("public-review-comment-panel-open", "false");
    window.history.replaceState(null, "", "#public-review-feedback");

    render(
      <PublicReviewShell
        editorialMarkdown="# Editorial title"
        page={overview}
        review={STREAM_REVIEW_DEFINITION}
        reviewVersion={ACTIVE_REVIEW_VERSION}
        sections={[]}
        displayedVersion={STREAM_REVIEW_DEFINITION.activeVersion}
        feedbackSlot={<div>Feedback form</div>}
        source={ACTIVE_REVIEW_VERSION.source}
      />
    );

    await screen.findByRole("dialog", { name: "Page comments" });
    const commentsPanel = document.getElementById("public-review-feedback");
    expect(commentsPanel).toBeInTheDocument();
    await waitFor(() => expect(commentsPanel).toHaveFocus());

    window.localStorage.setItem("public-review-comment-panel-open", "false");
    window.history.replaceState(null, "", window.location.pathname);
  });

  it("can replace the generic overview paths with a review-specific guide", () => {
    const overview = ACTIVE_REVIEW_VERSION.pages[0];
    if (!overview) {
      throw new Error("Stream review overview is missing");
    }

    render(
      <PublicReviewShell
        editorialMarkdown="# Editorial title"
        page={overview}
        review={STREAM_REVIEW_DEFINITION}
        reviewVersion={ACTIVE_REVIEW_VERSION}
        sections={[]}
        displayedVersion={STREAM_REVIEW_DEFINITION.activeVersion}
        feedbackSlot={<div>Feedback form</div>}
        showAudiencePaths={false}
        source={ACTIVE_REVIEW_VERSION.source}
      />
    );

    expect(
      screen.queryByRole("heading", { name: "Choose a reading path" })
    ).not.toBeInTheDocument();
  });

  it("uses the exact resolved source identity instead of the active default", () => {
    const overview = ACTIVE_REVIEW_VERSION.pages[0];
    if (!overview) {
      throw new Error("Stream review overview is missing");
    }
    const historicalCommit = "b".repeat(40);
    const historicalVersion = {
      ...ACTIVE_REVIEW_VERSION,
      version: "2026-07-25.1",
      status: "REVIEW_CLOSED" as const,
      source: {
        repository: ACTIVE_REVIEW_VERSION.source.repository,
        commit: historicalCommit,
      },
    };
    render(
      <PublicReviewShell
        editorialMarkdown="# Editorial title"
        page={overview}
        review={{
          ...STREAM_REVIEW_DEFINITION,
          versions: [historicalVersion, ...STREAM_REVIEW_DEFINITION.versions],
        }}
        reviewVersion={historicalVersion}
        sections={[]}
        routeVersion="2026-07-25.1"
        displayedVersion="2026-07-25.1"
        feedbackSlot={<div>Feedback form</div>}
        source={{
          repository: ACTIVE_REVIEW_VERSION.source.repository,
          commit: historicalCommit,
        }}
      />
    );

    expect(
      screen.getByRole("link", {
        name: `Open the exact 6529 Stream source commit ${historicalCommit}`,
      })
    ).toHaveAttribute(
      "href",
      `https://github.com/6529-Collections/6529Stream/tree/${historicalCommit}`
    );
    const historicalFeedbackLinks = screen.getAllByRole("link", {
      name: "All public feedback",
    });
    expect(historicalFeedbackLinks).toHaveLength(2);
    historicalFeedbackLinks.forEach((link) =>
      expect(link).toHaveAttribute(
        "href",
        "/reviews/6529-stream/versions/2026-07-25.1/feedback"
      )
    );
    const historicalReferenceLinks = screen.getAllByRole("link", {
      name: "Technical reference",
    });
    expect(historicalReferenceLinks).toHaveLength(2);
    historicalReferenceLinks.forEach((link) =>
      expect(link).toHaveAttribute(
        "href",
        "/reviews/6529-stream/versions/2026-07-25.1/reference"
      )
    );
  });

  it("builds every reusable shell route from another review slug", () => {
    const overview = ACTIVE_REVIEW_VERSION.pages[0];
    if (!overview) {
      throw new Error("Stream review overview is missing");
    }

    const candidateVersion = {
      ...ACTIVE_REVIEW_VERSION,
      version: "candidate-2",
    };
    render(
      <PublicReviewShell
        editorialMarkdown="# Another review"
        page={overview}
        review={{
          ...STREAM_REVIEW_DEFINITION,
          id: "another-contract",
          slug: "another-contract",
          contractName: "Another Contract",
          title: "Another Contract Review",
          activeVersion: candidateVersion.version,
          versions: [candidateVersion],
        }}
        reviewVersion={candidateVersion}
        sections={[]}
        routeVersion="candidate-2"
        displayedVersion="candidate-2"
        feedbackSlot={<div>Feedback form</div>}
        source={ACTIVE_REVIEW_VERSION.source}
      />
    );

    const candidateFeedbackLinks = screen.getAllByRole("link", {
      name: "All public feedback",
    });
    expect(candidateFeedbackLinks).toHaveLength(2);
    candidateFeedbackLinks.forEach((link) =>
      expect(link).toHaveAttribute(
        "href",
        "/reviews/another-contract/versions/candidate-2/feedback"
      )
    );
    const candidateReferenceLinks = screen.getAllByRole("link", {
      name: "Technical reference",
    });
    expect(candidateReferenceLinks).toHaveLength(2);
    candidateReferenceLinks.forEach((link) =>
      expect(link).toHaveAttribute(
        "href",
        "/reviews/another-contract/versions/candidate-2/reference"
      )
    );
    expect(screen.getByText("Another Contract contract")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: `Open the exact Another Contract source commit ${ACTIVE_REVIEW_VERSION.source.commit}`,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Start the Artists path" })
    ).toHaveAttribute(
      "href",
      "/reviews/another-contract/versions/candidate-2/for-artists"
    );
    expect(
      screen.getByRole("link", { name: "Start the Community path" })
    ).toHaveAttribute(
      "href",
      "/reviews/another-contract/versions/candidate-2/community-review"
    );
    expect(
      screen.getByRole("link", {
        name: "Start the Technical reviewers path",
      })
    ).toHaveAttribute(
      "href",
      "/reviews/another-contract/versions/candidate-2/roles-and-trust"
    );
    expect(
      screen.getByRole("link", { name: "Start the Auditors path" })
    ).toHaveAttribute(
      "href",
      "/reviews/another-contract/versions/candidate-2/security-testing-and-known-limitations"
    );
    expect(
      screen.getAllByRole("link", { name: /Artwork Lifecycle/ })[0]
    ).toHaveAttribute(
      "href",
      "/reviews/another-contract/versions/candidate-2/artwork-lifecycle"
    );
  });

  it("keeps the ledger visible but removes the submit shortcut after review closes", () => {
    const overview = ACTIVE_REVIEW_VERSION.pages[0];
    if (!overview) {
      throw new Error("Stream review overview is missing");
    }

    render(
      <PublicReviewShell
        editorialMarkdown="# Closed review"
        page={overview}
        review={{
          ...STREAM_REVIEW_DEFINITION,
          status: "REVIEW_CLOSED",
          versions: STREAM_REVIEW_DEFINITION.versions.map((version) => ({
            ...version,
            status: "REVIEW_CLOSED",
          })),
        }}
        reviewVersion={{
          ...ACTIVE_REVIEW_VERSION,
          status: "REVIEW_CLOSED",
        }}
        sections={[]}
        displayedVersion={STREAM_REVIEW_DEFINITION.activeVersion}
        feedbackSlot={<div>Feedback closed</div>}
        source={ACTIVE_REVIEW_VERSION.source}
      />
    );

    expect(
      screen.getAllByRole("link", { name: "All public feedback" })
    ).toHaveLength(2);
    expect(
      screen.queryByRole("link", { name: "Send feedback" })
    ).not.toBeInTheDocument();
  });
});
