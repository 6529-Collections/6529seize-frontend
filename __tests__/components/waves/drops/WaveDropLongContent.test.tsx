import { WaveDropContentExpansionProvider } from "@/components/waves/drops/WaveDropContentExpansionContext";
import WaveDropLongContent from "@/components/waves/drops/WaveDropLongContent";
import { fireEvent, render, screen } from "@testing-library/react";
import type { RefObject } from "react";
import * as dropContentPreview from "@/helpers/waves/dropContentPreview";

const LONG_CONTENT = "Long post content ".repeat(80);

function renderLongContent({
  enabled = true,
  scrollContainer = document.createElement("div"),
}: {
  readonly enabled?: boolean;
  readonly scrollContainer?: HTMLDivElement;
} = {}) {
  const scrollContainerRef: RefObject<HTMLDivElement | null> = {
    current: scrollContainer,
  };
  render(
    <WaveDropContentExpansionProvider
      enabled={enabled}
      scrollContainerRef={scrollContainerRef}
    >
      <WaveDropLongContent content={LONG_CONTENT} expansionKey="drop:0">
        {(collapsed) =>
          collapsed ? (
            <p>Formatted preview</p>
          ) : (
            <div data-testid="full-markdown">Full markdown tree</div>
          )
        }
      </WaveDropLongContent>
    </WaveDropContentExpansionProvider>
  );
  return { scrollContainer };
}

const getPreviewBody = () =>
  screen.getByText("Formatted preview").parentElement as HTMLDivElement;

describe("WaveDropLongContent", () => {
  it("requests a formatted preview until the user expands", () => {
    renderLongContent();

    const showMore = screen.getByRole("button", { name: "Show more" });
    expect(showMore).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("full-markdown")).not.toBeInTheDocument();

    fireEvent.click(showMore);

    const showLess = screen.getByRole("button", { name: "Show less" });
    expect(showLess).toHaveAttribute("aria-expanded", "true");
    expect(showLess).toHaveAttribute("aria-controls");
    expect(screen.getByTestId("full-markdown")).toBeInTheDocument();

    fireEvent.click(showLess);

    expect(screen.getByRole("button", { name: "Show more" })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    expect(screen.queryByTestId("full-markdown")).not.toBeInTheDocument();
  });

  it("renders full content without a toggle when collapse is disabled", () => {
    const previewSpy = jest.spyOn(dropContentPreview, "getDropContentPreview");
    renderLongContent({ enabled: false });

    expect(previewSpy).not.toHaveBeenCalled();
    previewSpy.mockRestore();
    expect(screen.getByTestId("full-markdown")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("keeps the preview body anchored while expanding older history", () => {
    const scrollContainer = document.createElement("div");
    Object.defineProperties(scrollContainer, {
      clientHeight: { configurable: true, value: 500 },
      scrollHeight: { configurable: true, value: 2_000 },
      scrollTop: { configurable: true, value: -500, writable: true },
    });
    renderLongContent({ scrollContainer });
    jest
      .spyOn(getPreviewBody(), "getBoundingClientRect")
      .mockReturnValueOnce({ top: 200 } as DOMRect)
      .mockReturnValue({ top: 50 } as DOMRect);

    fireEvent.click(screen.getByRole("button", { name: "Show more" }));

    expect(scrollContainer.scrollTop).toBe(-650);
  });

  it("accounts for the browser adjusting scroll during expansion", () => {
    const scrollContainer = document.createElement("div");
    Object.defineProperties(scrollContainer, {
      clientHeight: { configurable: true, value: 500 },
      scrollHeight: { configurable: true, value: 2_000 },
      scrollTop: { configurable: true, value: -500, writable: true },
    });
    renderLongContent({ scrollContainer });
    jest
      .spyOn(getPreviewBody(), "getBoundingClientRect")
      .mockReturnValueOnce({ top: 200 } as DOMRect)
      .mockImplementation(() => {
        scrollContainer.scrollTop = -550;
        return { top: 100 } as DOMRect;
      });

    fireEvent.click(screen.getByRole("button", { name: "Show more" }));

    expect(scrollContainer.scrollTop).toBe(-650);
  });

  it("corrects from the current position when the browser clamps scroll on collapse", () => {
    const scrollContainer = document.createElement("div");
    Object.defineProperties(scrollContainer, {
      clientHeight: { configurable: true, value: 500 },
      scrollHeight: { configurable: true, value: 2_000 },
      scrollTop: { configurable: true, value: -500, writable: true },
    });
    renderLongContent({ scrollContainer });
    fireEvent.click(screen.getByRole("button", { name: "Show more" }));

    const showLess = screen.getByRole("button", { name: "Show less" });
    jest
      .spyOn(showLess, "getBoundingClientRect")
      .mockReturnValueOnce({ top: 350 } as DOMRect)
      .mockImplementation(() => {
        scrollContainer.scrollTop = -100;
        return { top: 200 } as DOMRect;
      });
    fireEvent.click(showLess);

    expect(scrollContainer.scrollTop).toBe(-250);
  });

  it("keeps the preview body anchored when expanding near the latest drop", () => {
    const scrollContainer = document.createElement("div");
    Object.defineProperties(scrollContainer, {
      clientHeight: { configurable: true, value: 500 },
      scrollHeight: { configurable: true, value: 2_000 },
      scrollTop: { configurable: true, value: -20, writable: true },
    });
    renderLongContent({ scrollContainer });
    jest
      .spyOn(getPreviewBody(), "getBoundingClientRect")
      .mockReturnValueOnce({ top: 200 } as DOMRect)
      .mockReturnValue({ top: 50 } as DOMRect);

    fireEvent.click(screen.getByRole("button", { name: "Show more" }));

    expect(scrollContainer.scrollTop).toBe(-170);
  });

  it("preserves the blank space above a short chat while opening a long message", () => {
    const scrollContainer = document.createElement("div");
    const topSentinel = document.createElement("div");
    scrollContainer.append(document.createElement("div"), topSentinel);
    jest
      .spyOn(topSentinel, "getBoundingClientRect")
      .mockReturnValue({ top: 100 } as DOMRect);
    Object.defineProperties(scrollContainer, {
      clientHeight: { configurable: true, value: 500 },
      scrollHeight: {
        configurable: true,
        get: () => {
          const padding =
            Number.parseFloat(scrollContainer.style.paddingTop) || 0;
          const historyHeight = screen.queryByRole("button", {
            name: "Show less",
          })
            ? 550
            : 400;
          return Math.max(500, historyHeight + padding);
        },
      },
    });
    renderLongContent({ scrollContainer });
    jest
      .spyOn(getPreviewBody(), "getBoundingClientRect")
      .mockReturnValueOnce({ top: 200 } as DOMRect)
      .mockReturnValue({ top: 50 } as DOMRect);

    fireEvent.click(screen.getByRole("button", { name: "Show more" }));

    expect(scrollContainer.style.paddingTop).toBe("100px");
    expect(scrollContainer.scrollTop).toBe(-150);

    scrollContainer.scrollTop = 0;
    fireEvent.scroll(scrollContainer);
    expect(scrollContainer.style.paddingTop).toBe("");
  });

  it("returns to the latest drop when the message is collapsed at the bottom", () => {
    const scrollContainer = document.createElement("div");
    renderLongContent({ scrollContainer });
    fireEvent.click(screen.getByRole("button", { name: "Show more" }));

    scrollContainer.scrollTop = -20;
    fireEvent.click(screen.getByRole("button", { name: "Show less" }));

    expect(scrollContainer.scrollTop).toBe(0);
  });

  it("keeps keyboard focus in view when the expanded toggle moves offscreen", () => {
    const { scrollContainer } = renderLongContent();
    jest
      .spyOn(scrollContainer, "getBoundingClientRect")
      .mockReturnValue({ top: 0, bottom: 500 } as DOMRect);
    const button = screen.getByRole("button", { name: "Show more" });
    const content = getPreviewBody();
    const focus = jest.spyOn(content, "focus");
    jest
      .spyOn(button, "getBoundingClientRect")
      .mockReturnValue({ top: 600, bottom: 644 } as DOMRect);
    button.focus();

    fireEvent.click(button);

    expect(content).toHaveFocus();
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("anchors delayed content resizing and releases the anchor when the reader scrolls", () => {
    const originalObserver = globalThis.ResizeObserver;
    let notifyResize = () => {};
    const disconnect = jest.fn();
    globalThis.ResizeObserver = class implements ResizeObserver {
      constructor(callback: ResizeObserverCallback) {
        notifyResize = () => callback([], this);
      }
      observe = jest.fn();
      unobserve = jest.fn();
      disconnect = disconnect;
    };
    try {
      const scrollContainer = document.createElement("div");
      Object.defineProperties(scrollContainer, {
        clientHeight: { configurable: true, value: 500 },
        scrollHeight: { configurable: true, value: 2_000 },
        scrollTop: { configurable: true, value: -500, writable: true },
      });
      renderLongContent({ scrollContainer });
      jest
        .spyOn(getPreviewBody(), "getBoundingClientRect")
        .mockReturnValueOnce({ top: 200 } as DOMRect)
        .mockReturnValueOnce({ top: 50 } as DOMRect)
        .mockReturnValue({ top: 140 } as DOMRect);
      fireEvent.click(screen.getByRole("button", { name: "Show more" }));
      expect(scrollContainer.scrollTop).toBe(-650);
      notifyResize();
      expect(scrollContainer.scrollTop).toBe(-710);
      expect(disconnect).not.toHaveBeenCalled();
      fireEvent.wheel(scrollContainer);
      expect(disconnect).toHaveBeenCalled();
    } finally {
      globalThis.ResizeObserver = originalObserver;
    }
  });
});
