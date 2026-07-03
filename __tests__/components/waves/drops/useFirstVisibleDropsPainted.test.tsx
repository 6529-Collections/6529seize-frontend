import { act, renderHook } from "@testing-library/react";

import { useFirstVisibleDropsPainted } from "@/components/waves/drops/wave-drops-all/hooks/useFirstVisibleDropsPainted";

const flushPaintGate = () => {
  act(() => {
    jest.runOnlyPendingTimers();
  });
  act(() => {
    jest.runOnlyPendingTimers();
  });
};

describe("useFirstVisibleDropsPainted", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("waits for a frame and timeout after visible drops appear", () => {
    const requestAnimationFrame = jest.fn<
      ReturnType<typeof window.setTimeout>,
      [FrameRequestCallback]
    >((callback) =>
      window.setTimeout(() => {
        callback(performance.now());
      }, 16)
    );
    const cancelAnimationFrame = jest.fn<
      void,
      [ReturnType<typeof window.setTimeout>]
    >((id) => {
      window.clearTimeout(id);
    });
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: requestAnimationFrame,
    });
    Object.defineProperty(window, "cancelAnimationFrame", {
      configurable: true,
      value: cancelAnimationFrame,
    });

    try {
      const { result, rerender } = renderHook(
        ({ hasVisibleDrops }) => useFirstVisibleDropsPainted(hasVisibleDrops),
        { initialProps: { hasVisibleDrops: false } }
      );

      expect(result.current).toBe(false);

      rerender({ hasVisibleDrops: true });

      expect(result.current).toBe(false);
      expect(requestAnimationFrame).toHaveBeenCalledTimes(1);

      flushPaintGate();

      expect(result.current).toBe(true);
    } finally {
      Object.defineProperty(window, "requestAnimationFrame", {
        configurable: true,
        value: originalRequestAnimationFrame,
      });
      Object.defineProperty(window, "cancelAnimationFrame", {
        configurable: true,
        value: originalCancelAnimationFrame,
      });
    }
  });

  it("uses a timeout fallback when requestAnimationFrame is unavailable", () => {
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(window, "cancelAnimationFrame", {
      configurable: true,
      value: undefined,
    });

    try {
      const { result } = renderHook(() => useFirstVisibleDropsPainted(true));

      expect(result.current).toBe(false);

      flushPaintGate();

      expect(result.current).toBe(true);
    } finally {
      Object.defineProperty(window, "requestAnimationFrame", {
        configurable: true,
        value: originalRequestAnimationFrame,
      });
      Object.defineProperty(window, "cancelAnimationFrame", {
        configurable: true,
        value: originalCancelAnimationFrame,
      });
    }
  });

  it("cleans up scheduled work after unmount", () => {
    const requestAnimationFrame = jest.fn<
      ReturnType<typeof window.setTimeout>,
      [FrameRequestCallback]
    >((callback) =>
      window.setTimeout(() => {
        callback(performance.now());
      }, 16)
    );
    const cancelAnimationFrame = jest.fn<
      void,
      [ReturnType<typeof window.setTimeout>]
    >((id) => {
      window.clearTimeout(id);
    });
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: requestAnimationFrame,
    });
    Object.defineProperty(window, "cancelAnimationFrame", {
      configurable: true,
      value: cancelAnimationFrame,
    });

    try {
      const { unmount } = renderHook(() => useFirstVisibleDropsPainted(true));

      unmount();

      expect(cancelAnimationFrame).toHaveBeenCalledTimes(1);
    } finally {
      Object.defineProperty(window, "requestAnimationFrame", {
        configurable: true,
        value: originalRequestAnimationFrame,
      });
      Object.defineProperty(window, "cancelAnimationFrame", {
        configurable: true,
        value: originalCancelAnimationFrame,
      });
    }
  });
});
