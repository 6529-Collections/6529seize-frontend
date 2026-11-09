import { act, fireEvent, render, screen } from "@testing-library/react";
import { useWaveListSwipeBack } from "@/components/brain/mobile/useWaveListSwipeBack";

const touch = (clientX: number, clientY = 100) => ({
  clientX,
  clientY,
  identifier: 1,
});

function SwipeHarness({
  enabled = true,
  scope = "wave",
  onIntentStart,
  onSwipeBack,
}: {
  readonly enabled?: boolean;
  readonly scope?: string;
  readonly onIntentStart: () => void;
  readonly onSwipeBack: () => void;
}) {
  const { ref, onTouchStart } = useWaveListSwipeBack({
    enabled,
    scope,
    onIntentStart,
    onSwipeBack,
  });
  return (
    <div ref={ref} onTouchStart={onTouchStart} data-testid="surface">
      <span data-testid="content">Wave</span>
      <input aria-label="Vote" type="range" />
    </div>
  );
}

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

function setup(enabled = true) {
  const onIntentStart = jest.fn();
  const onSwipeBack = jest.fn();
  const result = render(
    <SwipeHarness {...{ enabled, onIntentStart, onSwipeBack }} />
  );
  return {
    ...result,
    onIntentStart,
    onSwipeBack,
    surface: screen.getByTestId("surface"),
    content: screen.getByTestId("content"),
  };
}

it("tracks an interior drag, then commits on release", () => {
  const { surface, content, onIntentStart, onSwipeBack } = setup();
  fireEvent.touchStart(content, { touches: [touch(160)] });
  fireEvent.touchMove(content, { touches: [touch(280)] });
  act(() => {
    jest.advanceTimersByTime(20);
  });
  expect(surface.style.transform).toBe("translate3d(120px, 0, 0)");
  expect(onIntentStart).toHaveBeenCalledTimes(1);
  expect(onSwipeBack).not.toHaveBeenCalled();
  fireEvent.touchEnd(content, { touches: [], changedTouches: [touch(280)] });
  expect(onSwipeBack).toHaveBeenCalledTimes(1);
  expect(surface.style.transform).toBe("");
});

it("returns to rest after reversal or native cancellation", () => {
  const { surface, content, onSwipeBack } = setup();
  fireEvent.touchStart(content, { touches: [touch(160)] });
  fireEvent.touchMove(content, { touches: [touch(300)] });
  act(() => {
    jest.advanceTimersByTime(20);
  });
  fireEvent.touchMove(content, { touches: [touch(180)] });
  fireEvent.touchEnd(content, { touches: [], changedTouches: [touch(180)] });
  expect(onSwipeBack).not.toHaveBeenCalled();
  expect(surface.style.transform).toBe("");
  fireEvent.touchStart(content, { touches: [touch(160)] });
  fireEvent.touchMove(content, { touches: [touch(300)] });
  fireEvent.touchCancel(content);
  expect(onSwipeBack).not.toHaveBeenCalled();
});

it("ignores disabled gestures, vertical scrolling, sliders and OS edges", () => {
  const { content, onSwipeBack } = setup(false);
  fireEvent.touchStart(content, { touches: [touch(160)] });
  fireEvent.touchMove(content, { touches: [touch(300)] });
  fireEvent.touchEnd(content, { touches: [], changedTouches: [touch(300)] });
  expect(onSwipeBack).not.toHaveBeenCalled();
});

it("settles before navigation and cancels an in-flight animation when unmounted", async () => {
  const { content, surface, onSwipeBack, unmount } = setup();
  let finish = () => {};
  const finished = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const cancel = jest.fn();
  const animate = jest.fn(() => ({ finished, cancel }));
  Object.defineProperty(surface, "animate", { value: animate });
  fireEvent.touchStart(content, { touches: [touch(160)] });
  fireEvent.touchMove(content, { touches: [touch(300)] });
  fireEvent.touchEnd(content, { touches: [], changedTouches: [touch(300)] });
  expect(onSwipeBack).not.toHaveBeenCalled();
  expect(animate).toHaveBeenCalledTimes(1);
  await act(async () => {
    finish();
    await finished;
  });
  expect(onSwipeBack).toHaveBeenCalledTimes(1);
  unmount();
  expect(cancel).toHaveBeenCalled();
});

it("clears the outgoing transform when navigation reuses the same surface", async () => {
  const { content, surface, onSwipeBack, onIntentStart, rerender } = setup();
  let finish = () => {};
  const finished = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const cancel = jest.fn();
  Object.defineProperty(surface, "animate", {
    value: jest.fn(() => ({ finished, cancel })),
  });
  fireEvent.touchStart(content, { touches: [touch(160)] });
  fireEvent.touchMove(content, { touches: [touch(300)] });
  fireEvent.touchEnd(content, { touches: [], changedTouches: [touch(300)] });
  await act(async () => {
    finish();
    await finished;
  });
  expect(onSwipeBack).toHaveBeenCalledTimes(1);
  expect(surface.style.transform).not.toBe("");
  rerender(
    <SwipeHarness
      scope="root"
      enabled={false}
      onIntentStart={onIntentStart}
      onSwipeBack={onSwipeBack}
    />
  );
  expect(screen.getByTestId("surface")).toBe(surface);
  expect(surface.style.transform).toBe("");
  expect(surface.style.willChange).toBe("");
  expect(cancel).toHaveBeenCalled();
});

it("cancels and clears an active drag when its scope changes", () => {
  const { content, surface, onSwipeBack, onIntentStart, rerender } = setup();
  const cancel = jest.fn();
  const animate = jest.fn(() => ({ finished: new Promise(() => {}), cancel }));
  Object.defineProperty(surface, "animate", { value: animate });
  fireEvent.touchStart(content, { touches: [touch(160)] });
  fireEvent.touchMove(content, { touches: [touch(300)] });
  act(() => {
    jest.advanceTimersByTime(20);
  });
  expect(surface.style.transform).toBe("translate3d(140px, 0, 0)");
  rerender(
    <SwipeHarness
      scope="other-wave"
      onIntentStart={onIntentStart}
      onSwipeBack={onSwipeBack}
    />
  );
  expect(animate).toHaveBeenCalledTimes(1);
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(surface.style.transform).toBe("");
  expect(surface.style.willChange).toBe("");
  fireEvent.touchEnd(content, { touches: [], changedTouches: [touch(300)] });
  expect(onSwipeBack).not.toHaveBeenCalled();
});
