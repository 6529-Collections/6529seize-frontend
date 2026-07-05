import { act, renderHook } from "@testing-library/react";

import {
  getWaveComposerDockElements,
  isAnyDockInsideRightEdgeClearance,
  registerWaveComposerDock,
  useWaveComposerDockElements,
} from "@/components/waves/WaveComposerDockVisibility";

const elementWithRect = (rect: Partial<DOMRect>): HTMLElement => {
  const element = document.createElement("div");
  element.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      width: 0,
      height: 0,
      toJSON: () => ({}),
      ...rect,
    }) as DOMRect;
  return element;
};

describe("WaveComposerDockVisibility", () => {
  it("tracks docked elements and ignores duplicate unregisters", () => {
    const { result } = renderHook(() => useWaveComposerDockElements());
    expect(result.current).toEqual([]);

    const firstElement = document.createElement("div");
    const secondElement = document.createElement("div");

    let unregisterFirst: (() => void) | undefined;
    let unregisterSecond: (() => void) | undefined;
    act(() => {
      unregisterFirst = registerWaveComposerDock(firstElement);
      unregisterSecond = registerWaveComposerDock(secondElement);
    });
    expect(result.current).toEqual([firstElement, secondElement]);
    expect(getWaveComposerDockElements()).toEqual([
      firstElement,
      secondElement,
    ]);

    act(() => {
      unregisterFirst?.();
      unregisterFirst?.();
    });
    expect(result.current).toEqual([secondElement]);

    act(() => {
      unregisterSecond?.();
    });
    expect(result.current).toEqual([]);
    expect(getWaveComposerDockElements()).toEqual([]);
  });

  describe("isAnyDockInsideRightEdgeClearance", () => {
    const viewportWidth = 1280;
    const clearancePx = 88;

    beforeEach(() => {
      Object.defineProperty(globalThis.window, "innerWidth", {
        configurable: true,
        value: viewportWidth,
      });
    });

    it("flags a dock whose right edge is inside the clearance strip", () => {
      const covering = elementWithRect({
        width: 1000,
        height: 60,
        right: viewportWidth - clearancePx + 1,
      });
      expect(isAnyDockInsideRightEdgeClearance([covering], clearancePx)).toBe(
        true
      );
    });

    it("ignores docks that stop at or before the clearance boundary", () => {
      const clear = elementWithRect({
        width: 1000,
        height: 60,
        right: viewportWidth - clearancePx,
      });
      expect(isAnyDockInsideRightEdgeClearance([clear], clearancePx)).toBe(
        false
      );
    });

    it("ignores zero-size docks such as a collapsed drop-chat panel", () => {
      const collapsed = elementWithRect({
        width: 0,
        height: 0,
        right: viewportWidth,
      });
      expect(
        isAnyDockInsideRightEdgeClearance([collapsed], clearancePx)
      ).toBe(false);
    });

    it("returns false with no docks registered", () => {
      expect(isAnyDockInsideRightEdgeClearance([], clearancePx)).toBe(false);
    });
  });
});
