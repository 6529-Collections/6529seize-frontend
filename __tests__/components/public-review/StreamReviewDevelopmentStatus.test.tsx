jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import { render, screen } from "@testing-library/react";

import {
  StreamReviewDevelopmentStatus,
  StreamReviewReviewerPrompts,
} from "@/components/public-review/StreamReviewDevelopmentStatus";
import {
  STREAM_REVIEW_PAGES,
  STREAM_REVIEW_SOURCE_COMMIT,
  STREAM_REVIEW_VERSION,
} from "@/lib/public-review/streamReviewDefinition";

describe("StreamReviewDevelopmentStatus", () => {
  it("separates the dated development update from the pinned review snapshot", () => {
    render(
      <StreamReviewDevelopmentStatus
        reviewSourceCommit={STREAM_REVIEW_SOURCE_COMMIT}
        reviewVersion={STREAM_REVIEW_VERSION}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Development update" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Evidence checklist: 2 complete/)
    ).toHaveTextContent("3 under review, and 15 remaining");
    expect(screen.getByText(/10 recorded issues/)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Where your input would help" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryAllByRole("link", { name: /^Open this question:/ })
    ).toHaveLength(0);
    expect(
      screen.getByRole("link", {
        name: "Development source (opens in a new tab)",
      })
    ).toHaveAttribute(
      "href",
      "https://github.com/6529-Collections/6529Stream/commit/5021c8060950c3fef995271e674ed4b2007fee6d"
    );
    const evidenceLinks = screen.getAllByRole("link", {
      name: /Open supporting evidence for .*\(opens in a new tab\)/,
    });
    expect(evidenceLinks).toHaveLength(8);
    expect(
      new Set(evidenceLinks.map((link) => link.getAttribute("aria-label"))).size
    ).toBe(evidenceLinks.length);
    expect(
      screen.getByText(/The detailed review below is version/)
    ).toHaveTextContent(
      `version ${STREAM_REVIEW_VERSION}, pinned to contract source ${STREAM_REVIEW_SOURCE_COMMIT.slice(0, 8)}`
    );
    expect(document.querySelector("time")).toHaveAttribute(
      "datetime",
      "2026-08-01T00:00:00.000Z"
    );
  });

  it("renders the review questions as a separate community entry point", () => {
    render(<StreamReviewReviewerPrompts pages={STREAM_REVIEW_PAGES} />);

    expect(
      screen.getByRole("heading", { name: "Where your input would help" })
    ).toBeInTheDocument();
    const questionLinks = screen.getAllByRole("link", {
      name: /^Open this question:/,
    });
    expect(questionLinks).toHaveLength(6);
    expect(
      screen.getByRole("link", {
        name: "Open this question: Artist choices",
      })
    ).toHaveAttribute(
      "href",
      "/reviews/6529-stream/for-artists#questions-for-artists"
    );
  });
});
