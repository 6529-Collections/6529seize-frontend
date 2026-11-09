import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { useSwipeToReply } from "@/hooks/useSwipeToReply";

function Harness({
  scope,
  onReply,
}: {
  readonly scope: string;
  readonly onReply: () => void;
}) {
  const { rootRef, contentRef, onTouchStart } = useSwipeToReply({
    enabled: true,
    canReply: true,
    scope,
    onReply,
  });
  return (
    <div ref={rootRef} onTouchStart={onTouchStart} data-testid="surface">
      <div
        ref={contentRef}
        data-testid="content"
        style={{ transform: "var(--message-swipe-transform, none)" }}
      >
        {scope}
      </div>
    </div>
  );
}

function deferredAnimation() {
  let complete = () => {};
  const finished = new Promise<void>((resolve) => {
    complete = resolve;
  });
  return { finished, cancel: jest.fn(), complete: () => complete() };
}

const touch = (clientX: number) => ({ identifier: 42, clientX, clientY: 100 });
const start = (target: HTMLElement) =>
  fireEvent.touchStart(target, { touches: [touch(240)] });
const end = (target: HTMLElement) =>
  fireEvent.touchEnd(target, { touches: [], changedTouches: [touch(120)] });

function drag(target: HTMLElement) {
  start(target);
  fireEvent.touchMove(target, { touches: [touch(120)] });
  act(() => jest.advanceTimersByTime(20));
}

function expectReleased(surface: HTMLElement, content: HTMLElement) {
  expect(surface).not.toHaveAttribute("data-reply-swiping");
  expect(surface).not.toHaveAttribute("data-reply-ready");
  expect(surface.style.getPropertyValue("--message-swipe-transform")).toBe("");
  expect(surface.style.getPropertyValue("--message-swipe-time-opacity")).toBe(
    ""
  );
  expect(content.style.willChange).toBe("");
  expect(content.style.transition).toBe("");
}

function setup() {
  const onReply = jest.fn();
  const view = render(<Harness scope="first-message" onReply={onReply} />);
  const surface = screen.getByTestId("surface");
  const content = screen.getByTestId("content");
  const animations: ReturnType<typeof deferredAnimation>[] = [];
  const animate = jest.fn(() => {
    const animation = deferredAnimation();
    animations.push(animation);
    return animation;
  });
  Object.defineProperty(content, "animate", {
    configurable: true,
    value: animate,
  });
  return { ...view, onReply, surface, content, animate, animations };
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  cleanup();
  jest.useRealTimers();
});

it("cancels settling when a row is reused and ignores its stale completion", async () => {
  const { rerender, surface, content, onReply, animations } = setup();
  drag(content);
  end(content);
  expect(content.style.willChange).toBe("transform");
  expect(content.style.transition).toBe("none");
  const previousAnimation = animations[0]!;

  rerender(<Harness scope="second-message" onReply={onReply} />);
  expect(previousAnimation.cancel).toHaveBeenCalledTimes(1);
  expectReleased(surface, content);

  drag(content);
  await act(async () => previousAnimation.complete());
  expect(surface).toHaveAttribute("data-reply-swiping", "true");
  expect(content.style.willChange).toBe("transform");
  expect(content.style.transition).toBe("none");
  expect(onReply).toHaveBeenCalledTimes(1);
  fireEvent.touchCancel(content);
});

it("cleans the settle created when a scope change cancels an active drag", () => {
  const { rerender, surface, content, onReply, animate, animations } = setup();
  drag(content);
  expect(surface).toHaveAttribute("data-reply-ready", "true");

  rerender(<Harness scope="second-message" onReply={onReply} />);
  expect(animate).toHaveBeenCalledTimes(1);
  expect(animations[0]?.cancel).toHaveBeenCalledTimes(1);
  expectReleased(surface, content);
  end(content);
  expect(onReply).not.toHaveBeenCalled();
});

it.each([false, true])(
  "cleans captured elements on unmount after release=%s",
  (released) => {
    const { unmount, surface, content, animations } = setup();
    drag(content);
    if (released) end(content);

    unmount();
    expect(animations[0]?.cancel).toHaveBeenCalledTimes(1);
    expectReleased(surface, content);
  }
);
