import { getMintTimelineDetails } from "@/components/meme-calendar/meme-calendar.helpers";
import {
  getLatestDropTransitionTime,
  useLatestDropTransitionReady,
} from "@/components/home/now-minting/useLatestDropTransitionReady";
import { HOME_LATEST_DROP_GRACE_PERIOD_MINUTES } from "@/config/home";
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

  it("becomes ready at the same scheduled transition time for every visitor", () => {
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
