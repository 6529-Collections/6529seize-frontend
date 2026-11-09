import { act, fireEvent, renderHook } from "@testing-library/react";
import type { MouseEvent } from "react";
import useLongPressClickSuppression from "@/hooks/useLongPressClickSuppression";

const createClickEvent = ({
  currentTarget,
  target,
}: {
  readonly currentTarget: HTMLElement;
  readonly target: Node;
}) =>
  ({
    currentTarget,
    target,
    preventDefault: jest.fn(),
    stopPropagation: jest.fn(),
  }) as unknown as MouseEvent<HTMLElement>;

describe("useLongPressClickSuppression", () => {
  it("expires the document guard after the held touch ends", () => {
    jest.useFakeTimers();
    const { result, unmount } = renderHook(() =>
      useLongPressClickSuppression()
    );
    const portalButton = document.createElement("button");
    const onClick = jest.fn();
    portalButton.addEventListener("click", onClick);
    document.body.appendChild(portalButton);
    try {
      act(() => {
        result.current.markNextClickForSuppression();
        result.current.releaseSuppressionAfterTouchEnd();
        jest.advanceTimersByTime(750);
      });
      fireEvent.click(portalButton, { detail: 1 });
      expect(onClick).toHaveBeenCalledTimes(1);
    } finally {
      unmount();
      portalButton.remove();
      jest.useRealTimers();
    }
  });

  it("blocks the original hold's release on a portal but allows the next deliberate tap", () => {
    const { result } = renderHook(() => useLongPressClickSuppression());
    const portalButton = document.createElement("button");
    const onClick = jest.fn();
    portalButton.addEventListener("click", onClick);
    document.body.appendChild(portalButton);
    try {
      act(() => result.current.markNextClickForSuppression());
      fireEvent.click(portalButton, { detail: 1 });
      expect(onClick).not.toHaveBeenCalled();

      act(() => result.current.markNextClickForSuppression());
      fireEvent.pointerDown(portalButton);
      fireEvent.click(portalButton, { detail: 1 });
      expect(onClick).toHaveBeenCalledTimes(1);
    } finally {
      portalButton.remove();
    }
  });

  it("allows assistive clicks and removes the document guard on unmount", () => {
    const { result, unmount } = renderHook(() =>
      useLongPressClickSuppression()
    );
    const portalButton = document.createElement("button");
    const onClick = jest.fn();
    portalButton.addEventListener("click", onClick);
    document.body.appendChild(portalButton);
    try {
      act(() => result.current.markNextClickForSuppression());
      fireEvent.click(portalButton, { detail: 0 });
      expect(onClick).toHaveBeenCalledTimes(1);
      unmount();
      fireEvent.click(portalButton, { detail: 1 });
      expect(onClick).toHaveBeenCalledTimes(2);
    } finally {
      portalButton.remove();
    }
  });

  it("suppresses contained clicks after a long press", () => {
    const { result } = renderHook(() => useLongPressClickSuppression());
    const root = document.createElement("div");
    const child = document.createElement("button");
    root.appendChild(child);
    const event = createClickEvent({ currentTarget: root, target: child });

    act(() => {
      result.current.markNextClickForSuppression();
      result.current.handleClickCapture(event);
    });

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(event.stopPropagation).toHaveBeenCalledTimes(1);
  });

  it("allows portaled clicks after a long press", () => {
    const { result } = renderHook(() => useLongPressClickSuppression());
    const root = document.createElement("div");
    const portalButton = document.createElement("button");
    const event = createClickEvent({
      currentTarget: root,
      target: portalButton,
    });

    act(() => {
      result.current.markNextClickForSuppression();
      result.current.handleClickCapture(event);
    });

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(event.stopPropagation).not.toHaveBeenCalled();
  });
});
