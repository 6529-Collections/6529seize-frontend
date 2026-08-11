jest.mock("next/dist/compiled/server-only", () => ({}), { virtual: true });

import { render, screen, within } from "@testing-library/react";

import {
  StreamReviewDevelopmentStatus,
  StreamReviewReviewerPrompts,
} from "@/components/public-review/StreamReviewDevelopmentStatus";
import { STREAM_REVIEW_PAGES } from "@/lib/public-review/streamReviewDefinition";

describe("StreamReviewDevelopmentStatus", () => {
  it("answers launch readiness in plain language", () => {
    render(<StreamReviewDevelopmentStatus />);

    const launchReadiness = screen.getByRole("region", {
      name: "Is Stream ready to launch?",
    });

    expect(
      screen.getByRole("heading", { name: "Is Stream ready to launch?" })
    ).toBeInTheDocument();
    expect(screen.getByText("Not yet.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Stream has working contracts and many tests. But important safety checks are still missing."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Before launch, Stream still needs:",
      })
    ).toBeInTheDocument();
    expect(within(launchReadiness).getAllByRole("listitem")).toHaveLength(4);
    expect(
      screen.getByText(
        "This page explains what works, what is still uncertain, and what must happen before Stream can launch."
      )
    ).toBeInTheDocument();
    expect(screen.getByText("Last checked")).toBeInTheDocument();
    expect(screen.getByText("Open release blockers")).toBeInTheDocument();
    expect(within(launchReadiness).getByText("10")).toBeInTheDocument();
    expect(
      within(launchReadiness).queryByRole("link", {
        name: "Development source (opens in a new tab)",
      })
    ).not.toBeInTheDocument();
    expect(
      within(launchReadiness).queryAllByRole("link", {
        name: /Open supporting evidence for .*\(opens in a new tab\)/,
      })
    ).toHaveLength(0);
    expect(
      within(launchReadiness).queryByText(
        /The detailed review below is version/
      )
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Where your input would help" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryAllByRole("link", { name: /^Open this question:/ })
    ).toHaveLength(0);
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
