import { renderHook, act } from "@testing-library/react";
import { useCountdown } from "@/hooks/useCountdown";
import {
  LOCAL_DISPLAY_TIME_ZONE,
  type DisplayTimeZone,
} from "@/lib/display-time-zone/displayTimeZone";

let mockDisplayTimeZone: DisplayTimeZone = LOCAL_DISPLAY_TIME_ZONE;
jest.mock("@/hooks/useDisplayTimeZone", () => ({
  ...jest.requireActual("@/hooks/useDisplayTimeZone"),
  useDisplayTimeZone: () => mockDisplayTimeZone,
}));

jest.useFakeTimers();

describe("useCountdown", () => {
  let now: number;
  let nowSpy: jest.SpyInstance<number, []>;

  beforeEach(() => {
    now = 1600000000000;
    nowSpy = jest.spyOn(Date, "now").mockImplementation(() => now);
  });

  afterEach(() => {
    jest.clearAllTimers();
    nowSpy.mockRestore();
    mockDisplayTimeZone = LOCAL_DISPLAY_TIME_ZONE;
  });

  it("returns empty string when target is null", () => {
    const { result } = renderHook(() => useCountdown(null));
    expect(result.current).toBe("");
  });

  it('updates countdown over time and ends at "Now"', () => {
    const target = now + 2 * 60 * 60 * 1000; // 2 hours
    const { result } = renderHook(() => useCountdown(target));
    expect(result.current).toBe("in 2h 0m");

    // advance 5 minutes (interval < 1 day -> 5 minutes)
    act(() => {
      now += 5 * 60 * 1000;
      jest.advanceTimersByTime(5 * 60 * 1000);
    });
    expect(result.current).toBe("in 1h 55m");

    // advance past target time
    act(() => {
      now = target + 1000;
      jest.advanceTimersByTime(5 * 60 * 1000);
    });
    expect(result.current).toBe("Now");
  });

  it("dates a distant target in the display zone", () => {
    // 00:30 UTC on Sep 24 is Sep 24 in UTC but Sep 23 in Los Angeles.
    const target = Date.UTC(2020, 8, 24, 0, 30);
    const dateIn = (timeZone: string) =>
      new Date(target).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        timeZone,
      });

    mockDisplayTimeZone = { timeZone: "America/Los_Angeles", isLocal: false };
    const { result, rerender } = renderHook(() => useCountdown(target));
    expect(result.current).toBe(dateIn("America/Los_Angeles"));

    mockDisplayTimeZone = { timeZone: "UTC", isLocal: false };
    rerender();
    expect(result.current).toBe(dateIn("UTC"));
    expect(result.current).not.toBe(dateIn("America/Los_Angeles"));
  });
});
