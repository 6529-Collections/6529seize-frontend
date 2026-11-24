import { render, renderHook, screen } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import WavesMoveNotice from "@/components/waves-move/WavesMoveNotice";
import {
  useWavesMoveScope,
  WavesMoveScope,
} from "@/components/waves-move/WavesMoveScope";
import {
  useWaveCreationPaused,
  useWavesWritesPaused,
} from "@/hooks/useWavesMovePhase";
import {
  forgetWaveMoves,
  isKnownMovingWave,
  waveMoveSignal,
  waveOfKnownDrop,
} from "@/lib/waves-move/scope";
import {
  clearWavesFreeze,
  setWavesFreezeSchedule,
  WAVES_FREEZE_MS,
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

const STAYS = "stays_on_site";
const moving = { id: "w1", [STAYS]: false };
const staying = { id: "w2", [STAYS]: true };
const unsaid = { id: "w3" };

const inScope =
  (...waves: { id: string }[]) =>
  ({ children }: { children: ReactNode }) =>
    waves.reduceRight<ReactNode>(
      (inner, wave) => (
        <WavesMoveScope wave={wave} waveId={wave.id}>
          {inner}
        </WavesMoveScope>
      ),
      children
    ) as ReactElement;

describe("which waves move", () => {
  beforeEach(() => {
    setWavesFreezeSchedule();
    jest.useFakeTimers({ now: WAVES_FREEZE_MS + 1 });
  });

  afterEach(() => {
    jest.useRealTimers();
    clearWavesFreeze();
    forgetWaveMoves();
  });

  it("reads the API's word on a wave, and nothing when it doesn't say", () => {
    expect(waveMoveSignal(moving)).toBe(true);
    expect(waveMoveSignal(staying)).toBe(false);
    expect(waveMoveSignal(unsaid)).toBeNull();
    expect(waveMoveSignal(null)).toBeNull();
    expect(waveMoveSignal({ [STAYS]: "yes" })).toBeNull();
  });

  it("pauses a moving wave's writes and shows its notice", () => {
    expect(
      renderHook(() => useWavesWritesPaused(), { wrapper: inScope(moving) })
        .result.current
    ).toBe(true);
    render(<WavesMoveNotice />, { wrapper: inScope(moving) });
    expect(screen.getByTestId("waves-move-notice")).toBeInTheDocument();
  });

  it("pauses nothing and says nothing inside a wave that stays", () => {
    expect(
      renderHook(() => useWavesWritesPaused(), { wrapper: inScope(staying) })
        .result.current
    ).toBe(false);
    render(<WavesMoveNotice />, { wrapper: inScope(staying) });
    expect(screen.queryByTestId("waves-move-notice")).toBeNull();
  });

  it("treats a wave whose object doesn't say as staying", () => {
    expect(
      renderHook(() => useWavesMoveScope(), { wrapper: inScope(unsaid) }).result
        .current
    ).toBe("stays");
    expect(
      renderHook(() => useWavesWritesPaused(), { wrapper: inScope(unsaid) })
        .result.current
    ).toBe(false);
  });

  it("lets a drop whose wave object doesn't say follow the wave around it", () => {
    expect(
      renderHook(() => useWavesMoveScope(), {
        wrapper: inScope(moving, unsaid),
      }).result.current
    ).toBe("moves");
    expect(
      renderHook(() => useWavesMoveScope(), {
        wrapper: inScope(moving, staying),
      }).result.current
    ).toBe("stays");
  });

  it("keeps the site-wide pause and notice outside any wave", () => {
    expect(renderHook(() => useWavesMoveScope()).result.current).toBe("none");
    expect(renderHook(() => useWavesWritesPaused()).result.current).toBe(true);
    render(<WavesMoveNotice />);
    expect(screen.getByTestId("waves-move-notice")).toBeInTheDocument();
  });

  it("keeps wave creation paused, and its notice, inside a staying wave", () => {
    expect(
      renderHook(() => useWaveCreationPaused(), { wrapper: inScope(staying) })
        .result.current
    ).toBe(true);
    render(<WavesMoveNotice siteWide />, { wrapper: inScope(staying) });
    expect(screen.getByTestId("waves-move-notice")).toBeInTheDocument();
  });

  it("changes nothing where no wave is given", () => {
    const { result } = renderHook(() => useWavesMoveScope(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <WavesMoveScope wave={undefined} waveId={undefined}>
          {children}
        </WavesMoveScope>
      ),
    });
    expect(result.current).toBe("none");
  });

  it("tells the request guard what the page read", () => {
    render(
      <WavesMoveScope wave={moving} waveId="w1" dropId="d1">
        <WavesMoveScope wave={staying} waveId="w2" dropId="d2">
          <span />
        </WavesMoveScope>
      </WavesMoveScope>
    );
    expect(isKnownMovingWave("w1")).toBe(true);
    expect(isKnownMovingWave("w2")).toBe(false);
    expect(isKnownMovingWave("w3")).toBe(false);
    expect(waveOfKnownDrop("d1")).toBe("w1");
    expect(waveOfKnownDrop("d2")).toBe("w2");
  });
});
