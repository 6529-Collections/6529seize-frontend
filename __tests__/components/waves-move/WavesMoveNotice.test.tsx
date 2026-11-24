import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { renderToString } from "react-dom/server";
import WavesMoveNotice from "@/components/waves-move/WavesMoveNotice";
import {
  useWavesMovePhase,
  useWavesPausedReason,
  useWavesWritesPaused,
} from "@/hooks/useWavesMovePhase";
import {
  clearWavesFreeze,
  setWavesFreeze,
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
        ...(globalThis as { __chainWaves?: object }).__chainWaves,
      };
    },
  };
});

const HOUR = 60 * 60 * 1000;

describe("WavesMoveNotice", () => {
  afterEach(() => {
    clearWavesFreeze();
    jest.useRealTimers();
    localStorage.clear();
  });

  it("renders nothing without a schedule", () => {
    jest.useFakeTimers({ now: WAVES_FREEZE_MS - HOUR });
    const { container } = render(<WavesMoveNotice />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when the switch-on is missing", () => {
    setWavesFreeze("2026-11-25T00:00:00Z", undefined);
    jest.useFakeTimers({ now: WAVES_FREEZE_MS - HOUR });
    const { container } = render(<WavesMoveNotice />);
    expect(container.firstChild).toBeNull();
  });

  it("gives the notice before the freeze", () => {
    setWavesFreezeSchedule();
    jest.useFakeTimers({ now: WAVES_FREEZE_MS - HOUR });
    render(<WavesMoveNotice />);
    expect(
      screen.getByRole("region", { name: "Waves move to the 6529 Network" })
    ).toHaveTextContent(
      "Votes, entries and wave settings move to the 6529 Network. From Wednesday 00:00 UTC you can't change them until Thursday 00:00 UTC. Chat keeps working."
    );
  });

  it("renders nothing on the server, so hydration always matches", () => {
    setWavesFreezeSchedule();
    jest.useFakeTimers({ now: WAVES_FREEZE_MS + HOUR });
    expect(renderToString(<WavesMoveNotice />)).toBe("");
  });

  it("changes at the freeze and at the switch-on while the page is open", () => {
    setWavesFreezeSchedule();
    jest.useFakeTimers({ now: WAVES_FREEZE_MS - 1000 });
    render(<WavesMoveNotice />);
    expect(screen.getByTestId("waves-move-notice")).toHaveTextContent(
      "From Wednesday 00:00 UTC"
    );

    act(() => {
      jest.advanceTimersByTime(1001);
    });
    expect(screen.getByTestId("waves-move-notice")).toHaveTextContent(
      "Votes, entries and wave settings are moving to the 6529 Network. You can't change them until Thursday 00:00 UTC. Chat keeps working."
    );

    act(() => {
      jest.advanceTimersByTime(WAVES_SWITCH_ON_MS - WAVES_FREEZE_MS);
    });
    expect(screen.getByTestId("waves-move-notice")).toHaveTextContent(
      "Votes, entries and wave settings moved to the 6529 Network on Thursday 26 November. You can't change them on this site yet. Chat keeps working."
    );
  });

  it("hides until the next phase when the viewer hides it", () => {
    setWavesFreezeSchedule();
    jest.useFakeTimers({ now: WAVES_FREEZE_MS - 1000 });
    const { unmount } = render(<WavesMoveNotice />);
    fireEvent.click(screen.getByRole("button", { name: "Hide this notice" }));
    expect(screen.queryByTestId("waves-move-notice")).toBeNull();

    unmount();
    render(<WavesMoveNotice />);
    expect(screen.queryByTestId("waves-move-notice")).toBeNull();

    act(() => {
      jest.advanceTimersByTime(1001);
    });
    expect(screen.getByTestId("waves-move-notice")).toHaveTextContent(
      "You can't change them until Thursday 00:00 UTC."
    );
  });
});

describe("useWavesMovePhase", () => {
  afterEach(() => {
    clearWavesFreeze();
    jest.useRealTimers();
  });

  it("is none and open without a schedule", () => {
    const { result } = renderHook(() => ({
      phase: useWavesMovePhase(),
      paused: useWavesWritesPaused(),
      reason: useWavesPausedReason(),
    }));
    expect(result.current).toEqual({
      phase: "none",
      paused: false,
      reason: null,
    });
  });

  it("pauses at the freeze for every subscriber on one timer", () => {
    setWavesFreezeSchedule();
    jest.useFakeTimers({ now: WAVES_FREEZE_MS - 1000 });
    const first = renderHook(() => useWavesWritesPaused());
    const second = renderHook(() => useWavesPausedReason());
    expect(first.result.current).toBe(false);
    expect(second.result.current).toBeNull();
    expect(jest.getTimerCount()).toBe(1);

    act(() => {
      jest.advanceTimersByTime(1001);
    });
    expect(first.result.current).toBe(true);
    expect(second.result.current).toBe(
      "Paused for the move to the 6529 Network."
    );

    first.unmount();
    second.unmount();
    expect(jest.getTimerCount()).toBe(0);
  });
});

describe("useWavesMovePhase after a suspended tab returns", () => {
  afterEach(() => {
    clearWavesFreeze();
    jest.useRealTimers();
  });

  it("rereads the phase when the page becomes visible", () => {
    setWavesFreezeSchedule();
    jest.useFakeTimers({ now: WAVES_FREEZE_MS - 1000 });
    const { result } = renderHook(() => useWavesWritesPaused());
    expect(result.current).toBe(false);

    // The timer never ran (a suspended app), but the clock moved on.
    jest.setSystemTime(WAVES_FREEZE_MS + HOUR);
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(result.current).toBe(true);
  });
});

describe("WavesMoveNotice with the chain flows on", () => {
  afterEach(() => {
    clearWavesFreeze();
    (globalThis as { __chainWaves?: object }).__chainWaves = {};
    jest.useRealTimers();
  });

  it("says votes, ballots and wave REP go to the 6529 Network after the switch-on", () => {
    (globalThis as { __chainWaves?: object }).__chainWaves = {
      NEXT_PUBLIC_FEATURE_CHAIN_WAVES: "true",
      NEXT_PUBLIC_CHAIN_GATEWAY_URL: "https://gateway.example.test",
      NEXT_PUBLIC_CHAIN_NETWORK_ID: `0x${"ab".repeat(32)}`,
    };
    setWavesFreezeSchedule();
    jest.useFakeTimers({ now: WAVES_SWITCH_ON_MS + HOUR });
    render(<WavesMoveNotice />);
    expect(screen.getByTestId("waves-move-notice")).toHaveTextContent(
      "Votes, entries and wave settings moved to the 6529 Network on Thursday 26 November. Your votes, poll ballots and wave REP go there from this site. Entries and wave settings can't be changed here yet. Chat keeps working."
    );
  });
});
