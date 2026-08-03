import { render, screen, within } from "@testing-library/react";

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
      screen.getByRole("link", { name: "Send feedback" })
    ).toHaveAttribute("href", "#public-review-feedback");
    const navigation = screen.getByRole("navigation", {
      name: "Review-wide destinations",
    });
    expect(
      within(navigation).getByRole("link", {
        name: "Back to review contents",
      })
    ).toHaveAttribute("href", "/reviews/6529-stream");
    expect(
      within(navigation).getByRole("link", { name: "All public feedback" })
    ).toHaveAttribute("href", "/reviews/6529-stream/feedback");
    expect(
      within(navigation).queryByRole("link", { name: "Technical reference" })
    ).not.toBeInTheDocument();
  });

  it("keeps the feedback ledger but removes the submit shortcut when closed", () => {
    render(
      <PublicReviewReferenceShell
        {...SHELL_PROPS}
        review={{
          ...STREAM_REVIEW_DEFINITION,
          status: "REVIEW_CLOSED",
          versions: STREAM_REVIEW_DEFINITION.versions.map((version) => ({
            ...version,
            status: "REVIEW_CLOSED",
          })),
        }}
      >
        <p>Reference content</p>
      </PublicReviewReferenceShell>
    );

    expect(
      screen.getByRole("link", { name: "All public feedback" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Send feedback" })
    ).not.toBeInTheDocument();
  });
});
