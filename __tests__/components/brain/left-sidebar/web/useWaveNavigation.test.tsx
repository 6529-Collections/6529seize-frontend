import { act, renderHook } from "@testing-library/react";
import type { MouseEvent } from "react";
import { useWaveNavigation } from "@/components/brain/left-sidebar/web/WebBrainLeftSidebarWave/hooks/useWaveNavigation";

const clickEvent = (overrides: Partial<MouseEvent<HTMLAnchorElement>> = {}) =>
  ({
    defaultPrevented: false,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    button: 0,
    preventDefault: jest.fn(),
    ...overrides,
  }) as unknown as MouseEvent<HTMLAnchorElement>;

const setup = (
  overrides: Partial<Parameters<typeof useWaveNavigation>[0]> = {}
) => {
  const onHover = jest.fn();
  const prefetchWaveData = jest.fn();
  const setActiveWave = jest.fn();
  const { result } = renderHook(() =>
    useWaveNavigation({
      basePath: "/waves",
      activeWaveId: "other-wave",
      setActiveWave,
      onHover,
      prefetchWaveData,
      pathname: "/waves",
      searchParams: null,
      waveId: "wave-1",
      hasTouchScreen: false,
      ...overrides,
    })
  );
  return { result, onHover, prefetchWaveData, setActiveWave };
};

describe("useWaveNavigation hover prefetch", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("prefetches only after the pointer rests on the row", () => {
    const { result, onHover, prefetchWaveData } = setup();

    act(() => result.current.onMouseEnter?.());
    act(() => {
      jest.advanceTimersByTime(149);
    });
    expect(onHover).not.toHaveBeenCalled();
    expect(prefetchWaveData).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(onHover).toHaveBeenCalledWith("wave-1");
    expect(prefetchWaveData).toHaveBeenCalledWith("wave-1");
  });

  it("does not prefetch when the pointer leaves before the delay", () => {
    const { result, onHover, prefetchWaveData } = setup();

    act(() => result.current.onMouseEnter?.());
    act(() => result.current.onMouseLeave?.());
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onHover).not.toHaveBeenCalled();
    expect(prefetchWaveData).not.toHaveBeenCalled();
  });

  it("does not prefetch the already active wave", () => {
    const { result, onHover, prefetchWaveData } = setup({
      activeWaveId: "wave-1",
    });

    act(() => result.current.onMouseEnter?.());
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(onHover).not.toHaveBeenCalled();
    expect(prefetchWaveData).not.toHaveBeenCalled();
  });

  it("prefetches immediately on click and drops the pending hover prefetch", () => {
    const onOpen = jest.fn();
    const { result, onHover, prefetchWaveData, setActiveWave } = setup({
      onOpen,
    });

    act(() => result.current.onMouseEnter?.());
    act(() => result.current.onClick(clickEvent()));

    expect(prefetchWaveData).toHaveBeenCalledTimes(1);
    expect(onHover).toHaveBeenCalledTimes(1);
    expect(onOpen).toHaveBeenCalledWith("wave-1");
    expect(setActiveWave).toHaveBeenCalledWith(
      "wave-1",
      expect.objectContaining({ isDirectMessage: false })
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });
    expect(prefetchWaveData).toHaveBeenCalledTimes(1);
    expect(onHover).toHaveBeenCalledTimes(1);
  });

  it("keeps modified clicks available for new-tab navigation", () => {
    const onOpen = jest.fn();
    const { result, setActiveWave } = setup({ onOpen });
    const event = clickEvent({ metaKey: true });

    act(() => result.current.onClick(event));

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(onOpen).not.toHaveBeenCalled();
    expect(setActiveWave).not.toHaveBeenCalled();
  });

  it("does not expose hover handlers on touch screens", () => {
    const { result } = setup({ hasTouchScreen: true });

    expect(result.current.onMouseEnter).toBeUndefined();
    expect(result.current.onMouseLeave).toBeUndefined();
  });
});
