import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { WavesMoveScope } from "@/components/waves-move/WavesMoveScope";
import {
  useChainWavesActive,
  useWavesWritesPaused,
} from "@/hooks/useWavesMovePhase";
import {
  clearWavesFreeze,
  setWavesFreezeSchedule,
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

const inWave =
  (staysOnSite: boolean) =>
  ({ children }: { children: ReactNode }) => (
    <WavesMoveScope wave={{ id: "w1", stays_on_site: staysOnSite }} waveId="w1">
      {children}
    </WavesMoveScope>
  );

describe("the 6529 Network's flows after the switch-on", () => {
  beforeEach(() => {
    setWavesFreezeSchedule();
    // A build with the chain flows on.
    const env = globalThis as { __wavesFreeze?: object };
    env.__wavesFreeze = {
      ...env.__wavesFreeze,
      NEXT_PUBLIC_FEATURE_CHAIN_WAVES: "true",
      NEXT_PUBLIC_CHAIN_GATEWAY_URL: "https://gateway.example.test",
      NEXT_PUBLIC_CHAIN_NETWORK_ID: `0x${"ab".repeat(32)}`,
    };
    jest.useFakeTimers({ now: WAVES_SWITCH_ON_MS + 1 });
  });

  afterEach(() => {
    jest.useRealTimers();
    clearWavesFreeze();
  });

  it("send a moving wave's votes there, and open them", () => {
    expect(
      renderHook(() => useChainWavesActive(), { wrapper: inWave(false) }).result
        .current
    ).toBe(true);
    expect(
      renderHook(() => useWavesWritesPaused("votes"), {
        wrapper: inWave(false),
      }).result.current
    ).toBe(false);
  });

  it("leave a staying wave on 6529.io's own flows, open", () => {
    expect(
      renderHook(() => useChainWavesActive(), { wrapper: inWave(true) }).result
        .current
    ).toBe(false);
    expect(
      renderHook(() => useWavesWritesPaused("votes"), {
        wrapper: inWave(true),
      }).result.current
    ).toBe(false);
    expect(
      renderHook(() => useWavesWritesPaused(), { wrapper: inWave(true) }).result
        .current
    ).toBe(false);
  });

  it("keep what hasn't moved there closed in a moving wave", () => {
    expect(
      renderHook(() => useWavesWritesPaused(), { wrapper: inWave(false) })
        .result.current
    ).toBe(true);
  });
});
