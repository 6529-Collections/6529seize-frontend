import { fireEvent, render, screen } from "@testing-library/react";
import { createPortal } from "react-dom";
import useCardTouchNavigationGuard from "@/hooks/useCardTouchNavigationGuard";

const touch = { identifier: 1, clientX: 40, clientY: 50 };

function Harness({
  onOpen,
  onPortal,
}: {
  readonly onOpen: () => void;
  readonly onPortal?: () => void;
}) {
  const guard = useCardTouchNavigationGuard();
  return (
    <div data-testid="scroll-parent">
      <div
        ref={guard.cardRef}
        onTouchStartCapture={guard.handleTouchStart}
        onTouchMoveCapture={guard.handleTouchMove}
        onTouchEndCapture={guard.handleTouchEnd}
        onTouchCancelCapture={guard.handleTouchCancel}
        onClickCapture={guard.handleClickCapture}
      >
        <button onClick={onOpen}>Open artwork</button>
        <div data-testid="nested-scroll" />
        {createPortal(
          <button onClick={onPortal}>Portal action</button>,
          document.body
        )}
      </div>
      <div data-testid="unrelated-scroll" />
    </div>
  );
}

function start(target: HTMLElement) {
  return fireEvent.touchStart(target, { touches: [touch], cancelable: true });
}

function end(target: HTMLElement, endTouch = touch) {
  return fireEvent.touchEnd(target, {
    touches: [],
    changedTouches: [endTouch],
    cancelable: true,
  });
}

function click(target: HTMLElement, detail = 1) {
  return fireEvent.click(target, { detail, cancelable: true });
}

describe("useCardTouchNavigationGuard", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(1000);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("allows a stationary touch or small finger jitter without preventing native touch events", () => {
    const onOpen = jest.fn();
    render(<Harness onOpen={onOpen} />);
    const button = screen.getByRole("button", { name: "Open artwork" });

    expect(start(button)).toBe(true);
    expect(
      fireEvent.touchMove(button, {
        touches: [{ ...touch, clientX: 45, clientY: 54 }],
        cancelable: true,
      })
    ).toBe(true);
    expect(end(button, { ...touch, clientX: 45, clientY: 54 })).toBe(true);
    expect(click(button)).toBe(true);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("rejects a drag even when the finger returns to its starting position", () => {
    const onOpen = jest.fn();
    render(<Harness onOpen={onOpen} />);
    const button = screen.getByRole("button", { name: "Open artwork" });

    start(button);
    fireEvent.touchMove(button, { touches: [{ ...touch, clientY: 59 }] });
    fireEvent.touchMove(button, { touches: [touch] });
    end(button);

    expect(click(button)).toBe(false);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("checks the release position when no touchmove event was delivered", () => {
    const onOpen = jest.fn();
    render(<Harness onOpen={onOpen} />);
    const button = screen.getByRole("button", { name: "Open artwork" });

    start(button);
    end(button, { ...touch, clientY: 70 });
    click(button);

    expect(onOpen).not.toHaveBeenCalled();
  });

  it.each(["scroll-parent", "document"])(
    "rejects a touch when %s scrolls during its gesture",
    (scrollTarget) => {
      const onOpen = jest.fn();
      render(<Harness onOpen={onOpen} />);
      const button = screen.getByRole("button", { name: "Open artwork" });

      start(button);
      fireEvent.scroll(
        scrollTarget === "document"
          ? document
          : screen.getByTestId(scrollTarget)
      );
      end(button);
      click(button);

      expect(onOpen).not.toHaveBeenCalled();
    }
  );

  it("rejects a momentum-stop tap but allows a fresh tap once scrolling settles", () => {
    const onOpen = jest.fn();
    render(<Harness onOpen={onOpen} />);
    const button = screen.getByRole("button", { name: "Open artwork" });

    fireEvent.scroll(screen.getByTestId("scroll-parent"));
    jest.advanceTimersByTime(100);
    start(button);
    end(button);
    click(button);
    expect(onOpen).not.toHaveBeenCalled();

    jest.advanceTimersByTime(51);
    start(button);
    end(button);
    click(button);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it.each(["unrelated-scroll", "nested-scroll"])(
    "ignores %s instead of cancelling unrelated card taps",
    (scrollTarget) => {
      const onOpen = jest.fn();
      render(<Harness onOpen={onOpen} />);
      const button = screen.getByRole("button", { name: "Open artwork" });

      start(button);
      fireEvent.scroll(screen.getByTestId(scrollTarget));
      end(button);
      click(button);

      expect(onOpen).toHaveBeenCalledTimes(1);
    }
  );

  it("rejects touch cancellation and permits the next intentional gesture", () => {
    const onOpen = jest.fn();
    render(<Harness onOpen={onOpen} />);
    const button = screen.getByRole("button", { name: "Open artwork" });

    start(button);
    fireEvent.touchCancel(button);
    click(button);
    expect(onOpen).not.toHaveBeenCalled();

    start(button);
    end(button);
    click(button);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("rejects multi-touch even after returning to one finger", () => {
    const onOpen = jest.fn();
    render(<Harness onOpen={onOpen} />);
    const button = screen.getByRole("button", { name: "Open artwork" });

    start(button);
    fireEvent.touchStart(button, {
      touches: [touch, { ...touch, identifier: 2 }],
    });
    fireEvent.touchEnd(button, {
      touches: [touch],
      changedTouches: [{ ...touch, identifier: 2 }],
    });
    end(button);
    click(button);

    expect(onOpen).not.toHaveBeenCalled();
  });

  it("allows keyboard activation even while a delayed touch click is rejected", () => {
    const onOpen = jest.fn();
    render(<Harness onOpen={onOpen} />);
    const button = screen.getByRole("button", { name: "Open artwork" });

    start(button);
    end(button, { ...touch, clientY: 70 });
    click(button, 0);
    expect(onOpen).toHaveBeenCalledTimes(1);

    click(button);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("does not intercept portal touches or consume suppression for a portal click", () => {
    const onOpen = jest.fn();
    const onPortal = jest.fn();
    render(<Harness onOpen={onOpen} onPortal={onPortal} />);
    const button = screen.getByRole("button", { name: "Open artwork" });
    const portal = screen.getByRole("button", { name: "Portal action" });

    start(button);
    end(button, { ...touch, clientY: 70 });
    start(portal);
    end(portal);
    click(portal);
    click(button);

    expect(onPortal).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("expires a rejected release click without a timer or blocking a later mouse click", () => {
    const onOpen = jest.fn();
    render(<Harness onOpen={onOpen} />);
    const button = screen.getByRole("button", { name: "Open artwork" });

    start(button);
    end(button, { ...touch, clientY: 70 });
    jest.advanceTimersByTime(751);
    click(button);

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("clears a rejected gesture on a fresh tap even if the browser emitted no release click", () => {
    const onOpen = jest.fn();
    render(<Harness onOpen={onOpen} />);
    const button = screen.getByRole("button", { name: "Open artwork" });

    start(button);
    end(button, { ...touch, clientY: 70 });
    start(button);
    end(button);
    click(button);

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("removes its passive capture listener on unmount", () => {
    const addListener = jest.spyOn(document, "addEventListener");
    const removeListener = jest.spyOn(document, "removeEventListener");
    const { unmount } = render(<Harness onOpen={jest.fn()} />);
    const registration = addListener.mock.calls.find(
      ([type]) => type === "scroll"
    );

    expect(registration).toEqual([
      "scroll",
      expect.any(Function),
      { capture: true, passive: true },
    ]);
    unmount();
    expect(removeListener).toHaveBeenCalledWith(
      "scroll",
      registration?.[1],
      true
    );
    addListener.mockRestore();
    removeListener.mockRestore();
  });
});
