import { renderHook, act } from "@testing-library/react";
import { useWaveTimers } from "@/hooks/useWaveTimers";

function setVisibility(value: DocumentVisibilityState) {
  act(() => {
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
}

describe("useWaveTimers", () => {
  beforeEach(() => {
    setVisibility("visible");
    jest.useFakeTimers().setSystemTime(new Date(0));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const baseWave = {
    participation: { period: { min: 1000, max: 2000 } },
    voting: { period: { min: 3000, max: 4000 } },
    wave: {
      decisions_strategy: {
        first_decision_time: 3100,
        subsequent_decisions: [],
        is_rolling: false,
      },
    },
  } as any;

  it("computes initial upcoming phases", () => {
    const { result } = renderHook(() => useWaveTimers(baseWave));
    expect(result.current.participation.isUpcoming).toBe(true);
    expect(result.current.voting.isUpcoming).toBe(true);
    expect(result.current.decisions.firstDecisionDone).toBe(false);
  });

  it("updates phases over time", () => {
    const { result } = renderHook(() => useWaveTimers(baseWave));
    act(() => {
      jest.setSystemTime(new Date(5000));
      jest.advanceTimersByTime(5000);
    });
    expect(result.current.participation.isCompleted).toBe(true);
    expect(result.current.voting.isCompleted).toBe(true);
  });

  it("stops timers in the background and immediately catches up on resume", () => {
    const { result } = renderHook(() => useWaveTimers(baseWave));
    // One shared timer drives participation, voting and decision updates.
    expect(jest.getTimerCount()).toBe(1);
    setVisibility("hidden");
    expect(jest.getTimerCount()).toBe(0);
    act(() => jest.advanceTimersByTime(5000));
    // Hidden pages keep their last value until they are shown again.
    expect(result.current.participation.isUpcoming).toBe(true);
    setVisibility("visible");
    expect(result.current.participation.isCompleted).toBe(true);
    expect(result.current.voting.isCompleted).toBe(true);
    expect(result.current.decisions.firstDecisionDone).toBe(true);
  });
});
