import { act, renderHook } from "@testing-library/react";
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
