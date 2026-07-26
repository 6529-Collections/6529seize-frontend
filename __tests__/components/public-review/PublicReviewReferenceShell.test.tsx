import { render, screen } from "@testing-library/react";

import { PublicReviewReferenceShell } from "@/components/public-review/PublicReviewReferenceShell";
import {
  STREAM_REVIEW_DEFINITION,
  getStreamReviewVersion,
} from "@/lib/public-review/streamReviewDefinition";

const ACTIVE_REVIEW_VERSION = getStreamReviewVersion();
if (!ACTIVE_REVIEW_VERSION) {
  throw new Error("Stream review active version is missing");
}

const SHELL_PROPS = {
  description: "Generated reference description",
  displayedVersion: STREAM_REVIEW_DEFINITION.activeVersion,
  editorialHref: "/reviews/6529-stream",
  feedbackHref: "/reviews/6529-stream/feedback",
  referenceHref: "/reviews/6529-stream/reference",
  source: ACTIVE_REVIEW_VERSION.source,
  title: "Solidity technical reference",
} as const;

describe("PublicReviewReferenceShell", () => {
  it("offers feedback during public review without mislabeling deep routes", () => {
    render(
      <PublicReviewReferenceShell
        {...SHELL_PROPS}
        review={STREAM_REVIEW_DEFINITION}
      >
        <p>Reference content</p>
      </PublicReviewReferenceShell>
    );

    expect(
      screen.getByRole("link", { name: "Jump to send feedback" })
    ).toHaveAttribute("href", "#public-review-feedback");
    expect(
      screen.getByRole("link", { name: "Open technical reference" })
    ).not.toHaveAttribute("aria-current");
  });

  it("keeps the feedback ledger but removes the submit shortcut when closed", () => {
    render(
      <PublicReviewReferenceShell
        {...SHELL_PROPS}
        review={{
          ...STREAM_REVIEW_DEFINITION,
          status: "REVIEW_CLOSED",
        }}
      >
        <p>Reference content</p>
      </PublicReviewReferenceShell>
    );

    expect(
      screen.getByRole("link", { name: "View public feedback" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Jump to send feedback" })
    ).not.toBeInTheDocument();
  });
});
