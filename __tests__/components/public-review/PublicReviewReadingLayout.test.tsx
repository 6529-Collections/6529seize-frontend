import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PublicReviewMobileNavigationDisclosure } from "@/components/public-review/PublicReviewMobileNavigationDisclosure";
import {
  PublicReviewReadingLayout,
  usePublicReviewFeedbackPanelCoordination,
} from "@/components/public-review/PublicReviewReadingLayout";

/** Renders a test link that opens the coordinated feedback panel. */
function FeedbackLink() {
  const feedbackPanel = usePublicReviewFeedbackPanelCoordination();

  return (
    <a href="#public-review-feedback" onClick={() => feedbackPanel.open()}>
      Share feedback
    </a>
  );
}

describe("PublicReviewReadingLayout", () => {
  const originalMatchMedia = window.matchMedia;
  const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;

  afterEach(() => {
    jest.restoreAllMocks();
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
    jest.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      bottom: 800,
      height: 800,
      left: 0,
      right: 760,
      top: 0,
      width: 760,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
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
      "focus:tw-ring-primary-400",
      "@[760px]:tw-top-[calc(4rem+env(safe-area-inset-top,0px))]",
      "@[760px]:tw-h-[calc(100dvh-4rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))]"
    );
    expect(
      screen.getByText("Page 1").closest("section")?.firstElementChild
    ).toHaveClass("tw-top-[env(safe-area-inset-top,0px)]");
  });

  it("reveals the feedback hash target as an overlay on narrow layouts", async () => {
    window.history.replaceState({}, "", "#public-review-feedback");

    render(
      <PublicReviewReadingLayout
        content={<div>Review content</div>}
        feedbackAvailable
        panel={<div>Feedback panel</div>}
        toolbar={<div>Page 1</div>}
      />
    );

    const dialog = await screen.findByRole("dialog", {
      name: "Page comments",
    });
    expect(dialog).toBeInTheDocument();
    expect(
      document.querySelector('[class~="tw-bg-iron-600/60"]')
    ).toBeInTheDocument();
    expect(document.getElementById("public-review-feedback")).toHaveClass(
      "tw-box-border",
      "tw-pt-[env(safe-area-inset-top,0px)]",
      "tw-pr-[env(safe-area-inset-right,0px)]",
      "tw-pb-[env(safe-area-inset-bottom,0px)]"
    );
    await waitFor(() =>
      expect(document.getElementById("public-review-feedback")).toHaveFocus()
    );
  });

  it("keeps the controlled panel mounted and restores focus after Escape", async () => {
    const user = userEvent.setup();
    render(
      <PublicReviewReadingLayout
        content={<div>Review content</div>}
        feedbackAvailable
        panel={<div>Feedback panel</div>}
        toolbar={<div>Page 1</div>}
      />
    );

    const toggle = screen.getByRole("button", { name: "Show feedback" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById("public-review-feedback")).toHaveAttribute(
      "hidden"
    );

    await user.click(toggle);
    await screen.findByRole("dialog", { name: "Page comments" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Page comments" })
      ).not.toBeInTheDocument()
    );
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveFocus();
    expect(document.getElementById("public-review-feedback")).toHaveAttribute(
      "hidden"
    );
  });

  it("reopens feedback when the feedback hash is already current", async () => {
    const user = userEvent.setup();
    render(
      <PublicReviewReadingLayout
        content={<FeedbackLink />}
        feedbackAvailable
        panel={<div>Feedback panel</div>}
        toolbar={<div>Page 1</div>}
      />
    );

    const feedbackLink = screen.getByRole("link", { name: "Share feedback" });
    await user.click(feedbackLink);
    await screen.findByRole("dialog", { name: "Page comments" });
    expect(window.location.hash).toBe("#public-review-feedback");

    await user.keyboard("{Escape}");
    await waitFor(() =>
      expect(
        screen.queryByRole("dialog", { name: "Page comments" })
      ).not.toBeInTheDocument()
    );

    await user.click(feedbackLink);
    expect(
      await screen.findByRole("dialog", { name: "Page comments" })
    ).toBeInTheDocument();
  });

  it("starts observing the layout when feedback becomes available", async () => {
    const user = userEvent.setup();
    jest.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      bottom: 800,
      height: 800,
      left: 0,
      right: 760,
      top: 0,
      width: 760,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    const layout = (feedbackAvailable: boolean) => (
      <PublicReviewReadingLayout
        content={<div>Review content</div>}
        feedbackAvailable={feedbackAvailable}
        panel={<div>Feedback panel</div>}
        toolbar={<div>Page 1</div>}
      />
    );
    const { rerender } = render(layout(false));
    expect(
      screen.queryByRole("button", { name: "Show feedback" })
    ).not.toBeInTheDocument();

    rerender(layout(true));
    const toggle = screen.getByRole("button", { name: "Show feedback" });
    await user.click(toggle);

    expect(
      screen.getByRole("complementary", { name: "Page comments" })
    ).not.toHaveAttribute("hidden");
    expect(
      screen.queryByRole("dialog", { name: "Page comments" })
    ).not.toBeInTheDocument();
  });

  it("keeps mobile review navigation available without feedback", () => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: jest.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(
      <PublicReviewReadingLayout
        content={<div>Review content</div>}
        feedbackAvailable={false}
        mobileNavigation={
          <PublicReviewMobileNavigationDisclosure resetKey="overview">
            <summary>Review navigation</summary>
            <div>Navigation links</div>
          </PublicReviewMobileNavigationDisclosure>
        }
        panel={<div>Feedback panel</div>}
        toolbar={<div>Page 1</div>}
      />
    );

    expect(screen.getByText("Review navigation")).toBeInTheDocument();
    expect(screen.getByText("Page 1")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Show feedback" })
    ).not.toBeInTheDocument();
  });

  it("does not restore a previous browser-storage panel preference", () => {
    window.localStorage.setItem("public-review-comment-panel-open", "true");

    render(
      <PublicReviewReadingLayout
        content={<div>Review content</div>}
        feedbackAvailable
        panel={<div>Feedback panel</div>}
        toolbar={<div>Page 1</div>}
      />
    );

    expect(
      screen.getByRole("button", { name: "Show feedback" })
    ).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById("public-review-feedback")).toHaveAttribute(
      "hidden"
    );
  });

  it("keeps feedback and mobile navigation mutually exclusive", async () => {
    const user = userEvent.setup();
    jest.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
      bottom: 800,
      height: 800,
      left: 0,
      right: 900,
      top: 0,
      width: 900,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: jest.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        addListener: jest.fn(),
        removeListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    render(
      <PublicReviewReadingLayout
        content={<div>Review content</div>}
        feedbackAvailable
        mobileNavigation={
          <PublicReviewMobileNavigationDisclosure resetKey="overview">
            <summary>Review navigation</summary>
            <div>Navigation links</div>
          </PublicReviewMobileNavigationDisclosure>
        }
        panel={<div>Feedback panel</div>}
        toolbar={<div>Page 1</div>}
      />
    );

    const navigationToggle = screen.getByText("Review navigation");
    const disclosure = navigationToggle.closest("details");
    expect(disclosure).not.toBeNull();
    if (!disclosure) {
      return;
    }

    await user.click(navigationToggle);
    expect(disclosure.open).toBe(true);

    await user.click(screen.getByRole("button", { name: "Show feedback" }));
    expect(disclosure.open).toBe(false);
    expect(
      screen.getByRole("complementary", { name: "Page comments" })
    ).not.toHaveAttribute("hidden");

    await user.click(navigationToggle);
    expect(disclosure.open).toBe(true);
    expect(
      screen.getByRole("button", { name: "Show feedback" })
    ).toHaveAttribute("aria-expanded", "false");
  });
});
