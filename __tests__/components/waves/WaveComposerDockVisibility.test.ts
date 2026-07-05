import { act, renderHook } from "@testing-library/react";

import {
  getWaveComposerDockElements,
  registerWaveComposerDock,
  useWaveComposerDockElements,
} from "@/components/waves/WaveComposerDockVisibility";

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
});
