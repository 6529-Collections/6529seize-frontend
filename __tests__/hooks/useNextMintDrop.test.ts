import { renderHook } from "@testing-library/react";
import { useNextMintDrop } from "@/hooks/useNextMintDrop";
import { useWaveById } from "@/hooks/useWaveById";
import type { ApiWave } from "@/generated/models/ApiWave";

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: () => ({
    seizeSettings: { memes_wave_id: "main-stage" },
    isLoaded: true,
    loadError: null,
  }),
}));
jest.mock("@/hooks/useWaveById", () => ({ useWaveById: jest.fn() }));
jest.mock("@/hooks/waves/useWaveDecisions", () => ({
  useWaveDecisions: () => ({
    decisionPoints: [],
    isFetching: false,
    isLoading: false,
  }),
}));

const waveMock = jest.mocked(useWaveById);

it.each([
  ["main-stage", 123456, 123456],
  ["main-stage", null, null],
  ["previous-wave", 123456, null],
  [null, null, null],
])(
  "uses only the current wave's existing schedule (%s, %s)",
  (id, time, expected) => {
    waveMock.mockReturnValue({
      wave: id
        ? ({ id, wave: { next_decision_time: time } } as ApiWave)
        : undefined,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
      isFetching: false,
    } as ReturnType<typeof useWaveById>);
    const { result } = renderHook(useNextMintDrop);
    expect(result.current.nextDecisionTime).toBe(expected);
    expect(result.current.nextMint).toBeNull();
    expect(result.current.isReady).toBe(true);
  }
);
