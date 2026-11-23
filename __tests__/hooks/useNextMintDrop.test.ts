import { renderHook } from "@testing-library/react";
import { useNextMintDrop } from "@/hooks/useNextMintDrop";
import { useWaveDecisions } from "@/hooks/waves/useWaveDecisions";
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
  useWaveDecisions: jest.fn(() => ({
    decisionPoints: [],
    isFetching: false,
    isLoading: false,
  })),
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

it("can refresh a cached winner on mount for a server-selected home drop", () => {
  waveMock.mockReturnValue({
    wave: undefined,
    isLoading: false,
    isError: false,
    error: null,
    refetch: jest.fn(),
    isFetching: false,
  });
  renderHook(() => useNextMintDrop({ refreshWinnerOnMount: true }));
  expect(useWaveDecisions).toHaveBeenLastCalledWith({
    waveId: "main-stage",
    enabled: true,
    pageSize: 1,
    refetchOnMount: "always",
  });
});
