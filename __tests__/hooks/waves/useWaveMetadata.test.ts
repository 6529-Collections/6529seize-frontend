import { renderHook } from "@testing-library/react";
import { useQuery } from "@tanstack/react-query";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { ApiWave } from "@/generated/models/ApiWave";
import { WAVE_DISPLAY_METADATA_KEYS } from "@/helpers/waves/wave-metadata.helpers";
import { useWaveOutcomeVisibility } from "@/hooks/waves/useWaveMetadata";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

const useQueryMock = useQuery as jest.Mock;

const createWave = (type: ApiWaveType): ApiWave =>
  ({
    id: "wave-1",
    wave: { type },
  }) as ApiWave;

describe("useWaveOutcomeVisibility", () => {
  beforeEach(() => {
    useQueryMock.mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: false,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each([ApiWaveType.Rank, ApiWaveType.Approve])(
    "hides outcomes for %s waves until metadata is loaded",
    (waveType) => {
      const { result } = renderHook(() =>
        useWaveOutcomeVisibility(createWave(waveType))
      );

      expect(result.current).toBe(false);
    }
  );

  it("hides outcomes when loaded metadata says outcomes are hidden", () => {
    useQueryMock.mockReturnValue({
      data: [
        {
          id: 1,
          data_key: WAVE_DISPLAY_METADATA_KEYS.outcomesVisible,
          data_value: "false",
        },
      ],
      isError: false,
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useWaveOutcomeVisibility(createWave(ApiWaveType.Rank))
    );

    expect(result.current).toBe(false);
  });

  it("shows outcomes when loaded metadata has no visibility row", () => {
    useQueryMock.mockReturnValue({
      data: [],
      isError: false,
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useWaveOutcomeVisibility(createWave(ApiWaveType.Rank))
    );

    expect(result.current).toBe(true);
  });

  it("shows outcomes when loaded metadata has an invalid visibility value", () => {
    useQueryMock.mockReturnValue({
      data: [
        {
          id: 1,
          data_key: WAVE_DISPLAY_METADATA_KEYS.outcomesVisible,
          data_value: "hidden",
        },
      ],
      isError: false,
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useWaveOutcomeVisibility(createWave(ApiWaveType.Approve))
    );

    expect(result.current).toBe(true);
  });

  it.each([ApiWaveType.Chat, null])(
    "shows outcomes for non-competition wave state %s",
    (waveType) => {
      const wave = waveType === null ? null : createWave(waveType);

      const { result } = renderHook(() => useWaveOutcomeVisibility(wave));

      expect(result.current).toBe(true);
    }
  );

  it("uses existing metadata data when a background refetch errors", () => {
    useQueryMock.mockReturnValue({
      data: [
        {
          id: 1,
          data_key: WAVE_DISPLAY_METADATA_KEYS.outcomesVisible,
          data_value: "false",
        },
      ],
      isError: true,
      isLoading: false,
    });

    const { result } = renderHook(() =>
      useWaveOutcomeVisibility(createWave(ApiWaveType.Rank))
    );

    expect(result.current).toBe(false);
  });
});
