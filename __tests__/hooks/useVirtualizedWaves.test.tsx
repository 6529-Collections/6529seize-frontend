import React from "react";
import { renderHook, act } from "@testing-library/react";
import { useVirtualizedWaves } from "@/hooks/useVirtualizedWaves";
import { ScrollPositionProvider } from "@/contexts/ScrollPositionContext";

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ScrollPositionProvider>{children}</ScrollPositionProvider>
);

describe("useVirtualizedWaves", () => {
  it("calculates virtual items and updates scroll position", () => {
    const scrollContainer = document.createElement("div");
    Object.defineProperty(scrollContainer, "clientHeight", { value: 100 });
    const listContainer = document.createElement("div");
    Object.defineProperty(listContainer, "offsetTop", { value: 0 });
    const items = Array.from({ length: 10 }, (_, i) => i);
    const scrollRef = {
      current: scrollContainer,
    } as React.RefObject<HTMLDivElement>;
    const listRef = {
      current: listContainer,
    } as React.RefObject<HTMLDivElement>;

    const { result, rerender } = renderHook(
      () =>
        useVirtualizedWaves({
          items,
          key: "k",
          scrollContainerRef: scrollRef,
          listContainerRef: listRef,
          rowHeight: 50,
          overscan: 0,
        }),
      { wrapper }
    );
    expect(result.current.totalHeight).toBe(10 * 50 + 40);
    expect(result.current.virtualItems.length).toBe(3);

    act(() => {
      scrollContainer.scrollTop = 120;
      scrollContainer.dispatchEvent(new Event("scroll"));
    });

    // Rerender the same hook to get updated state
    rerender();
    expect(result.current.virtualItems[0]?.index).toBe(2); // start index advanced
  });

  it("supports per-item row heights", () => {
    const scrollContainer = document.createElement("div");
    Object.defineProperty(scrollContainer, "clientHeight", { value: 100 });
    const listContainer = document.createElement("div");
    Object.defineProperty(listContainer, "offsetTop", { value: 0 });
    const items = [
      { id: "parent", size: 62 },
      { id: "child-1", size: 54 },
      { id: "child-2", size: 54 },
    ];
    const scrollRef = {
      current: scrollContainer,
    } as React.RefObject<HTMLDivElement>;
    const listRef = {
      current: listContainer,
    } as React.RefObject<HTMLDivElement>;

    const { result } = renderHook(
      () =>
        useVirtualizedWaves({
          items,
          key: "variable",
          scrollContainerRef: scrollRef,
          listContainerRef: listRef,
          rowHeight: (item) => item.size,
          overscan: 0,
        }),
      { wrapper }
    );

    expect(result.current.totalHeight).toBe(62 + 54 + 54 + 40);
    expect(result.current.virtualItems.slice(0, 2)).toEqual([
      { index: 0, start: 0, size: 62 },
      { index: 1, start: 62, size: 54 },
    ]);
  });

  it("binds scrolling when the scroll container ref is assigned after mount", () => {
    jest.useFakeTimers();
    const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
    const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;
    globalThis.requestAnimationFrame = undefined as never;
    globalThis.cancelAnimationFrame = undefined as never;

    try {
      const scrollContainer = document.createElement("div");
      Object.defineProperty(scrollContainer, "clientHeight", { value: 100 });
      const listContainer = document.createElement("div");
      Object.defineProperty(listContainer, "offsetTop", { value: 0 });
      const items = Array.from({ length: 10 }, (_, i) => i);
      const scrollRef: { current: HTMLDivElement | null } = {
        current: null,
      };
      const listRef: { current: HTMLDivElement | null } = {
        current: listContainer,
      };

      const { result, rerender } = renderHook(
        () =>
          useVirtualizedWaves({
            items,
            key: "late-container",
            scrollContainerRef: scrollRef,
            listContainerRef: listRef,
            rowHeight: 50,
            overscan: 0,
          }),
        { wrapper }
      );

      expect(result.current.virtualItems).toEqual([
        { index: 10, start: 500, size: 40 },
      ]);

      scrollRef.current = scrollContainer;
      act(() => {
        jest.advanceTimersByTime(16);
      });
      rerender();
      expect(result.current.virtualItems.length).toBe(3);

      act(() => {
        scrollContainer.scrollTop = 120;
        scrollContainer.dispatchEvent(new Event("scroll"));
      });

      rerender();
      expect(result.current.virtualItems[0]?.index).toBe(2);
    } finally {
      globalThis.requestAnimationFrame = originalRequestAnimationFrame;
      globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
      jest.useRealTimers();
    }
  });
});
