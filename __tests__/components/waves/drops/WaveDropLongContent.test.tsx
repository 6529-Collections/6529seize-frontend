import { WaveDropContentExpansionProvider } from "@/components/waves/drops/WaveDropContentExpansionContext";
import WaveDropLongContent from "@/components/waves/drops/WaveDropLongContent";
import { fireEvent, render, screen } from "@testing-library/react";
import type { RefObject } from "react";
import * as dropContentPreview from "@/helpers/waves/dropContentPreview";
import {
  WAVE_DROPS_END_ANCHORED_SCROLL_CONTAINER,
  WAVE_DROPS_SCROLL_CONTAINER_ATTRIBUTE,
} from "@/helpers/waves/wave-visible-serial.helpers";

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

  it("keeps the toggle anchored while expanding older history", () => {
    const scrollContainer = document.createElement("div");
    Object.defineProperties(scrollContainer, {
      clientHeight: { configurable: true, value: 500 },
      scrollHeight: { configurable: true, value: 2_000 },
      scrollTop: { configurable: true, value: -500, writable: true },
    });
    renderLongContent({ scrollContainer });
    const button = screen.getByRole("button", { name: "Show more" });
    jest
      .spyOn(button, "getBoundingClientRect")
      .mockReturnValueOnce({ top: 200 } as DOMRect)
      .mockReturnValue({ top: 350 } as DOMRect);

    fireEvent.click(button);

    expect(scrollContainer.scrollTop).toBe(-350);
  });

  it("accounts for the browser adjusting scroll during expansion", () => {
    const scrollContainer = document.createElement("div");
    Object.defineProperties(scrollContainer, {
      clientHeight: { configurable: true, value: 500 },
      scrollHeight: { configurable: true, value: 2_000 },
      scrollTop: { configurable: true, value: -500, writable: true },
    });
    renderLongContent({ scrollContainer });
    const button = screen.getByRole("button", { name: "Show more" });
    jest
      .spyOn(button, "getBoundingClientRect")
      .mockReturnValueOnce({ top: 200 } as DOMRect)
      .mockImplementation(() => {
        scrollContainer.scrollTop = -650;
        return { top: 350 } as DOMRect;
      });

    fireEvent.click(button);

    expect(scrollContainer.scrollTop).toBe(-500);
  });

  it("corrects from the current position when the browser clamps scroll on collapse", () => {
    const scrollContainer = document.createElement("div");
    Object.defineProperties(scrollContainer, {
      clientHeight: { configurable: true, value: 500 },
      scrollHeight: { configurable: true, value: 2_000 },
      scrollTop: { configurable: true, value: -500, writable: true },
    });
    renderLongContent({ scrollContainer });
    const button = screen.getByRole("button", { name: "Show more" });
    let rectReadCount = 0;
    jest.spyOn(button, "getBoundingClientRect").mockImplementation(() => {
      rectReadCount += 1;
      if (rectReadCount === 1) return { top: 200 } as DOMRect;
      if (rectReadCount === 2) return { top: 350 } as DOMRect;
      if (rectReadCount === 3) return { top: 350 } as DOMRect;

      scrollContainer.scrollTop = -100;
      return { top: 200 } as DOMRect;
    });

    fireEvent.click(button);
    expect(scrollContainer.scrollTop).toBe(-350);

    fireEvent.click(screen.getByRole("button", { name: "Show less" }));

    expect(scrollContainer.scrollTop).toBe(-250);
  });

  it("stays pinned to the latest drop when expanded at the bottom", () => {
    const scrollContainer = document.createElement("div");
    Object.defineProperties(scrollContainer, {
      clientHeight: { configurable: true, value: 500 },
      scrollHeight: { configurable: true, value: 2_000 },
      scrollTop: { configurable: true, value: -20, writable: true },
    });
    renderLongContent({ scrollContainer });
    const button = screen.getByRole("button", { name: "Show more" });
    jest
      .spyOn(button, "getBoundingClientRect")
      .mockReturnValue({ top: 200 } as DOMRect);

    fireEvent.click(button);

    expect(scrollContainer.scrollTop).toBe(0);
  });
  describe("in the windowed chat (normal order)", () => {
    const endAnchoredContainer = (scrollTop: number) => {
      const scrollContainer = document.createElement("div");
      scrollContainer.setAttribute(
        WAVE_DROPS_SCROLL_CONTAINER_ATTRIBUTE,
        WAVE_DROPS_END_ANCHORED_SCROLL_CONTAINER
      );
      Object.defineProperties(scrollContainer, {
        clientHeight: { configurable: true, value: 500 },
        scrollHeight: { configurable: true, value: 2_000 },
        scrollTop: { configurable: true, value: scrollTop, writable: true },
      });
      return scrollContainer;
    };

    it("keeps the toggle anchored while expanding older history", () => {
      const scrollContainer = endAnchoredContainer(1_000);
      renderLongContent({ scrollContainer });
      const button = screen.getByRole("button", { name: "Show more" });
      jest
        .spyOn(button, "getBoundingClientRect")
        .mockReturnValueOnce({ top: 200 } as DOMRect)
        .mockReturnValue({ top: 350 } as DOMRect);

      fireEvent.click(button);

      expect(scrollContainer.scrollTop).toBe(1_150);
    });

    it("stays at the newest message when expanded there", () => {
      // The newest message is at the largest scrollTop: 2,000 - 500.
      const scrollContainer = endAnchoredContainer(1_480);
      renderLongContent({ scrollContainer });
      const button = screen.getByRole("button", { name: "Show more" });
      jest
        .spyOn(button, "getBoundingClientRect")
        .mockReturnValue({ top: 200 } as DOMRect);

      fireEvent.click(button);

      expect(scrollContainer.scrollTop).toBe(1_500);
    });

    it("never scrolls past either end", () => {
      const scrollContainer = endAnchoredContainer(100);
      renderLongContent({ scrollContainer });
      const button = screen.getByRole("button", { name: "Show more" });
      jest
        .spyOn(button, "getBoundingClientRect")
        .mockReturnValueOnce({ top: 400 } as DOMRect)
        .mockReturnValue({ top: 100 } as DOMRect);

      fireEvent.click(button);

      expect(scrollContainer.scrollTop).toBe(0);
    });
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
      const button = screen.getByRole("button", { name: "Show more" });
      jest
        .spyOn(button, "getBoundingClientRect")
        .mockReturnValueOnce({ top: 200 } as DOMRect)
        .mockReturnValueOnce({ top: 350 } as DOMRect)
        .mockReturnValue({ top: 260 } as DOMRect);
      fireEvent.click(button);
      expect(scrollContainer.scrollTop).toBe(-350);
      notifyResize();
      expect(scrollContainer.scrollTop).toBe(-290);
      expect(disconnect).not.toHaveBeenCalled();
      fireEvent.wheel(scrollContainer);
      expect(disconnect).toHaveBeenCalled();
    } finally {
      globalThis.ResizeObserver = originalObserver;
    }
  });
});
