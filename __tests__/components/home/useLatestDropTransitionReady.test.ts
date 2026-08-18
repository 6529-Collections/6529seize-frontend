import { getMintTimelineDetails } from "@/components/meme-calendar/meme-calendar.helpers";
import {
  getLatestDropTransitionTime,
  useLatestDropTransitionReady,
} from "@/components/home/now-minting/useLatestDropTransitionReady";
import { HOME_LATEST_DROP_GRACE_PERIOD_MINUTES } from "@/helpers/mint-visibility.helpers";
import { act, renderHook } from "@testing-library/react";

const MINUTE_IN_MILLISECONDS = 60_000;
const MINT_NUMBER = 536;

describe("useLatestDropTransitionReady", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("uses the shared homepage grace-period configuration", () => {
    const mintEndTime =
      getMintTimelineDetails(MINT_NUMBER).mintEndUtc.getTime();

    expect(getLatestDropTransitionTime(MINT_NUMBER)).toBe(
      mintEndTime +
        HOME_LATEST_DROP_GRACE_PERIOD_MINUTES * MINUTE_IN_MILLISECONDS
    );
  });

  it("becomes ready at the configured scheduled transition time", () => {
    const transitionTime = getLatestDropTransitionTime(MINT_NUMBER)!;
    jest.setSystemTime(transitionTime - 1);

    const { result } = renderHook(() =>
      useLatestDropTransitionReady({
        isDropComplete: true,
        mintNumber: MINT_NUMBER,
      })
    );

    expect(result.current).toBe(false);

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(result.current).toBe(true);
  });

  it("rekeys readiness when the mint number changes", () => {
    const currentTransitionTime = getLatestDropTransitionTime(MINT_NUMBER)!;
    const nextTransitionTime = getLatestDropTransitionTime(MINT_NUMBER + 1)!;
    jest.setSystemTime(currentTransitionTime);

    const { result, rerender } = renderHook(
      ({ mintNumber }) =>
        useLatestDropTransitionReady({
          isDropComplete: true,
          mintNumber,
        }),
      { initialProps: { mintNumber: MINT_NUMBER } }
    );

    act(() => {
      jest.runOnlyPendingTimers();
    });
    expect(result.current).toBe(true);

    rerender({ mintNumber: MINT_NUMBER + 1 });
    expect(result.current).toBe(false);

    act(() => {
      jest.advanceTimersByTime(nextTransitionTime - currentTransitionTime);
    });
    expect(result.current).toBe(true);
  });

  it("stays unready when no mint number is available", () => {
    const { result } = renderHook(() =>
      useLatestDropTransitionReady({
        isDropComplete: true,
        mintNumber: undefined,
      })
    );

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(result.current).toBe(false);
  });

  it("does not transition before the drop is complete", () => {
    const transitionTime = getLatestDropTransitionTime(MINT_NUMBER)!;
    jest.setSystemTime(transitionTime + MINUTE_IN_MILLISECONDS);

    const { result } = renderHook(() =>
      useLatestDropTransitionReady({
        isDropComplete: false,
        mintNumber: MINT_NUMBER,
      })
    );

    act(() => {
      jest.runOnlyPendingTimers();
    });

    expect(result.current).toBe(false);
  });

  it("rejects invalid mint numbers", () => {
    expect(getLatestDropTransitionTime(0)).toBeNull();
    expect(getLatestDropTransitionTime(Number.NaN)).toBeNull();
  });
});
