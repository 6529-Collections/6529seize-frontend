import { useRef } from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  resistedWavePinDistance,
  useWaveRowTouchGestures,
  WAVE_ROW_LONG_PRESS_MS,
} from "@/hooks/useWaveRowTouchGestures";

const onLongPress = jest.fn();
const onTogglePin = jest.fn();
const onSwipe = jest.fn();
const onNavigate = jest.fn();

function Harness({
  enabled = true,
  scope = "wave",
}: {
  readonly enabled?: boolean;
  readonly scope?: string;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  useWaveRowTouchGestures({
    enabled,
    scope,
    rowRef,
    onLongPress,
    onTogglePin,
    onSwipe,
  });
  return (
    <div ref={rowRef}>
      <a href="#wave" onClick={onNavigate}>
        Wave
      </a>
      <button type="button">Score</button>
    </div>
  );
}

function pointer(
  target: Element | Document,
  type: string,
  x = 100,
  y = 100,
  id = 1,
  pointerType = "touch"
) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    button: 0,
    clientX: x,
    clientY: y,
  });
  Object.defineProperties(event, {
    pointerId: { value: id },
    pointerType: { value: pointerType },
    isPrimary: { value: id === 1 },
  });
  act(() => {
    target.dispatchEvent(event);
  });
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
});
afterEach(() => {
  act(() => {
    jest.runOnlyPendingTimers();
  });
  jest.useRealTimers();
});

it("commits only on armed release and blocks its navigation click", () => {
  render(<Harness />);
  const wave = screen.getByRole("link");
  pointer(wave, "pointerdown");
  pointer(wave, "pointermove", 180);
  expect(onTogglePin).not.toHaveBeenCalled();
  pointer(wave, "pointerup", 180);
  fireEvent.click(wave, { detail: 1 });
  expect(onTogglePin).toHaveBeenCalledTimes(1);
  expect(onNavigate).not.toHaveBeenCalled();
  pointer(wave, "pointerdown");
  pointer(wave, "pointerup");
  fireEvent.click(wave, { detail: 1 });
  expect(onNavigate).toHaveBeenCalledTimes(1);
});

it.each([140, 163])(
  "does nothing when released at %s after crossing the threshold",
  (release) => {
    render(<Harness />);
    const wave = screen.getByRole("link");
    pointer(wave, "pointerdown");
    pointer(wave, "pointermove", 190);
    pointer(wave, "pointermove", release);
    pointer(wave, "pointerup", release);
    expect(onTogglePin).not.toHaveBeenCalled();
    expect(onSwipe).toHaveBeenLastCalledWith(0, true);
  }
);

it("blocks the release click even after a long slow swipe", () => {
  render(<Harness />);
  const wave = screen.getByRole("link");
  pointer(wave, "pointerdown");
  pointer(wave, "pointermove", 180);
  act(() => {
    jest.advanceTimersByTime(2500);
  });
  pointer(wave, "pointerup", 180);
  fireEvent.click(wave, { detail: 1 });
  expect(onTogglePin).toHaveBeenCalledTimes(1);
  expect(onNavigate).not.toHaveBeenCalled();
});

it("toggles only once when crossing the threshold repeatedly", () => {
  render(<Harness />);
  const wave = screen.getByRole("link");
  pointer(wave, "pointerdown");
  for (const x of [170, 190, 150, 180, 200]) pointer(wave, "pointermove", x);
  pointer(wave, "pointerup", 200);
  expect(onTogglePin).toHaveBeenCalledTimes(1);
});

it("keeps vertical scrolling out of both gestures for the entire touch", () => {
  render(<Harness />);
  const wave = screen.getByRole("link");
  pointer(wave, "pointerdown");
  pointer(wave, "pointermove", 103, 120);
  pointer(wave, "pointermove", 200, 140);
  act(() => {
    jest.advanceTimersByTime(600);
  });
  pointer(wave, "pointerup", 200, 140);
  expect(onLongPress).not.toHaveBeenCalled();
  expect(onTogglePin).not.toHaveBeenCalled();
  expect(onSwipe).not.toHaveBeenCalled();
});

it("opens the menu after a stationary hold, without pinning or navigating", () => {
  render(<Harness />);
  const wave = screen.getByRole("link");
  pointer(wave, "pointerdown");
  act(() => {
    jest.advanceTimersByTime(WAVE_ROW_LONG_PRESS_MS - 1);
  });
  expect(onLongPress).not.toHaveBeenCalled();
  act(() => {
    jest.advanceTimersByTime(1);
  });
  pointer(wave, "pointerup");
  fireEvent.click(wave, { detail: 1 });
  expect(onLongPress).toHaveBeenCalledTimes(1);
  expect(onTogglePin).not.toHaveBeenCalled();
  expect(onNavigate).not.toHaveBeenCalled();
});

it.each(["pointercancel", "second finger", "blur"])(
  "cancels on %s",
  (reason) => {
    render(<Harness />);
    const wave = screen.getByRole("link");
    pointer(wave, "pointerdown");
    pointer(wave, "pointermove", 180);
    if (reason === "second finger") pointer(wave, "pointerdown", 110, 110, 2);
    else if (reason === "blur") fireEvent(globalThis, new Event("blur"));
    else pointer(wave, "pointercancel");
    pointer(wave, "pointerup", 180);
    act(() => {
      jest.advanceTimersByTime(600);
    });
    expect(onTogglePin).not.toHaveBeenCalled();
    expect(onLongPress).not.toHaveBeenCalled();
  }
);

it("leaves mouse, controls, anonymous/disabled rows, and the screen edge alone", () => {
  const view = render(<Harness />);
  const wave = screen.getByRole("link");
  for (const [target, x, type] of [
    [wave, 100, "mouse"],
    [screen.getByRole("button"), 100, "touch"],
    [wave, 10, "touch"],
  ] as const) {
    pointer(target, "pointerdown", x, 100, 1, type);
    pointer(target, "pointermove", 200);
    pointer(target, "pointerup", 200);
  }
  view.rerender(<Harness enabled={false} />);
  pointer(wave, "pointerdown");
  act(() => {
    jest.advanceTimersByTime(600);
  });
  pointer(wave, "pointerup", 200);
  expect(onTogglePin).not.toHaveBeenCalled();
  expect(onLongPress).not.toHaveBeenCalled();
});

it("cancels a pending hold when its viewer or row changes or unmounts", () => {
  const view = render(<Harness />);
  const wave = screen.getByRole("link");
  pointer(wave, "pointerdown");
  view.rerender(<Harness scope="other-viewer" />);
  act(() => {
    jest.advanceTimersByTime(600);
  });
  expect(onLongPress).not.toHaveBeenCalled();
  pointer(wave, "pointerdown");
  view.unmount();
  act(() => {
    jest.advanceTimersByTime(600);
  });
  expect(onLongPress).not.toHaveBeenCalled();
});

it("adds resistance beyond the threshold", () => {
  expect(resistedWavePinDistance(64)).toBe(64);
  expect(resistedWavePinDistance(144) - 64).toBeLessThan(80);
  expect(
    resistedWavePinDistance(224) - resistedWavePinDistance(144)
  ).toBeLessThan(resistedWavePinDistance(144) - 64);
});
