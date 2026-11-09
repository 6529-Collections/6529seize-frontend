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
}: {
  readonly replyEnabled?: boolean;
  readonly onMove: jest.Mock;
  readonly onReply: jest.Mock;
  readonly onBack: jest.Mock;
  readonly onRender: jest.Mock;
}) {
  onRender();
  const back = useHorizontalSwipe(
    {
      enabled: true,
      direction: 1,
      threshold: 100,
      flick: true,
      onMove,
      onEnd: onBack,
    },
    "wave"
  );
  const reply = useHorizontalSwipe(
    {
      enabled: replyEnabled,
      direction: -1,
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
        <div style={{ overflowX: "auto" }} data-testid="scroll">
          <span data-testid="scroll-child">Carousel</span>
        </div>
      </div>
    </div>
  );
}

function setup(replyEnabled = true) {
  const callbacks = {
    onMove: jest.fn(),
    onReply: jest.fn(),
    onBack: jest.fn(),
    onRender: jest.fn(),
  };
  const view = render(<Harness {...callbacks} replyEnabled={replyEnabled} />);
  return { ...callbacks, ...view, target: screen.getByTestId("text") };
}

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

it("gives a left drag to the message and a right drag to its containing wave, exactly once", () => {
  const { target, onReply, onBack } = setup();
  start(target);
  move(target, 70);
  end(target, 70);
  expect(onReply).toHaveBeenCalledWith(true, 110);
  expect(onBack).not.toHaveBeenCalled();
  start(target);
  move(target, 300);
  end(target, 300);
  expect(onBack).toHaveBeenCalledWith(true, 120);
  expect(onReply).toHaveBeenCalledTimes(1);
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
  expect(onReply).toHaveBeenCalledWith(false, 40);
});

it("commits a short quick back flick, but not the same distance held still", () => {
  const { target, onBack } = setup();
  start(target);
  act(() => {
    jest.advanceTimersByTime(40);
  });
  move(target, 215);
  end(target, 215);
  expect(onBack).toHaveBeenLastCalledWith(true, 35);
  start(target);
  act(() => {
    jest.advanceTimersByTime(40);
  });
  move(target, 215);
  act(() => {
    jest.advanceTimersByTime(200);
  });
  end(target, 215);
  expect(onBack).toHaveBeenLastCalledWith(false, 35);
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
  expect(onBack).toHaveBeenCalledWith(false, 110);
});

it.each(["touchCancel", "blur", "second finger"])(
  "cancels on %s and removes the active session",
  (reason) => {
    const { target, onReply } = setup();
    start(target);
    move(target, 60);
    if (reason === "touchCancel") fireEvent.touchCancel(target);
    else if (reason === "blur") fireEvent(globalThis, new Event("blur"));
    else
      fireEvent.touchStart(target, { touches: [touch(60), touch(80, 110, 2)] });
    end(target, 60);
    expect(onReply).toHaveBeenCalledTimes(1);
    expect(onReply).toHaveBeenCalledWith(false, 120);
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
  expect(onReply).toHaveBeenCalledWith(false, 130);
  onReply.mockClear();
  rerender(<Harness {...{ onReply, onMove, onBack, onRender }} />);
  start(target);
  move(target, 50);
  unmount();
  end(target, 50);
  expect(onReply).toHaveBeenCalledTimes(1);
  expect(onReply).toHaveBeenCalledWith(false, 130);
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
