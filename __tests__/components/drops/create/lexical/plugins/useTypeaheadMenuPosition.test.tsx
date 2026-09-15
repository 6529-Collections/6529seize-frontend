import { act, renderHook } from "@testing-library/react";
import { useTypeaheadMenuPlacement } from "@/components/drops/create/lexical/plugins/useTypeaheadMenuPosition";

describe("useTypeaheadMenuPlacement", () => {
  const realViewport = window.visualViewport;
  let viewport: EventTarget & { height: number; offsetTop: number };
  let anchor: HTMLElement;
  let rect: { top: number; bottom: number };

  beforeEach(() => {
    viewport = Object.assign(new EventTarget(), { height: 568, offsetTop: 0 });
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: viewport,
    });
    rect = { top: 262, bottom: 306 };
    anchor = document.createElement("input");
    anchor.getBoundingClientRect = jest.fn(() => rect as DOMRect);
  });

  afterEach(() => {
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: realViewport,
    });
  });

  it("updates available space when the keyboard shrinks the viewport", () => {
    const { result } = renderHook(() => useTypeaheadMenuPlacement(anchor));
    act(() => window.dispatchEvent(new Event("resize")));
    expect(result.current).toEqual({
      position: "bottom",
      availableHeight: 262,
    });

    viewport.height = 300;
    rect = { top: 128, bottom: 172 };
    act(() => viewport.dispatchEvent(new Event("resize")));
    expect(result.current).toEqual({
      position: "bottom",
      availableHeight: 128,
    });

    rect = { top: 250, bottom: 294 };
    act(() => viewport.dispatchEvent(new Event("resize")));
    expect(result.current).toEqual({
      position: "top",
      availableHeight: 250,
    });
  });
});
