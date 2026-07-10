import { fireEvent, render, screen } from "@testing-library/react";
import { useWaveListSwipeBack } from "@/components/brain/mobile/useWaveListSwipeBack";

const touch = (clientX: number, clientY: number) => ({ clientX, clientY });

function SwipeHarness({
  enabled = true,
  onIntentStart,
  onSwipeBack,
}: {
  readonly enabled?: boolean | undefined;
  readonly onIntentStart: () => void;
  readonly onSwipeBack: () => void;
}) {
  const handlers = useWaveListSwipeBack({
    enabled,
    onIntentStart,
    onSwipeBack,
  });

  return (
    <div data-testid="surface" {...handlers}>
      <div data-testid="plain-target" />
      <input
        data-testid="slider-target"
        type="range"
        min={0}
        max={100}
        defaultValue={50}
      />
      <div data-testid="horizontal-scroller" style={{ overflowX: "auto" }}>
        <div data-testid="horizontal-child" />
      </div>
    </div>
  );
}

describe("useWaveListSwipeBack", () => {
  const onIntentStart = jest.fn();
  const onSwipeBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderHarness = (enabled = true) =>
    render(
      <SwipeHarness
        enabled={enabled}
        onIntentStart={onIntentStart}
        onSwipeBack={onSwipeBack}
      />
    );

  it("commits a horizontally dominant right swipe from the left edge", () => {
    renderHarness();
    const target = screen.getByTestId("plain-target");

    fireEvent.touchStart(target, { touches: [touch(10, 100)] });
    fireEvent.touchMove(target, { touches: [touch(55, 104)] });
    fireEvent.touchEnd(target, { changedTouches: [touch(100, 106)] });

    expect(onIntentStart).toHaveBeenCalledTimes(1);
    expect(onSwipeBack).toHaveBeenCalledTimes(1);
  });

  it("ignores gestures that start outside the edge or are disabled", () => {
    const { rerender } = renderHarness();
    const target = screen.getByTestId("plain-target");

    fireEvent.touchStart(target, { touches: [touch(40, 100)] });
    fireEvent.touchEnd(target, { changedTouches: [touch(140, 100)] });

    rerender(
      <SwipeHarness
        enabled={false}
        onIntentStart={onIntentStart}
        onSwipeBack={onSwipeBack}
      />
    );
    const disabledTarget = screen.getByTestId("plain-target");
    fireEvent.touchStart(disabledTarget, { touches: [touch(10, 100)] });
    fireEvent.touchEnd(disabledTarget, {
      changedTouches: [touch(110, 100)],
    });

    expect(onIntentStart).not.toHaveBeenCalled();
    expect(onSwipeBack).not.toHaveBeenCalled();
  });

  it("cancels when vertical movement wins the gesture", () => {
    renderHarness();
    const target = screen.getByTestId("plain-target");

    fireEvent.touchStart(target, { touches: [touch(10, 100)] });
    fireEvent.touchMove(target, { touches: [touch(18, 125)] });
    fireEvent.touchEnd(target, { changedTouches: [touch(120, 130)] });

    expect(onIntentStart).toHaveBeenCalledTimes(1);
    expect(onSwipeBack).not.toHaveBeenCalled();
  });

  it("does not commit a short, leftward, or cancelled gesture", () => {
    renderHarness();
    const target = screen.getByTestId("plain-target");

    fireEvent.touchStart(target, { touches: [touch(10, 100)] });
    fireEvent.touchEnd(target, { changedTouches: [touch(70, 100)] });

    fireEvent.touchStart(target, { touches: [touch(10, 100)] });
    fireEvent.touchMove(target, { touches: [touch(-5, 100)] });
    fireEvent.touchEnd(target, { changedTouches: [touch(110, 100)] });

    fireEvent.touchStart(target, { touches: [touch(10, 100)] });
    fireEvent.touchCancel(target);
    fireEvent.touchEnd(target, { changedTouches: [touch(110, 100)] });

    expect(onSwipeBack).not.toHaveBeenCalled();
  });

  it("ignores multi-touch and interactive horizontal targets", () => {
    renderHarness();
    const surface = screen.getByTestId("surface");
    const plainTarget = screen.getByTestId("plain-target");
    const sliderTarget = screen.getByTestId("slider-target");
    const horizontalScroller = screen.getByTestId("horizontal-scroller");
    const horizontalChild = screen.getByTestId("horizontal-child");
    Object.defineProperties(horizontalScroller, {
      clientWidth: { configurable: true, value: 100 },
      scrollWidth: { configurable: true, value: 200 },
    });

    fireEvent.touchStart(plainTarget, {
      touches: [touch(10, 100), touch(12, 102)],
    });
    fireEvent.touchEnd(surface, { changedTouches: [touch(110, 100)] });

    for (const target of [sliderTarget, horizontalChild]) {
      fireEvent.touchStart(target, { touches: [touch(10, 100)] });
      fireEvent.touchEnd(target, { changedTouches: [touch(110, 100)] });
    }

    expect(onIntentStart).not.toHaveBeenCalled();
    expect(onSwipeBack).not.toHaveBeenCalled();
  });
});
