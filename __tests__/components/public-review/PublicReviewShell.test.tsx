import { render, screen } from "@testing-library/react";

import { PublicReviewShell } from "@/components/public-review/PublicReviewShell";
import {
  STREAM_REVIEW_DEFINITION,
  STREAM_REVIEW_SOURCE_COMMIT,
  getStreamReviewVersion,
} from "@/lib/public-review/streamReviewDefinition";

describe("PublicReviewShell", () => {
  it("renders a source-pinned, audience-aware fourteen-page review shell", () => {
    const reviewVersion = getStreamReviewVersion();
    const overview = reviewVersion?.pages[0];
    if (!overview || !reviewVersion) {
      throw new Error("Stream review overview is missing");
    }

    render(
      <PublicReviewShell
        editorialMarkdown={"# Editorial title\n\n## The short answer\n\nBody."}
        page={overview}
        reviewVersion={reviewVersion}
        sections={[{ id: "the-short-answer", title: "The short answer" }]}
        displayedVersion={STREAM_REVIEW_DEFINITION.activeVersion}
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
        name: new RegExp(
          `^Source ${STREAM_REVIEW_SOURCE_COMMIT.slice(0, 10)}.*${STREAM_REVIEW_SOURCE_COMMIT}`
        ),
      })
    ).toHaveAttribute(
      "href",
      `https://github.com/6529-Collections/6529Stream/tree/${STREAM_REVIEW_SOURCE_COMMIT}`
    );
    expect(
      screen.getAllByRole("link", { name: /Community Review/ })
    ).toHaveLength(2);
  });
});
