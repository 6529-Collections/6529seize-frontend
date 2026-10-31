import { act, renderHook } from "@testing-library/react";
import { useHoverIntent } from "@/hooks/useHoverIntent";

describe("useHoverIntent", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("runs the action once the default intent delay has elapsed", () => {
    const action = jest.fn();
    const { result } = renderHook(() => useHoverIntent());

    act(() => result.current.schedule(action));
    act(() => {
      jest.advanceTimersByTime(149);
    });
    expect(action).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(action).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("drops the pending action when cancelled", () => {
    const action = jest.fn();
    const { result } = renderHook(() => useHoverIntent());

    act(() => result.current.schedule(action));
    act(() => result.current.cancel());
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(action).not.toHaveBeenCalled();
  });

  it("only runs the latest action when scheduled again", () => {
    const first = jest.fn();
    const second = jest.fn();
    const { result } = renderHook(() => useHoverIntent());

    act(() => result.current.schedule(first));
    act(() => {
      jest.advanceTimersByTime(100);
    });
    act(() => result.current.schedule(second));
    act(() => {
      jest.advanceTimersByTime(150);
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("drops the pending action on unmount", () => {
    const action = jest.fn();
    const { result, unmount } = renderHook(() => useHoverIntent());

    act(() => result.current.schedule(action));
    unmount();
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(action).not.toHaveBeenCalled();
  });

  it("supports a custom delay", () => {
    const action = jest.fn();
    const { result } = renderHook(() => useHoverIntent(40));

    act(() => result.current.schedule(action));
    act(() => {
      jest.advanceTimersByTime(40);
    });

    expect(action).toHaveBeenCalledTimes(1);
  });
});
