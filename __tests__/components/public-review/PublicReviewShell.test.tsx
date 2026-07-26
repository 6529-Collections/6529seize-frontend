import { render, screen } from "@testing-library/react";

import { PublicReviewShell } from "@/components/public-review/PublicReviewShell";
import {
  STREAM_REVIEW_DEFINITION,
  STREAM_REVIEW_SOURCE_COMMIT,
} from "@/lib/public-review/streamReviewDefinition";

describe("PublicReviewShell", () => {
  it("renders a source-pinned, audience-aware fourteen-page review shell", () => {
    const overview = STREAM_REVIEW_DEFINITION.pages[0];
    if (!overview) {
      throw new Error("Stream review overview is missing");
    }

    render(
      <PublicReviewShell
        editorialMarkdown={"# Editorial title\n\n## The short answer\n\nBody."}
        page={overview}
        review={STREAM_REVIEW_DEFINITION}
        sections={[{ id: "the-short-answer", title: "The short answer" }]}
        displayedVersion={STREAM_REVIEW_DEFINITION.activeVersion}
        feedbackSlot={<div>Feedback form</div>}
        source={STREAM_REVIEW_DEFINITION.source}
      />
    );

    expect(
      screen.getByRole("heading", { level: 1, name: "Overview" })
    ).toBeInTheDocument();
    expect(screen.getByText("Public review")).toBeInTheDocument();
    expect(screen.getByText("Not deployed")).toBeInTheDocument();
    expect(screen.getByText("Pre-audit")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 14")).toBeInTheDocument();
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
    expect(
      screen.getByRole("link", { name: "Jump to send feedback" })
    ).toHaveAttribute("href", "#public-review-feedback");
    expect(
      screen.getAllByRole("navigation", { name: "On this page" })
    ).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: "Start the Artists path" })
    ).toHaveAttribute("href", "/reviews/6529-stream/artwork-lifecycle");
    expect(document.querySelector("main")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Review status" })
    ).not.toBeInTheDocument();
  });

  it("uses the exact resolved source identity instead of the active default", () => {
    const overview = STREAM_REVIEW_DEFINITION.pages[0];
    if (!overview) {
      throw new Error("Stream review overview is missing");
    }
    const historicalCommit = "b".repeat(40);
    render(
      <PublicReviewShell
        editorialMarkdown="# Editorial title"
        page={overview}
        review={STREAM_REVIEW_DEFINITION}
        sections={[]}
        routeVersion="2026-07-25.1"
        displayedVersion="2026-07-25.1"
        feedbackSlot={<div>Feedback form</div>}
        source={{
          repository: STREAM_REVIEW_DEFINITION.source.repository,
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
    expect(
      screen.getByRole("link", { name: "View public feedback" })
    ).toHaveAttribute(
      "href",
      "/reviews/6529-stream/versions/2026-07-25.1/feedback"
    );
  });
});
