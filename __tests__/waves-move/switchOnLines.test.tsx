import { render, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import WavesMoveNotice from "@/components/waves-move/WavesMoveNotice";
import { WavesMoveScope } from "@/components/waves-move/WavesMoveScope";
import { getFriendlyToastContent } from "@/helpers/toast.helpers";
import { useWaveMovedToChain } from "@/hooks/useWavesMovePhase";
import { isChainGroupNamePending } from "@/lib/waves-move/chainGroupName";
import {
  clearWavesFreeze,
  setWavesFreezeSchedule,
  WAVES_FREEZE_MS,
  WAVES_SWITCH_ON_MS,
} from "@/__tests__/helpers/wavesFreeze";

jest.mock("@/config/env", () => {
  const actual = jest.requireActual("@/config/env");
  return {
    ...actual,
    get publicEnv() {
      return {
        ...actual.publicEnv,
        ...(globalThis as { __wavesFreeze?: object }).__wavesFreeze,
      };
    },
  };
});

const HOUR = 60 * 60 * 1000;

const inWave =
  (staysOnSite: boolean | undefined) =>
  ({ children }: { children: ReactNode }) => (
    <WavesMoveScope
      wave={
        staysOnSite === undefined
          ? { id: "w1" }
          : { id: "w1", stays_on_site: staysOnSite }
      }
      waveId="w1"
    >
      {children}
    </WavesMoveScope>
  );

describe("toasts about the 6529 Network", () => {
  it("show the sentence as it is, never as a connection error", () => {
    expect(
      getFriendlyToastContent({
        message:
          "This group is used by a wave that moved to the 6529 Network, so it can't be hidden or shown here.",
        type: "error",
      })
    ).toEqual({
      title:
        "This group is used by a wave that moved to the 6529 Network, so it can't be hidden or shown here.",
    });
  });

  it("give the site's own line for a change refused because its wave moved", () => {
    expect(
      getFriendlyToastContent({
        message:
          "This wave moved to the 6529 Network, so this change is made there now, not through this route.",
        type: "error",
      })
    ).toEqual({
      title:
        "This wave moved to the 6529 Network, so this change can't be made on this site.",
    });
  });

  it("still read a plain network failure as one", () => {
    expect(
      getFriendlyToastContent({
        message: "Network request failed",
        type: "error",
      })?.title
    ).toBe("Network error.");
  });
});

describe("isChainGroupNamePending", () => {
  const chainId = `0x${"ab12".repeat(16)}`;

  it("knows 6529.io's placeholder name for a group made on the 6529 Network", () => {
    expect(
      isChainGroupNamePending({ id: chainId, name: "Group 0xab12ab12" })
    ).toBe(true);
  });

  it("leaves a real name alone", () => {
    expect(isChainGroupNamePending({ id: chainId, name: "Meme holders" })).toBe(
      false
    );
  });

  it("never takes a 6529.io group named like the placeholder for one", () => {
    expect(
      isChainGroupNamePending({
        id: "1d8e6c4f-55a3-4f6e-9b7b-2c1d0e9f8a7b",
        name: "Group 0x1d8e6c4f",
      })
    ).toBe(false);
    expect(
      isChainGroupNamePending({
        id: `0x${"AB12".repeat(16)}`,
        name: "Group 0xAB12AB12",
      })
    ).toBe(false);
    expect(isChainGroupNamePending(null)).toBe(false);
  });
});

describe("useWaveMovedToChain", () => {
  beforeEach(() => setWavesFreezeSchedule());
  afterEach(() => {
    jest.useRealTimers();
    clearWavesFreeze();
  });

  const moved = (wrapper?: (props: { children: ReactNode }) => ReactNode) =>
    renderHook(() => useWaveMovedToChain(), { wrapper }).result.current;

  it("holds only from the switch-on, in a wave that moves", () => {
    jest.useFakeTimers({ now: WAVES_SWITCH_ON_MS - HOUR });
    expect(moved(inWave(false))).toBe(false);
    jest.setSystemTime(WAVES_SWITCH_ON_MS + HOUR);
    expect(moved(inWave(false))).toBe(true);
  });

  it("never holds in a wave that stays, doesn't say, or outside any wave", () => {
    jest.useFakeTimers({ now: WAVES_SWITCH_ON_MS + HOUR });
    expect(moved(inWave(true))).toBe(false);
    expect(moved(inWave(undefined))).toBe(false);
    expect(moved()).toBe(false);
  });

  it("falls back to the wave around when the wave passed doesn't say", () => {
    jest.useFakeTimers({ now: WAVES_SWITCH_ON_MS + HOUR });
    expect(
      renderHook(() => useWaveMovedToChain({ id: "w1" }), {
        wrapper: inWave(false),
      }).result.current
    ).toBe(true);
    expect(
      renderHook(() => useWaveMovedToChain({ id: "w1" })).result.current
    ).toBe(false);
  });

  it("reads a wave passed to it instead of the one around", () => {
    jest.useFakeTimers({ now: WAVES_SWITCH_ON_MS + HOUR });
    expect(
      renderHook(() => useWaveMovedToChain({ stays_on_site: false })).result
        .current
    ).toBe(true);
    expect(
      renderHook(() => useWaveMovedToChain({ stays_on_site: true }), {
        wrapper: inWave(false),
      }).result.current
    ).toBe(false);
  });
});

describe("the notice after the switch-on", () => {
  beforeEach(() => setWavesFreezeSchedule());
  afterEach(() => {
    jest.useRealTimers();
    clearWavesFreeze();
    localStorage.clear();
  });

  it("says waves and decisions made elsewhere show once their documents arrive", () => {
    jest.useFakeTimers({ now: WAVES_SWITCH_ON_MS + HOUR });
    render(<WavesMoveNotice />, { wrapper: inWave(false) });
    expect(screen.getByTestId("waves-move-notice")).toHaveTextContent(
      "Chat keeps working. Waves and decisions made outside 6529.io show here once their documents reach the 6529 Network."
    );
  });

  it("doesn't say so before the switch-on", () => {
    jest.useFakeTimers({ now: WAVES_FREEZE_MS + HOUR });
    render(<WavesMoveNotice />, { wrapper: inWave(false) });
    expect(screen.getByTestId("waves-move-notice")).not.toHaveTextContent(
      "documents"
    );
  });
});
