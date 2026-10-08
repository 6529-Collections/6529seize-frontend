import { WaveDropContentExpansionProvider } from "@/components/waves/drops/WaveDropContentExpansionContext";
import WaveDropLongContent from "@/components/waves/drops/WaveDropLongContent";
import { fireEvent, render, screen } from "@testing-library/react";
import type { RefObject } from "react";

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
        <div data-testid="full-markdown">Full markdown tree</div>
      </WaveDropLongContent>
    </WaveDropContentExpansionProvider>
  );
  return { scrollContainer };
}

describe("WaveDropLongContent", () => {
  it("does not mount the full markdown tree until the user expands", () => {
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
    renderLongContent({ enabled: false });

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

  it("anchors collapse from the pre-toggle position if the browser clamps scroll", () => {
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

    expect(scrollContainer.scrollTop).toBe(-500);
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
});
