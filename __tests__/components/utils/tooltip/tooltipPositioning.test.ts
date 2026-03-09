import { calculateTooltipLayout } from "@/components/utils/tooltip/tooltipPositioning";

type RectOptions = {
  left: number;
  top: number;
  width: number;
  height: number;
};

function createRect({ left, top, width, height }: RectOptions): DOMRect {
  return {
    x: left,
    y: top,
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    toJSON: () => ({}),
  } as DOMRect;
}

describe("calculateTooltipLayout", () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1280,
      writable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 900,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: originalInnerWidth,
      writable: true,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: originalInnerHeight,
      writable: true,
    });
  });

  it("centers top placement when the tooltip is wider than the trigger", () => {
    const childRect = createRect({
      left: 200,
      top: 300,
      width: 40,
      height: 24,
    });
    const tooltipRect = createRect({
      left: 0,
      top: 0,
      width: 120,
      height: 48,
    });

    const layout = calculateTooltipLayout({
      childRect,
      tooltipRect,
      placement: "top",
      offset: 8,
    });

    expect(layout.position).toEqual({
      x: 160,
      y: 244,
    });
    expect(layout.arrowPosition).toEqual({
      x: 60,
      y: 0,
    });
    expect(layout.placement).toBe("top");
  });

  it("centers bottom placement when the tooltip is wider than the trigger", () => {
    const childRect = createRect({
      left: 420,
      top: 160,
      width: 36,
      height: 20,
    });
    const tooltipRect = createRect({
      left: 0,
      top: 0,
      width: 132,
      height: 56,
    });

    const layout = calculateTooltipLayout({
      childRect,
      tooltipRect,
      placement: "bottom",
      offset: 12,
    });

    expect(layout.position).toEqual({
      x: 372,
      y: 192,
    });
    expect(layout.arrowPosition).toEqual({
      x: 66,
      y: 0,
    });
    expect(layout.placement).toBe("bottom");
  });

  it("keeps left placement behavior unchanged", () => {
    const childRect = createRect({
      left: 300,
      top: 200,
      width: 40,
      height: 30,
    });
    const tooltipRect = createRect({
      left: 0,
      top: 0,
      width: 100,
      height: 60,
    });

    const layout = calculateTooltipLayout({
      childRect,
      tooltipRect,
      placement: "left",
      offset: 8,
    });

    expect(layout.position).toEqual({
      x: 192,
      y: 185,
    });
    expect(layout.arrowPosition).toEqual({
      x: 0,
      y: 30,
    });
    expect(layout.placement).toBe("left");
  });

  it("clamps tall left placements within the viewport vertically", () => {
    const childRect = createRect({
      left: 300,
      top: 100,
      width: 40,
      height: 20,
    });
    const tooltipRect = createRect({
      left: 0,
      top: 0,
      width: 100,
      height: 920,
    });

    const layout = calculateTooltipLayout({
      childRect,
      tooltipRect,
      placement: "left",
      offset: 8,
    });

    expect(layout.position).toEqual({
      x: 192,
      y: 8,
    });
    expect(layout.arrowPosition).toEqual({
      x: 0,
      y: 102,
    });
    expect(layout.placement).toBe("left");
  });

  it("clamps y after flipping bottom placements to the top", () => {
    const childRect = createRect({
      left: 420,
      top: 400,
      width: 36,
      height: 20,
    });
    const tooltipRect = createRect({
      left: 0,
      top: 0,
      width: 120,
      height: 700,
    });

    const layout = calculateTooltipLayout({
      childRect,
      tooltipRect,
      placement: "bottom",
      offset: 12,
    });

    expect(layout.position).toEqual({
      x: 378,
      y: 8,
    });
    expect(layout.arrowPosition).toEqual({
      x: 60,
      y: 0,
    });
    expect(layout.placement).toBe("top");
  });
});
