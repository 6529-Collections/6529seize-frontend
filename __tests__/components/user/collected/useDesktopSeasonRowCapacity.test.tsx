import { useDesktopSeasonRowCapacity } from "@/components/user/collected/stats/useDesktopSeasonRowCapacity";
import { render, screen, waitFor } from "@testing-library/react";

const originalGetBoundingClientRect = HTMLElement.prototype.getBoundingClientRect;
const originalGetComputedStyle = globalThis.getComputedStyle;
const originalInnerWidth = globalThis.innerWidth;

function SeasonRowCapacityHarness({
  seasonCount,
}: {
  readonly seasonCount: number;
}) {
  const { containerRef, visibleSeasonCount, isDesktopLayout } =
    useDesktopSeasonRowCapacity(seasonCount);
  const renderedSeasonCount = isDesktopLayout
    ? (visibleSeasonCount ?? seasonCount)
    : seasonCount;

  return (
    <div ref={containerRef} data-testid="container" data-width="1166">
      <div
        data-testid={isDesktopLayout ? "desktop-row" : "mobile-row"}
        data-gap={isDesktopLayout ? "4px" : "12px"}
      >
        {Array.from(
          { length: renderedSeasonCount },
          (_, index) => index + 1
        ).map((seasonNumber) => (
          <div
            key={seasonNumber}
            data-season-tile
            data-testid={`season-tile-${seasonNumber}`}
            data-width="88"
          />
        ))}
      </div>
      <div data-testid="visible-season-count">
        {String(visibleSeasonCount)}
      </div>
    </div>
  );
}

describe("useDesktopSeasonRowCapacity", () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, "innerWidth", {
      configurable: true,
      writable: true,
      value: 1024,
    });

    HTMLElement.prototype.getBoundingClientRect = function () {
      const width = Number.parseFloat(this.dataset.width ?? "0");

      return {
        width,
        height: 0,
        top: 0,
        left: 0,
        right: width,
        bottom: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      } as DOMRect;
    };

    globalThis.getComputedStyle = ((element: Element) => {
      const gap = (element as HTMLElement).dataset.gap ?? "0px";

      return {
        columnGap: gap,
        gap,
        getPropertyValue: (property: string) =>
          property.includes("gap") ? gap : "",
      } as CSSStyleDeclaration;
    }) as typeof globalThis.getComputedStyle;
  });

  afterEach(() => {
    HTMLElement.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    globalThis.getComputedStyle = originalGetComputedStyle;
    Object.defineProperty(globalThis, "innerWidth", {
      configurable: true,
      writable: true,
      value: originalInnerWidth,
    });
  });

  it("remeasures after switching into the desktop layout", async () => {
    render(<SeasonRowCapacityHarness seasonCount={14} />);

    await waitFor(() =>
      expect(screen.getByTestId("visible-season-count")).toHaveTextContent("12")
    );
    expect(screen.getByTestId("desktop-row")).toBeInTheDocument();
  });
});
