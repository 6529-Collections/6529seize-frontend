import { render, screen, waitFor } from "@testing-library/react";

import { PublicReviewReadingLayout } from "@/components/public-review/PublicReviewReadingLayout";

describe("PublicReviewReadingLayout", () => {
  const originalMatchMedia = window.matchMedia;
  const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;

  afterEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, "", window.location.pathname);
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: originalMatchMedia,
    });
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: originalScrollIntoView,
    });
  });

  it("reveals the feedback hash target without smooth motion when requested", async () => {
    const scrollIntoView = jest.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoView,
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: jest.fn((query: string) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
    window.localStorage.setItem("public-review-comment-panel-open", "true");
    window.history.replaceState({}, "", "#public-review-feedback");

    render(
      <PublicReviewReadingLayout
        content={<div>Review content</div>}
        feedbackAvailable
        panel={<div>Feedback panel</div>}
        toolbar={<div>Page 1</div>}
      />
    );

    await waitFor(() =>
      expect(scrollIntoView).toHaveBeenCalledWith({
        behavior: "auto",
        block: "start",
      })
    );
    expect(
      screen.getByRole("complementary", { name: "Page comments" })
    ).toHaveClass(
      "focus:tw-ring-2",
      "focus:tw-ring-inset",
      "focus:tw-ring-primary-400"
    );
  });
});
