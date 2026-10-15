import { renderHook, act } from "@testing-library/react";
import { useWaveLoadingState } from "@/contexts/wave/hooks/useWaveLoadingState";

describe("useWaveLoadingState", () => {
  it("does not reuse an old profile request after switching accounts", () => {
    const { result } = renderHook(() => useWaveLoadingState());
    act(() => {
      result.current.getLoadingState("w1");
      result.current.setLoadingState("w1", true);
      result.current.setPromise("w1", Promise.resolve(null));
      globalThis.dispatchEvent(new CustomEvent("6529-profile-switched"));
    });
    expect(result.current.getLoadingState("w1")).toEqual({
      state: { isLoading: false, promise: null },
      shouldContinue: true,
    });
  });

  it("initializes state and determines continuation", () => {
    const { result } = renderHook(() => useWaveLoadingState());
    const res = result.current.getLoadingState("w1");
    expect(res.state).toEqual({ isLoading: false, promise: null });
    expect(res.shouldContinue).toBe(true);
  });

  it("updates loading state and clears promise", () => {
    const { result } = renderHook(() => useWaveLoadingState());
    act(() => {
      result.current.getLoadingState("w1");
      result.current.setPromise("w1", Promise.resolve(null));
      result.current.setLoadingState("w1", true);
    });
    expect(result.current.loadingStates.current["w1"]?.isLoading).toBe(true);
    expect(result.current.loadingStates.current["w1"]?.promise).not.toBeNull();

    act(() => {
      result.current.setLoadingState("w1", false);
    });
    expect(result.current.loadingStates.current["w1"]).toEqual({
      isLoading: false,
      promise: null,
    });
  });

  it("getLoadingState returns shouldContinue false when already loading", () => {
    const { result } = renderHook(() => useWaveLoadingState());
    act(() => {
      result.current.getLoadingState("w1");
      result.current.setPromise("w1", Promise.resolve(null));
      result.current.setLoadingState("w1", true);
    });
    const res = result.current.getLoadingState("w1");
    expect(res.shouldContinue).toBe(false);
  });

  it("clearLoadingState releases the wave entry so the next load starts fresh", () => {
    const { result } = renderHook(() => useWaveLoadingState());
    act(() => {
      result.current.getLoadingState("w1");
      result.current.setPromise("w1", Promise.resolve(null));
      result.current.setLoadingState("w1", true);
      result.current.clearLoadingState("w1");
    });
    expect(result.current.loadingStates.current["w1"]).toBeUndefined();
    expect(result.current.getLoadingState("w1")).toEqual({
      state: { isLoading: false, promise: null },
      shouldContinue: true,
    });
  });
});
