import { act, fireEvent, render, screen } from "@testing-library/react";
import { useHorizontalSwipe } from "@/hooks/useHorizontalSwipe";

const touch = (x: number, y = 100, identifier = 1) => ({
  clientX: x,
  clientY: y,
  identifier,
});
const move = (target: HTMLElement, x: number, y = 100) =>
  fireEvent.touchMove(target, { touches: [touch(x, y)] });
const start = (target: HTMLElement, x = 180) =>
  fireEvent.touchStart(target, { touches: [touch(x)] });
const end = (target: HTMLElement, x: number) =>
  fireEvent.touchEnd(target, { touches: [], changedTouches: [touch(x)] });

function Harness({
  replyEnabled = true,
  onMove,
  onReply,
  onBack,
  onRender,
  includePostBody = false,
  priorityLeftEdgeWidth = 0,
  replyDirection = -1,
  velocityWindowMs,
  backThreshold = 100,
}: {
  readonly replyEnabled?: boolean;
  readonly onMove: jest.Mock;
  readonly onReply: jest.Mock;
  readonly onBack: jest.Mock;
  readonly onRender: jest.Mock;
  readonly includePostBody?: boolean;
  readonly priorityLeftEdgeWidth?: number;
  readonly replyDirection?: -1 | 1;
  readonly velocityWindowMs?: number;
  readonly backThreshold?: number;
}) {
  onRender();
  const back = useHorizontalSwipe(
    {
      enabled: true,
      direction: 1,
      threshold: backThreshold,
      intentRatio: 1.2,
      flick: true,
      velocityWindowMs,
      priorityLeftEdgeWidth,
      onMove,
      onEnd: onBack,
    },
    "wave"
  );
  const reply = useHorizontalSwipe(
    {
      enabled: replyEnabled,
      direction: replyDirection,
      threshold: 96,
      onMove,
      onEnd: onReply,
    },
    "drop"
  );
  return (
    <div onTouchStart={back} data-testid="wave">
      <div onTouchStart={reply} data-testid="message">
        <span data-testid="text">Message</span>
        <button type="button">Control</button>
        <input aria-label="Vote" type="range" />
        {includePostBody && (
          <div role="button" data-horizontal-swipe-content="true" tabIndex={0}>
            <span data-testid="post-body">Post body</span>
            <a href="/waves">Embedded link</a>
            <button type="button">Embedded control</button>
          </div>
        )}
        <div style={{ overflowX: "auto" }} data-testid="scroll">
          <span data-testid="scroll-child">Carousel</span>
        </div>
      </div>
    </div>
  );
}

function setup(replyEnabled = true, includePostBody = false) {
  const callbacks = {
    onMove: jest.fn(),
    onReply: jest.fn(),
    onBack: jest.fn(),
    onRender: jest.fn(),
  };
  const view = render(
    <Harness
      {...callbacks}
      replyEnabled={replyEnabled}
      includePostBody={includePostBody}
    />
  );
  return { ...callbacks, ...view, target: screen.getByTestId("text") };
}

beforeEach(() => {
  jest.useFakeTimers();
  jest
    .spyOn(Event.prototype, "timeStamp", "get")
    .mockImplementation(() => performance.now() + 1);
});
afterEach(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

it("gives a left drag to the message and a right drag to its containing wave, exactly once", () => {
  const { target, onReply, onBack } = setup();
  start(target);
  move(target, 70);
  end(target, 70);
  expect(onReply).toHaveBeenCalledWith(true, 110, expect.any(Number));
  expect(onBack).not.toHaveBeenCalled();
  start(target);
  move(target, 300);
  end(target, 300);
  expect(onBack).toHaveBeenCalledWith(true, 120, expect.any(Number));
  expect(onReply).toHaveBeenCalledTimes(1);
});

it("prioritizes edge Back over a child with the same direction without changing off-edge priority", () => {
  const callbacks = {
    onMove: jest.fn(),
    onReply: jest.fn(),
    onBack: jest.fn(),
    onRender: jest.fn(),
  };
  render(
    <Harness {...callbacks} priorityLeftEdgeWidth={32} replyDirection={1} />
  );
  const target = screen.getByTestId("text");
  start(target, 28);
  move(target, 160);
  end(target, 160);
  expect(callbacks.onBack).toHaveBeenCalledWith(true, 132, expect.any(Number));
  expect(callbacks.onReply).not.toHaveBeenCalled();
  start(target, 180);
  move(target, 300);
  end(target, 300);
  expect(callbacks.onReply).toHaveBeenCalledWith(true, 120, expect.any(Number));
  expect(callbacks.onBack).toHaveBeenCalledTimes(1);
});

it("accepts a post body that opens its chat but leaves embedded links and controls alone", () => {
  const { onBack, onReply } = setup(true, true);
  for (const target of [
    screen.getByRole("link", { name: "Embedded link" }),
    screen.getByRole("button", { name: "Embedded control" }),
  ]) {
    start(target);
    move(target, 300);
    end(target, 300);
  }
  expect(onBack).not.toHaveBeenCalled();
  expect(onReply).not.toHaveBeenCalled();
  const body = screen.getByTestId("post-body");
  start(body);
  move(body, 300);
  end(body, 300);
  expect(onBack).toHaveBeenCalledWith(true, 120, expect.any(Number));
  expect(onReply).not.toHaveBeenCalled();
});

it("coalesces move events into one frame without re-rendering the React tree", () => {
  const { target, onMove, onRender } = setup();
  const renders = onRender.mock.calls.length;
  start(target);
  for (let x = 160; x >= 60; x -= 10) move(target, x);
  expect(onMove).not.toHaveBeenCalled();
  act(() => {
    jest.advanceTimersByTime(20);
  });
  expect(onMove).toHaveBeenCalledTimes(1);
  expect(onMove).toHaveBeenLastCalledWith(120, true);
  expect(onRender).toHaveBeenCalledTimes(renders);
  end(target, 60);
});

it("never turns vertical scrolling into a horizontal action later in the same touch", () => {
  const { target, onMove, onReply, onBack } = setup();
  start(target);
  move(target, 185, 140);
  move(target, 300, 145);
  end(target, 300);
  expect(onMove).not.toHaveBeenCalled();
  expect(onReply).not.toHaveBeenCalled();
  expect(onBack).not.toHaveBeenCalled();
});

it("cancels a reply after reversing below the threshold", () => {
  const { target, onReply } = setup();
  start(target);
  move(target, 50);
  act(() => {
    jest.advanceTimersByTime(100);
  });
  move(target, 140);
  end(target, 140);
  expect(onReply).toHaveBeenCalledWith(false, 40, expect.any(Number));
});

it("commits a short quick back flick, but not the same distance held still", () => {
  const { target, onBack } = setup();
  start(target);
  act(() => {
    jest.advanceTimersByTime(40);
  });
  move(target, 215);
  end(target, 215);
  expect(onBack).toHaveBeenLastCalledWith(true, 35, expect.any(Number));
  start(target);
  act(() => {
    jest.advanceTimersByTime(40);
  });
  move(target, 215);
  act(() => {
    jest.advanceTimersByTime(200);
  });
  end(target, 215);
  expect(onBack).toHaveBeenLastCalledWith(false, 35, expect.any(Number));
});

it("claims the first clear Android movement before scrolling takes ownership", () => {
  const { target, onBack } = setup();
  start(target);
  expect(move(target, 188.8125, 97.8125)).toBe(false);
  move(target, 300);
  end(target, 300);
  expect(onBack).toHaveBeenCalledWith(true, 120, expect.any(Number));
});

it("keeps a quick flick when Android interpolates a tiny final move", () => {
  const { target, onBack } = setup();
  start(target, 53.34375);
  for (const [elapsed, x] of [
    [80, 69.98125],
    [17, 80.51528],
    [41, 120.66737],
    [9, 129.66008],
    [5, 129.75],
  ] as const) {
    act(() => jest.advanceTimersByTime(elapsed));
    move(target, x);
  }
  act(() => jest.advanceTimersByTime(2));
  end(target, 129.75);
  expect(onBack).toHaveBeenCalledWith(
    true,
    expect.closeTo(76.40625),
    expect.any(Number)
  );
});

it("keeps a phone Back flick when WebKit batches moves and slows its final samples", () => {
  const callbacks = {
    onMove: jest.fn(),
    onReply: jest.fn(),
    onBack: jest.fn(),
    onRender: jest.fn(),
  };
  render(<Harness {...callbacks} velocityWindowMs={80} backThreshold={215} />);
  const target = screen.getByTestId("text");
  start(target, 80);
  for (const [elapsed, x] of [
    [25, 92.67],
    [41, 119.33],
    [17, 130.67],
    [17, 142],
    [16, 153.33],
    [17, 164.67],
    [17, 175.33],
    [16, 185],
    [17, 193.67],
    [8, 197.33],
  ] as const) {
    act(() => jest.advanceTimersByTime(elapsed));
    move(target, x);
  }
  end(target, 197.33);
  expect(callbacks.onBack).toHaveBeenLastCalledWith(
    true,
    expect.any(Number),
    expect.any(Number)
  );
});

it("recognizes a fresh flick after holding the initial touch still", () => {
  const callbacks = {
    onMove: jest.fn(),
    onReply: jest.fn(),
    onBack: jest.fn(),
    onRender: jest.fn(),
  };
  render(<Harness {...callbacks} velocityWindowMs={80} backThreshold={215} />);
  const target = screen.getByTestId("text");
  start(target, 80);
  act(() => jest.advanceTimersByTime(1000));
  move(target, 100);
  act(() => jest.advanceTimersByTime(40));
  move(target, 200);
  end(target, 200);
  expect(callbacks.onBack).toHaveBeenLastCalledWith(true, 120, 2500);
});

it("uses source time for a slow reversal even when events arrive together", () => {
  let sourceTime = 1000;
  jest
    .spyOn(Event.prototype, "timeStamp", "get")
    .mockImplementation(() => sourceTime);
  const callbacks = {
    onMove: jest.fn(),
    onReply: jest.fn(),
    onBack: jest.fn(),
    onRender: jest.fn(),
  };
  render(<Harness {...callbacks} velocityWindowMs={80} backThreshold={215} />);
  const target = screen.getByTestId("text");
  start(target, 80);
  sourceTime += 100;
  move(target, 360);
  act(() => jest.advanceTimersByTime(1));
  sourceTime += 200;
  move(target, 330);
  end(target, 330);
  expect(callbacks.onBack).toHaveBeenLastCalledWith(true, 250, -150);
});

it("still cancels a sampled phone flick after a hold or a deliberate reversal", () => {
  const callbacks = {
    onMove: jest.fn(),
    onReply: jest.fn(),
    onBack: jest.fn(),
    onRender: jest.fn(),
  };
  render(<Harness {...callbacks} velocityWindowMs={80} backThreshold={215} />);
  const target = screen.getByTestId("text");
  start(target, 80);
  act(() => jest.advanceTimersByTime(40));
  move(target, 200);
  act(() => jest.advanceTimersByTime(200));
  end(target, 200);
  expect(callbacks.onBack).toHaveBeenLastCalledWith(false, 120, 0);
  start(target, 80);
  act(() => jest.advanceTimersByTime(40));
  move(target, 360);
  act(() => jest.advanceTimersByTime(20));
  move(target, 330);
  end(target, 330);
  expect(callbacks.onBack).toHaveBeenLastCalledWith(
    false,
    250,
    expect.any(Number)
  );
});

it("cancels a back gesture when released while reversing even beyond the distance threshold", () => {
  const { target, onBack } = setup();
  start(target);
  move(target, 330);
  act(() => {
    jest.advanceTimersByTime(20);
  });
  move(target, 290);
  end(target, 290);
  expect(onBack).toHaveBeenCalledWith(false, 110, expect.any(Number));
});

it("keeps a committed back drag when the release rounds backward by a subpixel", () => {
  const { target, onBack } = setup();
  start(target);
  act(() => jest.advanceTimersByTime(40));
  move(target, 300);
  act(() => jest.advanceTimersByTime(1));
  end(target, 299.6);
  expect(onBack).toHaveBeenCalledWith(
    true,
    expect.closeTo(119.6),
    expect.any(Number)
  );
});

it("keeps a reply when its release rounds backward by a subpixel", () => {
  const { target, onReply } = setup();
  start(target);
  act(() => jest.advanceTimersByTime(40));
  move(target, 60);
  act(() => jest.advanceTimersByTime(1));
  end(target, 60.4);
  expect(onReply).toHaveBeenCalledWith(
    true,
    expect.closeTo(119.6),
    expect.any(Number)
  );
});

it.each(["touchCancel", "blur", "second finger"])(
  "cancels on %s and removes the active session",
  (reason) => {
    const { target, onReply } = setup();
    start(target);
    move(target, 60);
    if (reason === "touchCancel") fireEvent.touchCancel(target);
    else if (reason === "blur")
      act(() => {
        globalThis.dispatchEvent(new Event("blur"));
      });
    else
      fireEvent.touchStart(target, { touches: [touch(60), touch(80, 110, 2)] });
    end(target, 60);
    expect(onReply).toHaveBeenCalledTimes(1);
    expect(onReply).toHaveBeenCalledWith(false, 120, expect.any(Number));
  }
);

it("leaves taps, controls, selection, horizontal scrollers and reserved screen edges alone", () => {
  const { target, onReply, onBack } = setup();
  const scroller = screen.getByTestId("scroll");
  Object.defineProperties(scroller, {
    clientWidth: { value: 100 },
    scrollWidth: { value: 200 },
  });
  for (const control of [
    screen.getByRole("button"),
    screen.getByRole("slider"),
    screen.getByTestId("scroll-child"),
  ]) {
    start(control);
    move(control, 50);
    end(control, 50);
  }
  start(target, 10);
  move(target, 160);
  end(target, 160);
  start(target);
  end(target, 180);
  const selection = jest
    .spyOn(globalThis, "getSelection")
    .mockReturnValue({ isCollapsed: false } as Selection);
  start(target);
  move(target, 50);
  end(target, 50);
  selection.mockRestore();
  expect(onReply.mock.calls).toEqual([]);
  expect(onBack).not.toHaveBeenCalled();
});

it("cancels when permission changes or the owning row unmounts", () => {
  const { target, rerender, unmount, onReply, onMove, onBack, onRender } =
    setup();
  start(target);
  move(target, 50);
  rerender(
    <Harness replyEnabled={false} {...{ onReply, onMove, onBack, onRender }} />
  );
  end(target, 50);
  expect(onReply).toHaveBeenCalledWith(false, 130, expect.any(Number));
  onReply.mockClear();
  rerender(<Harness {...{ onReply, onMove, onBack, onRender }} />);
  start(target);
  move(target, 50);
  unmount();
  end(target, 50);
  expect(onReply).toHaveBeenCalledTimes(1);
  expect(onReply).toHaveBeenCalledWith(false, 130, expect.any(Number));
});

it("suppresses a release click after a slow drag, but allows the next deliberate control tap", () => {
  const { target } = setup();
  const button = screen.getByRole("button");
  const onClick = jest.fn();
  screen.getByTestId("message").addEventListener("click", onClick);
  start(target);
  move(target, 130);
  act(() => {
    jest.advanceTimersByTime(800);
  });
  end(target, 130);
  fireEvent.click(target, { detail: 1 });
  expect(onClick).not.toHaveBeenCalled();
  start(target);
  move(target, 130);
  end(target, 130);
  start(button);
  end(button, 180);
  fireEvent.click(button, { detail: 1 });
  expect(onClick).toHaveBeenCalledTimes(1);
});

it("cancels if text selection becomes active after touchdown", () => {
  const { target, onReply } = setup();
  start(target);
  const selection = jest
    .spyOn(globalThis, "getSelection")
    .mockReturnValue({ isCollapsed: false } as Selection);
  move(target, 50);
  end(target, 50);
  selection.mockRestore();
  expect(onReply).not.toHaveBeenCalled();
});

it("allows a deliberate mouse press immediately after a touch drag", () => {
  const { target } = setup();
  const button = screen.getByRole("button");
  const onClick = jest.fn();
  button.addEventListener("click", onClick);
  start(target);
  move(target, 130);
  end(target, 130);
  fireEvent.pointerDown(button, { pointerType: "mouse" });
  fireEvent.click(button, { detail: 1 });
  expect(onClick).toHaveBeenCalledTimes(1);
});

it("recognizes a rightward thumb arc without changing reply intent", () => {
  const { target, onBack, onReply } = setup();
  start(target);
  const allowedScroll = move(target, 193, 110);
  expect(allowedScroll).toBe(false);
  move(target, 216, 118);
  move(target, 300, 132);
  end(target, 300);
  expect(onBack).toHaveBeenCalledWith(true, 120, expect.any(Number));
  expect(onReply).not.toHaveBeenCalled();

  start(target);
  const undecidedReply = move(target, 167, 110);
  expect(undecidedReply).toBe(true);
  expect(onReply).not.toHaveBeenCalled();
  fireEvent.touchCancel(target);
});

it("lets a small diagonal start become a horizontal Back swipe", () => {
  const { target, onBack } = setup();
  start(target);
  move(target, 188, 109);
  move(target, 205, 111);
  move(target, 300, 111);
  end(target, 300);
  expect(onBack).toHaveBeenCalledWith(true, 120, expect.any(Number));
});

it("keeps an ambiguous unsupported direction pending before Back intent", () => {
  const { target, onBack } = setup(false);
  start(target);
  move(target, 171, 111);
  move(target, 300, 111);
  end(target, 300);
  expect(onBack).toHaveBeenCalledWith(true, 120, expect.any(Number));
});

it("accumulates fractional reverse moves without losing reversal intent", () => {
  const { target, onBack } = setup();
  start(target);
  act(() => jest.advanceTimersByTime(100));
  move(target, 284);
  for (let index = 1; index <= 4; index++) {
    act(() => jest.advanceTimersByTime(4));
    move(target, 284 - index * 0.875);
  }
  end(target, 280.5);
  expect(onBack).toHaveBeenCalledWith(false, 100.5, expect.any(Number));
});

it("measures a retreat from a fractional peak instead of stale forward speed", () => {
  const { target, onBack } = setup();
  start(target);
  act(() => jest.advanceTimersByTime(100));
  move(target, 281);
  act(() => jest.advanceTimersByTime(4));
  move(target, 281.875);
  act(() => jest.advanceTimersByTime(4));
  move(target, 280.625);
  end(target, 280.625);
  expect(onBack).toHaveBeenCalledWith(false, 100.625, expect.any(Number));
});

it("does not acquire an ambiguous diagonal that never becomes horizontal", () => {
  const { target, onBack, onReply } = setup();
  start(target);
  move(target, 190, 113);
  move(target, 250, 170);
  end(target, 310);
  expect(onBack).not.toHaveBeenCalled();
  expect(onReply).not.toHaveBeenCalled();
});

it("releases undecided diagonal reply movement without blocking the next gesture", () => {
  const { target, onBack, onReply } = setup();
  start(target);
  move(target, 167, 110);
  move(target, 165, 111);
  end(target, 165);
  expect(onReply).not.toHaveBeenCalled();
  start(target);
  move(target, 300);
  end(target, 300);
  expect(onBack).toHaveBeenCalledWith(true, 120, expect.any(Number));
});

it.each([false, true])(
  "relinquishes browser-owned movement after horizontal intent=%s",
  (owned) => {
    const { target, onBack } = setup();
    start(target);
    if (owned) move(target, 210);
    fireEvent.touchMove(target, {
      touches: [touch(310)],
      cancelable: false,
    });
    fireEvent.touchCancel(target);
    end(target, 310);
    if (owned)
      expect(onBack).toHaveBeenCalledWith(false, 30, expect.any(Number));
    else expect(onBack).not.toHaveBeenCalled();
    // A subsequent gesture must still work.
    start(target);
    move(target, 300);
    end(target, 300);
    expect(onBack).toHaveBeenLastCalledWith(true, 120, expect.any(Number));
  }
);

function CaughtSpring({
  onPress,
  onRelease,
}: {
  readonly onPress: jest.Mock;
  readonly onRelease: jest.Mock;
}) {
  const swipe = useHorizontalSwipe(
    {
      enabled: true,
      direction: 1,
      threshold: 100,
      flick: true,
      captureOnPress: true,
      allowReverse: true,
      onStart: onPress,
      onMove: () => undefined,
      onEnd: onRelease,
    },
    "spring"
  );
  return (
    <div data-testid="spring" onTouchStart={swipe}>
      Moving page
    </div>
  );
}

it("catches an animation on touch-down and resumes it after an unclaimed tap", () => {
  const onPress = jest.fn(),
    onRelease = jest.fn();
  render(<CaughtSpring onPress={onPress} onRelease={onRelease} />);
  const target = screen.getByTestId("spring");
  start(target);
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(onRelease).not.toHaveBeenCalled();
  end(target, 180);
  expect(onRelease).toHaveBeenCalledWith(false, 0, 0);
});

it("hands off recent finger velocity in pixels per second and lets a caught page reverse", () => {
  const onPress = jest.fn(),
    onRelease = jest.fn();
  render(<CaughtSpring onPress={onPress} onRelease={onRelease} />);
  const target = screen.getByTestId("spring");
  start(target);
  act(() => jest.advanceTimersByTime(40));
  move(target, 215);
  end(target, 215);
  expect(onRelease).toHaveBeenLastCalledWith(true, 35, 875);
  start(target);
  act(() => jest.advanceTimersByTime(40));
  move(target, 160);
  end(target, 160);
  expect(onRelease).toHaveBeenLastCalledWith(false, -20, -500);
  expect(onPress).toHaveBeenCalledTimes(2);
});
