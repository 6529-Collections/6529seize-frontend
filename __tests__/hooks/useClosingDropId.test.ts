import { act, renderHook } from "@testing-library/react";
import { useClosingDropId } from "@/hooks/useClosingDropId";

const runNextAnimationFrame = (
  callbacks: Map<number, FrameRequestCallback>
): void => {
  const next = callbacks.entries().next().value as
    | [number, FrameRequestCallback]
    | undefined;
  if (!next) {
    return;
  }

  const [id, callback] = next;
  callbacks.delete(id);
  callback(performance.now());
};

describe("useClosingDropId", () => {
  let frameCallbacks: Map<number, FrameRequestCallback>;
  let nextFrameId: number;
  let requestAnimationFrameSpy: jest.SpyInstance;
  let cancelAnimationFrameSpy: jest.SpyInstance;

  beforeEach(() => {
    window.history.replaceState({}, "", "/waves?drop=drop-1");
    frameCallbacks = new Map<number, FrameRequestCallback>();
    nextFrameId = 1;

    requestAnimationFrameSpy = jest
      .spyOn(window, "requestAnimationFrame")
      .mockImplementation((callback: FrameRequestCallback) => {
        const frameId = nextFrameId;
        nextFrameId += 1;
        frameCallbacks.set(frameId, callback);
        return frameId;
      });

    cancelAnimationFrameSpy = jest
      .spyOn(window, "cancelAnimationFrame")
      .mockImplementation((frameId: number) => {
        frameCallbacks.delete(frameId);
      });
  });

  afterEach(() => {
    requestAnimationFrameSpy.mockRestore();
    cancelAnimationFrameSpy.mockRestore();
  });

  it("hides immediately and allows reopening when URL settles", () => {
    const { result, rerender } = renderHook(
      ({ dropId }: { readonly dropId: string | undefined }) =>
        useClosingDropId(dropId),
      {
        initialProps: { dropId: "drop-1" },
      }
    );

    expect(result.current.effectiveDropId).toBe("drop-1");

    act(() => {
      result.current.beginClosingDrop("drop-1");
    });
    expect(result.current.effectiveDropId).toBeUndefined();

    act(() => {
      runNextAnimationFrame(frameCallbacks);
    });
    expect(result.current.effectiveDropId).toBeUndefined();

    act(() => {
      window.history.replaceState({}, "", "/waves");
      rerender({ dropId: undefined });
      runNextAnimationFrame(frameCallbacks);
    });

    act(() => {
      window.history.replaceState({}, "", "/waves?drop=drop-1");
      rerender({ dropId: "drop-1" });
    });

    expect(result.current.effectiveDropId).toBe("drop-1");
  });

  it("falls back to reopening after max settle frames when URL does not update", () => {
    const { result } = renderHook(() => useClosingDropId("drop-1"));

    act(() => {
      result.current.beginClosingDrop("drop-1");
    });
    expect(result.current.effectiveDropId).toBeUndefined();

    act(() => {
      for (let frameIndex = 0; frameIndex < 60; frameIndex += 1) {
        runNextAnimationFrame(frameCallbacks);
      }
    });

    expect(result.current.effectiveDropId).toBe("drop-1");
  });
});
