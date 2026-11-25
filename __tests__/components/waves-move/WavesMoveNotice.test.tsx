import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import { renderToString } from "react-dom/server";
import WavesMoveNotice from "@/components/waves-move/WavesMoveNotice";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ReactNode } from "react";
import { WavesMoveScope } from "@/components/waves-move/WavesMoveScope";
import {
  usePollClosedByMove,
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

  it("says votes, ballots, wave REP and entries go to the 6529 Network after the switch-on", () => {
    (globalThis as { __chainWaves?: object }).__chainWaves = {
      NEXT_PUBLIC_FEATURE_CHAIN_WAVES: "true",
      NEXT_PUBLIC_CHAIN_GATEWAY_URL: "https://gateway.example.test",
      NEXT_PUBLIC_CHAIN_NETWORK_ID: `0x${"ab".repeat(32)}`,
    };
    setWavesFreezeSchedule();
    jest.useFakeTimers({ now: WAVES_SWITCH_ON_MS + HOUR });
    render(<WavesMoveNotice />);
    expect(screen.getByTestId("waves-move-notice")).toHaveTextContent(
      "Votes, entries and wave settings moved to the 6529 Network on Thursday 26 November. Your votes, poll ballots, wave REP and entries go there from this site. Wave settings can't be changed here yet. Chat keeps working."
    );
  });
});

describe("a result due while waves are frozen", () => {
  const DAY = 24 * HOUR;
  // Results on the days `steps` lead to, at 16:00 UTC, rolling from Monday
  // 2 November.
  const waveWith = (steps: number[]) =>
    ({
      wave: {
        decisions_strategy: {
          first_decision_time: Date.UTC(2026, 10, 2, 16),
          subsequent_decisions: steps,
          is_rolling: true,
        },
      },
      voting: { period: null },
      pauses: [],
    }) as unknown as ApiWave;
  // Monday, Wednesday and Friday.
  const mainStage = waveWith([2 * DAY, 2 * DAY, 3 * DAY]);
  const SENTENCE =
    "The result due Wednesday 16:00 UTC is counted on the 6529 Network after Thursday 00:00 UTC.";

  afterEach(() => {
    clearWavesFreeze();
    jest.restoreAllMocks();
    jest.useRealTimers();
    localStorage.clear();
  });

  it("says the 6529 Network counts it after the switch-on, from the time it is due", () => {
    setWavesFreezeSchedule();
    // Wednesday 15:00 UTC: frozen, the 16:00 result not yet due.
    jest.useFakeTimers({ now: WAVES_FREEZE_MS + 15 * HOUR });
    render(<WavesMoveNotice wave={mainStage} />);
    const notice = screen.getByTestId("waves-move-notice");
    expect(notice).not.toHaveTextContent("The result due");

    act(() => {
      jest.advanceTimersByTime(HOUR + 1);
    });
    expect(notice).toHaveTextContent(
      `You can't change them until Thursday 00:00 UTC. Chat keeps working. ${SENTENCE}`
    );
  });

  it("still adds it when the clock reads a little early at the result time", () => {
    setWavesFreezeSchedule();
    jest.useFakeTimers({ now: WAVES_FREEZE_MS + 15 * HOUR });
    render(<WavesMoveNotice wave={mainStage} />);
    // The clock steps back 5 ms once the timer is set, so it reads early
    // when the timer fires.
    jest.setSystemTime(Date.now() - 5);
    act(() => {
      jest.advanceTimersByTime(HOUR + 1);
    });
    act(() => {
      jest.advanceTimersByTime(10);
    });
    expect(screen.getByTestId("waves-move-notice")).toHaveTextContent(SENTENCE);
  });

  it("adds it when a page suspended across the result time is seen again", () => {
    setWavesFreezeSchedule();
    jest.useFakeTimers({ now: WAVES_FREEZE_MS + 15 * HOUR });
    render(<WavesMoveNotice wave={mainStage} />);
    // A suspended tab runs no timers: the clock moves on without them.
    jest.setSystemTime(WAVES_FREEZE_MS + 17 * HOUR);
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(screen.getByTestId("waves-move-notice")).toHaveTextContent(SENTENCE);
  });

  it("says nothing for a wave whose last result came before the freeze", () => {
    setWavesFreezeSchedule();
    jest.useFakeTimers({ now: WAVES_FREEZE_MS + 17 * HOUR });
    // Mondays only.
    render(<WavesMoveNotice wave={waveWith([7 * DAY])} />);
    expect(screen.getByTestId("waves-move-notice")).not.toHaveTextContent(
      "The result due"
    );
  });

  it("stays hidden elsewhere once hidden with the sentence, and shows the sentence once only the plain notice was hidden", () => {
    setWavesFreezeSchedule();
    jest.useFakeTimers({ now: WAVES_FREEZE_MS + 17 * HOUR });
    const mainStageView = render(<WavesMoveNotice wave={mainStage} />);
    fireEvent.click(screen.getByRole("button", { name: "Hide this notice" }));
    mainStageView.unmount();
    // Another wave, or the waves list: the plain notice stays hidden.
    const elsewhere = render(<WavesMoveNotice />);
    expect(screen.queryByTestId("waves-move-notice")).toBeNull();
    elsewhere.unmount();

    localStorage.clear();
    const plain = render(<WavesMoveNotice />);
    fireEvent.click(screen.getByRole("button", { name: "Hide this notice" }));
    plain.unmount();
    // Back on the Main Stage the sentence is new: the notice shows.
    render(<WavesMoveNotice wave={mainStage} />);
    expect(screen.getByTestId("waves-move-notice")).toHaveTextContent(SENTENCE);
  });
});

describe("usePollClosedByMove", () => {
  const scoped =
    (staysOnSite: boolean | undefined) =>
    ({ children }: { readonly children: ReactNode }) => (
      <WavesMoveScope
        wave={staysOnSite === undefined ? {} : { stays_on_site: staysOnSite }}
        waveId="wave-1"
      >
        {children}
      </WavesMoveScope>
    );
  const OPEN_AT_FREEZE = WAVES_FREEZE_MS + 3 * HOUR;
  const MADE_BEFORE = WAVES_FREEZE_MS - 24 * HOUR;

  afterEach(() => {
    clearWavesFreeze();
    jest.useRealTimers();
  });

  it("closes a moving wave's poll that was open at the freeze, from the switch-on", () => {
    setWavesFreezeSchedule();
    jest.useFakeTimers({ now: WAVES_SWITCH_ON_MS - HOUR });
    const { result } = renderHook(
      () => usePollClosedByMove({ closing_time: OPEN_AT_FREEZE }, MADE_BEFORE),
      {
        wrapper: scoped(false),
      }
    );
    // Frozen: the paused line covers it.
    expect(result.current).toBeNull();
    act(() => {
      jest.advanceTimersByTime(HOUR + 1);
    });
    expect(result.current).toBe(WAVES_FREEZE_MS);
  });

  it("leaves a poll closed before the freeze, a staying wave's, and any outside a wave", () => {
    setWavesFreezeSchedule();
    jest.useFakeTimers({ now: WAVES_SWITCH_ON_MS + HOUR });
    expect(
      renderHook(
        () =>
          usePollClosedByMove(
            { closing_time: WAVES_FREEZE_MS - HOUR },
            MADE_BEFORE
          ),
        {
          wrapper: scoped(false),
        }
      ).result.current
    ).toBeNull();
    expect(
      renderHook(
        () =>
          usePollClosedByMove({ closing_time: OPEN_AT_FREEZE }, MADE_BEFORE),
        {
          wrapper: scoped(true),
        }
      ).result.current
    ).toBeNull();
    // A poll closing exactly at the freeze took no ballots after it anyway.
    expect(
      renderHook(
        () =>
          usePollClosedByMove({ closing_time: WAVES_FREEZE_MS }, MADE_BEFORE),
        { wrapper: scoped(false) }
      ).result.current
    ).toBeNull();
    // A poll made after the freeze isn't one the move closed.
    expect(
      renderHook(
        () =>
          usePollClosedByMove(
            { closing_time: OPEN_AT_FREEZE },
            WAVES_SWITCH_ON_MS
          ),
        { wrapper: scoped(false) }
      ).result.current
    ).toBeNull();
    // A wave whose object doesn't say stays.
    expect(
      renderHook(
        () =>
          usePollClosedByMove({ closing_time: OPEN_AT_FREEZE }, MADE_BEFORE),
        {
          wrapper: scoped(undefined),
        }
      ).result.current
    ).toBeNull();
    expect(
      renderHook(() =>
        usePollClosedByMove({ closing_time: OPEN_AT_FREEZE }, MADE_BEFORE)
      ).result.current
    ).toBeNull();
  });
});
