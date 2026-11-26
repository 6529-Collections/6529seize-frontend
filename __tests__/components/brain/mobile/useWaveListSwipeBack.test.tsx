import { act, fireEvent, render, screen } from "@testing-library/react";
import { animate } from "framer-motion";
import { useWaveListSwipeBack } from "@/components/brain/mobile/useWaveListSwipeBack";
import * as waveNavigation from "@/helpers/waves/wave-navigation-transition";
import { MOTION_SPRINGS } from "@/lib/motion/springs";
import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";

jest.mock("framer-motion", () => ({ animate: jest.fn() }));
jest.mock("@capacitor/keyboard", () => ({ Keyboard: { hide: jest.fn() } }));

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
  targetScreen,
  withHeader = false,
  edgeSwipeBack = false,
}: {
  readonly enabled?: boolean;
  readonly scope?: string;
  readonly onIntentStart: () => void;
  readonly onSwipeBack: () => void;
  readonly targetScreen?: waveNavigation.WaveScreen | undefined;
  readonly withHeader?: boolean;
  readonly edgeSwipeBack?: boolean;
}) {
  const { ref, onTouchStart, onTouchStartCapture } = useWaveListSwipeBack({
    enabled,
    scope,
    onIntentStart,
    onSwipeBack,
    targetScreen,
    edgeSwipeBack,
  });
  const content = (
    <div
      ref={ref}
      onTouchStart={onTouchStart}
      onTouchStartCapture={onTouchStartCapture}
      data-testid="surface"
    >
      <span data-testid="content">Wave</span>
      <input aria-label="Vote" type="range" />
      <div
        onTouchStart={(event) => event.stopPropagation()}
        onTouchMove={(event) => event.stopPropagation()}
        onTouchEnd={(event) => event.stopPropagation()}
      >
        <button type="button">Card action</button>
        <a href="/profile">Profile</a>
        <input aria-label="Amount" />
        <div role="button" tabIndex={0}>
          Open card
        </div>
        <div style={{ overflowX: "auto" }} data-testid="horizontal-row">
          <span data-testid="carousel-content">Horizontal content</span>
        </div>
      </div>
    </div>
  );
  return withHeader ? (
    <div data-wave-swipe-page data-testid="page">
      <header>Wave name and Join</header>
      {content}
    </div>
  ) : (
    content
  );
}

beforeEach(() => {
  jest.useFakeTimers();
  // React substitutes Date.now() for a zero event time; keep the source clock positive.
  jest
    .spyOn(Event.prototype, "timeStamp", "get")
    .mockImplementation(() => performance.now() + 1);
  jest.mocked(animate).mockReset();
});

it("does not navigate from a captured release after its surface is disabled", () => {
  let capturedNavigation = () => {};
  const capture = jest
    .spyOn(waveNavigation, "runWaveNavigationTransition")
    .mockImplementation((_screen, navigate) => {
      capturedNavigation = navigate;
      return true;
    });
  const onSwipeBack = jest.fn();
  const onIntentStart = jest.fn();
  const { rerender } = render(
    <SwipeHarness targetScreen="feed" {...{ onSwipeBack, onIntentStart }} />
  );
  const surface = screen.getByTestId("surface");
  Object.defineProperty(surface, "animate", { value: jest.fn() });
  const content = screen.getByTestId("content");
  fireEvent.touchStart(content, { touches: [touch(160)] });
  fireEvent.touchMove(content, { touches: [touch(300)] });
  fireEvent.touchEnd(content, { touches: [], changedTouches: [touch(300)] });
  expect(capture).toHaveBeenCalledTimes(1);
  rerender(
    <SwipeHarness
      enabled={false}
      targetScreen="feed"
      {...{ onSwipeBack, onIntentStart }}
    />
  );
  capturedNavigation();
  expect(onSwipeBack).not.toHaveBeenCalled();
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

function setup(enabled = true, targetScreen?: waveNavigation.WaveScreen) {
  const onIntentStart = jest.fn();
  const onSwipeBack = jest.fn();
  const result = render(
    <SwipeHarness {...{ enabled, onIntentStart, onSwipeBack, targetScreen }} />
  );
  return {
    ...result,
    onIntentStart,
    onSwipeBack,
    surface: screen.getByTestId("surface"),
    content: screen.getByTestId("content"),
  };
}

it("keeps the first native swipe when keyboard dismissal would blur the WebView", () => {
  jest.spyOn(Capacitor, "isNativePlatform").mockReturnValue(true);
  jest.spyOn(Capacitor, "isPluginAvailable").mockReturnValue(true);
  jest.mocked(Keyboard.hide).mockImplementation(async () => {
    globalThis.dispatchEvent(new Event("blur"));
  });
  const { content, onSwipeBack } = setup();
  fireEvent.touchStart(content, { touches: [touch(160)] });
  fireEvent.touchMove(content, { touches: [touch(740)] });
  act(() => jest.advanceTimersByTime(20));
  fireEvent.touchEnd(content, { touches: [], changedTouches: [touch(740)] });
  expect(onSwipeBack).toHaveBeenCalledTimes(1);
});

it("blurs the focused text input when dragging starts", () => {
  const { content } = setup();
  const input = screen.getByRole("textbox", { name: "Amount" });
  input.focus();
  expect(document.activeElement).toBe(input);
  fireEvent.touchStart(content, { touches: [touch(160)] });
  fireEvent.touchMove(content, { touches: [touch(220)] });
  act(() => jest.advanceTimersByTime(20));
  expect(document.activeElement).not.toBe(input);
  fireEvent.touchCancel(content);
});

it("carries release velocity into the shared spring and reveals the list before its invisible tail", async () => {
  const now = jest.spyOn(performance, "now").mockReturnValue(0);
  let finish = () => {};
  const finished = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const cancel = jest.fn();
  jest.mocked(animate).mockReturnValue({
    cancel,
    then: finished.then.bind(finished),
  } as unknown as ReturnType<typeof animate>);
  const onSwipeBack = jest.fn();
  const onIntentStart = jest.fn();
  const view = (enabled = true) => (
    <SwipeHarness
      edgeSwipeBack
      withHeader
      targetScreen="list"
      {...{ enabled, onSwipeBack, onIntentStart }}
    />
  );
  const { rerender } = render(view());
  const target = screen.getByRole("button", { name: "Card action" });
  fireEvent.touchStart(target, { touches: [touch(16)] });
  now.mockReturnValue(50);
  fireEvent.touchMove(target, { touches: [touch(140)] });
  fireEvent.touchEnd(target, { touches: [], changedTouches: [touch(140)] });
  expect(animate).toHaveBeenCalledWith(
    124,
    window.innerWidth,
    expect.objectContaining({
      ...MOTION_SPRINGS.spatial.default,
      velocity: 2480,
    })
  );
  const options = jest.mocked(animate).mock.calls[0]![2]!;
  const page = screen.getByTestId("page");
  act(() => options.onUpdate?.(-10));
  expect(page.style.transform).toBe("translate3d(0px, 0, 0)");
  expect(onSwipeBack).not.toHaveBeenCalled();
  act(() => options.onUpdate?.(window.innerWidth - 0.5));
  expect(onSwipeBack).toHaveBeenCalledTimes(1);
  act(() => options.onUpdate?.(window.innerWidth + 10));
  expect(page.style.transform).toBe(
    `translate3d(${window.innerWidth}px, 0, 0)`
  );
  expect(screen.getByTestId("surface").style.transform).toBe("");
  expect(onSwipeBack).toHaveBeenCalledTimes(1);
  await act(async () => {
    finish();
    await finished;
  });
  expect(onSwipeBack).toHaveBeenCalledTimes(1);
  rerender(view(false));
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(page.style.transform).toBe("");
});

it("catches a returning spring without jumping and cancels safely on unmount", async () => {
  const now = jest.spyOn(performance, "now").mockReturnValue(0);
  let finish = () => {};
  const finished = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const cancel = jest.fn();
  const stop = jest.fn();
  jest.mocked(animate).mockReturnValue({
    cancel,
    stop,
    then: finished.then.bind(finished),
  } as unknown as ReturnType<typeof animate>);
  const onSwipeBack = jest.fn();
  const { unmount } = render(
    <SwipeHarness
      edgeSwipeBack
      targetScreen="list"
      onIntentStart={jest.fn()}
      onSwipeBack={onSwipeBack}
    />
  );
  const target = screen.getByTestId("content");
  fireEvent.touchStart(target, { touches: [touch(16)] });
  now.mockReturnValue(1000);
  fireEvent.touchMove(target, { touches: [touch(56)] });
  fireEvent.touchEnd(target, { touches: [], changedTouches: [touch(56)] });
  expect(animate).toHaveBeenCalledWith(
    40,
    0,
    expect.objectContaining({ ...MOTION_SPRINGS.spatial.default, velocity: 0 })
  );
  const options = jest.mocked(animate).mock.calls[0]![2]!;
  act(() => options.onUpdate?.(20));
  now.mockReturnValue(1250);
  fireEvent.touchStart(target, { touches: [touch(16)] });
  fireEvent.touchMove(target, { touches: [touch(36)] });
  act(() => jest.advanceTimersByTime(20));
  expect(stop).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId("surface").style.transform).toBe(
    "translate3d(40px, 0, 0)"
  );
  fireEvent.touchCancel(target);
  unmount();
  expect(cancel).toHaveBeenCalledTimes(1);
  await act(async () => {
    finish();
    await finished;
  });
  expect(onSwipeBack).not.toHaveBeenCalled();
});

it("clamps a reversed fallback drag at the resting edge", () => {
  jest.mocked(animate).mockReturnValue({
    stop: jest.fn(),
    cancel: jest.fn(),
    then: () => Promise.resolve(),
  } as unknown as ReturnType<typeof animate>);
  render(
    <SwipeHarness
      edgeSwipeBack
      targetScreen="list"
      onIntentStart={jest.fn()}
      onSwipeBack={jest.fn()}
    />
  );
  const target = screen.getByTestId("content");
  fireEvent.touchStart(target, { touches: [touch(16)] });
  fireEvent.touchMove(target, { touches: [touch(56)] });
  act(() => jest.advanceTimersByTime(20));
  fireEvent.touchMove(target, { touches: [touch(0)] });
  act(() => jest.advanceTimersByTime(20));
  expect(screen.getByTestId("surface").style.transform).toBe(
    "translate3d(0px, 0, 0)"
  );
  fireEvent.touchCancel(target);
});

it("skips the channel release spring with reduced motion", () => {
  jest.spyOn(window, "matchMedia").mockReturnValueOnce({
    ...window.matchMedia("(prefers-reduced-motion: reduce)"),
    matches: true,
  });
  const onSwipeBack = jest.fn();
  render(
    <SwipeHarness
      edgeSwipeBack
      targetScreen="list"
      onIntentStart={jest.fn()}
      onSwipeBack={onSwipeBack}
    />
  );
  const target = screen.getByTestId("content");
  fireEvent.touchStart(target, { touches: [touch(16)] });
  fireEvent.touchMove(target, { touches: [touch(160)] });
  fireEvent.touchEnd(target, { touches: [], changedTouches: [touch(160)] });
  expect(animate).not.toHaveBeenCalled();
  expect(onSwipeBack).toHaveBeenCalledTimes(1);
  expect(screen.getByTestId("surface").style.transform).toBe("");
});

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

it("moves the header's page and clears it when navigation is disabled after release", async () => {
  const onSwipeBack = jest.fn();
  const onIntentStart = jest.fn();
  const view = (enabled: boolean) => (
    <SwipeHarness
      withHeader
      targetScreen="list"
      {...{ enabled, onSwipeBack, onIntentStart }}
    />
  );
  const { rerender } = render(view(true));
  const page = screen.getByTestId("page");
  const surface = screen.getByTestId("surface");
  const content = screen.getByTestId("content");
  let finish = () => {};
  const finished = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const cancel = jest.fn();
  const animate = jest.fn(() => ({ finished, cancel }));
  Object.defineProperty(page, "animate", { value: animate });
  fireEvent.touchStart(content, { touches: [touch(160)] });
  fireEvent.touchMove(content, { touches: [touch(300)] });
  act(() => jest.advanceTimersByTime(20));
  expect(page.style.transform).toBe("translate3d(140px, 0, 0)");
  expect(surface.style.transform).toBe("");
  fireEvent.touchEnd(content, { touches: [], changedTouches: [touch(300)] });
  expect(animate).toHaveBeenCalledTimes(1);
  expect(onSwipeBack).not.toHaveBeenCalled();
  rerender(view(false));
  expect(cancel).toHaveBeenCalledTimes(1);
  expect(page.style.transform).toBe("");
  expect(page.style.willChange).toBe("");
  await act(async () => {
    finish();
    await finished;
  });
  expect(onSwipeBack).not.toHaveBeenCalled();
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

it("recognizes a rightward thumb arc before scrolling can take ownership", () => {
  const { content, surface, onIntentStart, onSwipeBack } = setup();
  fireEvent.touchStart(content, { touches: [touch(160)] });
  const scrollAllowed = fireEvent.touchMove(content, {
    touches: [touch(173, 110)],
  });
  expect(scrollAllowed).toBe(false);
  act(() => jest.advanceTimersByTime(20));
  expect(surface.style.transform).toBe("translate3d(13px, 0, 0)");
  expect(onIntentStart).toHaveBeenCalledTimes(1);
  fireEvent.touchMove(content, { touches: [touch(270, 134)] });
  fireEvent.touchEnd(content, {
    touches: [],
    changedTouches: [touch(270, 134)],
  });
  expect(onSwipeBack).toHaveBeenCalledTimes(1);
});

it("ignores disabled gestures, vertical scrolling, sliders and OS edges", () => {
  const { content, onSwipeBack } = setup(false);
  fireEvent.touchStart(content, { touches: [touch(160)] });
  fireEvent.touchMove(content, { touches: [touch(300)] });
  fireEvent.touchEnd(content, { touches: [], changedTouches: [touch(300)] });
  expect(onSwipeBack).not.toHaveBeenCalled();
});

it("settles before navigation and cancels an in-flight animation when unmounted", async () => {
  const capture = jest.spyOn(waveNavigation, "runWaveNavigationTransition");
  const { content, surface, onSwipeBack, unmount } = setup(true, "list");
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
  expect(capture).not.toHaveBeenCalled();
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

it.each([
  "Card action",
  "Profile",
  "Amount",
  "Vote",
  "Open card",
  "carousel-content",
])(
  "gives left-edge Back priority over %s, including stopped touch propagation",
  (name) => {
    const onSwipeBack = jest.fn();
    render(
      <SwipeHarness
        edgeSwipeBack
        onSwipeBack={onSwipeBack}
        onIntentStart={jest.fn()}
      />
    );
    const row = screen.getByTestId("horizontal-row");
    Object.defineProperties(row, {
      clientWidth: { value: 100 },
      scrollWidth: { value: 200 },
    });
    const target =
      screen.queryByLabelText(name) ??
      screen.queryByText(name) ??
      screen.getByTestId(name);
    fireEvent.touchStart(target, { touches: [touch(16)] });
    expect(fireEvent.touchMove(target, { touches: [touch(36)] })).toBe(false);
    fireEvent.touchMove(target, { touches: [touch(150)] });
    fireEvent.touchEnd(target, { touches: [], changedTouches: [touch(150)] });
    expect(onSwipeBack).toHaveBeenCalledTimes(1);
  }
);

it("keeps off-edge controls and horizontal rows out of Back, and leaves edge taps and vertical scroll alone", () => {
  const onSwipeBack = jest.fn();
  const onIntentStart = jest.fn();
  render(<SwipeHarness edgeSwipeBack {...{ onSwipeBack, onIntentStart }} />);
  const slider = screen.getByRole("slider", { name: "Vote" });
  const row = screen.getByTestId("horizontal-row");
  Object.defineProperties(row, {
    clientWidth: { value: 100 },
    scrollWidth: { value: 200 },
  });
  for (const target of [slider, screen.getByTestId("carousel-content")]) {
    fireEvent.touchStart(target, { touches: [touch(50)] });
    fireEvent.touchMove(target, { touches: [touch(200)] });
    fireEvent.touchEnd(target, { touches: [], changedTouches: [touch(200)] });
  }
  fireEvent.touchStart(slider, { touches: [touch(16)] });
  fireEvent.touchEnd(slider, { touches: [], changedTouches: [touch(16)] });
  fireEvent.touchStart(slider, { touches: [touch(16)] });
  expect(fireEvent.touchMove(slider, { touches: [touch(20, 150)] })).toBe(true);
  fireEvent.touchMove(slider, { touches: [touch(200, 150)] });
  fireEvent.touchEnd(slider, {
    touches: [],
    changedTouches: [touch(200, 150)],
  });
  expect(onSwipeBack).not.toHaveBeenCalled();
  expect(onIntentStart).not.toHaveBeenCalled();
});

it("keeps edge Back when a coasting row marks movement non-cancelable", () => {
  const onSwipeBack = jest.fn();
  render(
    <SwipeHarness
      edgeSwipeBack
      onSwipeBack={onSwipeBack}
      onIntentStart={jest.fn()}
    />
  );
  const target = screen.getByRole("slider", { name: "Vote" });
  fireEvent.touchStart(target, { touches: [touch(16)], cancelable: false });
  fireEvent.touchMove(target, { touches: [touch(40)], cancelable: false });
  fireEvent.touchMove(target, { touches: [touch(160)], cancelable: false });
  fireEvent.touchEnd(target, { touches: [], changedTouches: [touch(160)] });
  expect(onSwipeBack).toHaveBeenCalledTimes(1);
});

it.each([false, true])(
  "cancels navigation disabled in the same wave after release=%s",
  async (released) => {
    const { content, surface, onSwipeBack, onIntentStart, rerender } = setup();
    let complete = () => {};
    const finished = new Promise<void>((resolve) => {
      complete = resolve;
    });
    const cancel = jest.fn();
    Object.defineProperty(surface, "animate", {
      value: jest.fn(() => ({ finished, cancel })),
    });
    fireEvent.touchStart(content, { touches: [touch(160)] });
    fireEvent.touchMove(content, { touches: [touch(300)] });
    act(() => jest.advanceTimersByTime(20));
    if (released)
      fireEvent.touchEnd(content, {
        touches: [],
        changedTouches: [touch(300)],
      });
    rerender(
      <SwipeHarness
        enabled={false}
        onIntentStart={onIntentStart}
        onSwipeBack={onSwipeBack}
      />
    );
    fireEvent.touchEnd(content, { touches: [], changedTouches: [touch(300)] });
    await act(async () => {
      complete();
      await finished;
    });
    expect(cancel).toHaveBeenCalledTimes(released ? 1 : 0);
    expect(onSwipeBack).not.toHaveBeenCalled();
    expect(surface.style.transform).toBe("");
    expect(surface.style.willChange).toBe("");
  }
);
