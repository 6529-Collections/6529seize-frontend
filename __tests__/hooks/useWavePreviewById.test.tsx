import { act, renderHook, waitFor } from "@testing-library/react";
import {
  resetWavePreviewFetchGateForTests,
  useWavePreviewById,
} from "@/hooks/useWavePreviewById";
import { useWaveById } from "@/hooks/useWaveById";
import type { ApiWave } from "@/generated/models/ApiWave";

jest.mock("@/hooks/useWaveById", () => ({ useWaveById: jest.fn() }));

const mockedUseWaveById = jest.mocked(useWaveById);
type UseWaveByIdResult = ReturnType<typeof useWaveById>;
type UseWaveByIdOptions = NonNullable<Parameters<typeof useWaveById>[1]>;
type WaveRefetchResult = Awaited<ReturnType<UseWaveByIdResult["refetch"]>>;

const refetchWaveMock = jest.fn<
  ReturnType<UseWaveByIdResult["refetch"]>,
  Parameters<UseWaveByIdResult["refetch"]>
>();
const mockRefetchResult = {} as WaveRefetchResult;

const mockWave = (id: string): ApiWave => ({ id }) as ApiWave;

const createUseWaveByIdResult = ({
  wave,
  isFetching,
  isLoading,
}: {
  readonly wave: ApiWave | undefined;
  readonly isFetching: boolean;
  readonly isLoading: boolean;
}): UseWaveByIdResult => ({
  wave,
  isLoading,
  isError: false,
  error: null,
  refetch: refetchWaveMock,
  isFetching,
});

const getLatestEnabledByWaveId = (): Record<string, boolean | undefined> =>
  mockedUseWaveById.mock.calls.reduce<Record<string, boolean | undefined>>(
    (result, [waveId, options]) => ({
      ...result,
      [waveId ?? ""]: options?.enabled,
    }),
    {}
  );

describe("useWavePreviewById", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetWavePreviewFetchGateForTests();
    refetchWaveMock.mockResolvedValue(mockRefetchResult);
    mockedUseWaveById.mockImplementation((_waveId, options) =>
      createUseWaveByIdResult({
        wave: undefined,
        isFetching: Boolean(options?.enabled),
        isLoading: Boolean(options?.enabled),
      })
    );
  });

  it("returns cached wave data without enabling a preview fetch", () => {
    mockedUseWaveById.mockReturnValue(
      createUseWaveByIdResult({
        wave: mockWave("cached-wave"),
        isFetching: false,
        isLoading: false,
      })
    );

    const { result } = renderHook(() => useWavePreviewById("cached-wave"));

    expect(result.current.wave).toEqual(mockWave("cached-wave"));
    expect(mockedUseWaveById).toHaveBeenCalledWith("cached-wave", {
      enabled: false,
    });
  });

  it("ignores placeholder wave data for a different wave id", async () => {
    mockedUseWaveById.mockReturnValue(
      createUseWaveByIdResult({
        wave: mockWave("previous-wave"),
        isFetching: false,
        isLoading: false,
      })
    );

    const { result } = renderHook(() => useWavePreviewById("next-wave"));

    expect(result.current.wave).toBeUndefined();
    await waitFor(() => {
      expect(getLatestEnabledByWaveId()["next-wave"]).toBe(true);
    });
  });

  it("returns cached wave data after filtering placeholder mismatches", () => {
    mockedUseWaveById.mockReturnValue(
      createUseWaveByIdResult({
        wave: mockWave("cached-wave"),
        isFetching: false,
        isLoading: false,
      })
    );

    const { result } = renderHook(() => useWavePreviewById("cached-wave"));

    expect(result.current.wave).toEqual(mockWave("cached-wave"));
  });

  it("limits missing preview fetches to three unique waves at a time", async () => {
    renderHook(() => {
      useWavePreviewById("wave-1");
      useWavePreviewById("wave-2");
      useWavePreviewById("wave-3");
      useWavePreviewById("wave-4");
    });

    await waitFor(() => {
      expect(getLatestEnabledByWaveId()).toEqual({
        "wave-1": true,
        "wave-2": true,
        "wave-3": true,
        "wave-4": false,
      });
    });
  });

  it("dedupes duplicate missing wave ids into the same active slot", async () => {
    renderHook(() => {
      useWavePreviewById("same-wave");
      useWavePreviewById("same-wave");
      useWavePreviewById("other-wave-1");
      useWavePreviewById("other-wave-2");
      useWavePreviewById("other-wave-3");
    });

    await waitFor(() => {
      expect(getLatestEnabledByWaveId()).toEqual({
        "same-wave": true,
        "other-wave-1": true,
        "other-wave-2": true,
        "other-wave-3": false,
      });
    });
  });

  it("starts the next queued preview when an active fetch settles", async () => {
    const fetchingWaveIds = new Set(["wave-1", "wave-2", "wave-3"]);
    const loadedWaveIds = new Set<string>();
    mockedUseWaveById.mockImplementation(
      (waveId, options?: UseWaveByIdOptions) =>
        createUseWaveByIdResult({
          wave:
            waveId && loadedWaveIds.has(waveId) ? mockWave(waveId) : undefined,
          isFetching: Boolean(
            options?.enabled && waveId && fetchingWaveIds.has(waveId)
          ),
          isLoading: Boolean(
            options?.enabled && waveId && fetchingWaveIds.has(waveId)
          ),
        })
    );

    const { rerender } = renderHook(() => {
      useWavePreviewById("wave-1");
      useWavePreviewById("wave-2");
      useWavePreviewById("wave-3");
      useWavePreviewById("wave-4");
    });

    await waitFor(() => {
      expect(getLatestEnabledByWaveId()["wave-4"]).toBe(false);
    });

    fetchingWaveIds.delete("wave-1");
    loadedWaveIds.add("wave-1");
    fetchingWaveIds.add("wave-4");
    rerender();

    await waitFor(() => {
      expect(getLatestEnabledByWaveId()["wave-4"]).toBe(true);
    });
  });

  it("retries one empty preview before disabling the query", async () => {
    const fetchingWaveIds = new Set(["wave-1"]);
    mockedUseWaveById.mockImplementation(
      (waveId, options?: UseWaveByIdOptions) =>
        createUseWaveByIdResult({
          wave: undefined,
          isFetching: Boolean(
            options?.enabled && waveId && fetchingWaveIds.has(waveId)
          ),
          isLoading: Boolean(
            options?.enabled && waveId && fetchingWaveIds.has(waveId)
          ),
        })
    );

    const { rerender } = renderHook(() => useWavePreviewById("wave-1"));

    await waitFor(() => {
      expect(getLatestEnabledByWaveId()["wave-1"]).toBe(true);
    });

    fetchingWaveIds.delete("wave-1");
    mockedUseWaveById.mockClear();
    rerender();

    await waitFor(() => {
      expect(refetchWaveMock).toHaveBeenCalledTimes(1);
    });

    mockedUseWaveById.mockClear();
    rerender();

    await waitFor(() => {
      expect(getLatestEnabledByWaveId()["wave-1"]).toBe(false);
    });
    expect(refetchWaveMock).toHaveBeenCalledTimes(1);
  });

  it("retries an empty duplicate wave id only once", async () => {
    const fetchingWaveIds = new Set(["same-wave"]);
    mockedUseWaveById.mockImplementation(
      (waveId, options?: UseWaveByIdOptions) =>
        createUseWaveByIdResult({
          wave: undefined,
          isFetching: Boolean(
            options?.enabled && waveId && fetchingWaveIds.has(waveId)
          ),
          isLoading: Boolean(
            options?.enabled && waveId && fetchingWaveIds.has(waveId)
          ),
        })
    );

    const { rerender } = renderHook(() => {
      useWavePreviewById("same-wave");
      useWavePreviewById("same-wave");
    });

    await waitFor(() => {
      expect(getLatestEnabledByWaveId()["same-wave"]).toBe(true);
    });

    fetchingWaveIds.delete("same-wave");
    rerender();

    await waitFor(() => {
      expect(refetchWaveMock).toHaveBeenCalledTimes(1);
    });
  });

  it("keeps a shared retry alive when one duplicate subscriber unmounts", async () => {
    const fetchingWaveIds = new Set(["same-wave"]);
    mockedUseWaveById.mockImplementation(
      (waveId, options?: UseWaveByIdOptions) =>
        createUseWaveByIdResult({
          wave: undefined,
          isFetching: Boolean(
            options?.enabled && waveId && fetchingWaveIds.has(waveId)
          ),
          isLoading: Boolean(
            options?.enabled && waveId && fetchingWaveIds.has(waveId)
          ),
        })
    );

    const first = renderHook(() => useWavePreviewById("same-wave"));
    const second = renderHook(() => useWavePreviewById("same-wave"));

    await waitFor(() => {
      expect(getLatestEnabledByWaveId()["same-wave"]).toBe(true);
    });

    second.unmount();
    fetchingWaveIds.delete("same-wave");
    first.rerender();

    await waitFor(() => {
      expect(refetchWaveMock).toHaveBeenCalledTimes(1);
    });
  });

  it("releases the preview slot when an empty retry rejects", async () => {
    const fetchingWaveIds = new Set(["wave-1"]);
    refetchWaveMock.mockRejectedValueOnce(new Error("refetch failed"));
    mockedUseWaveById.mockImplementation(
      (waveId, options?: UseWaveByIdOptions) =>
        createUseWaveByIdResult({
          wave: undefined,
          isFetching: Boolean(
            options?.enabled && waveId && fetchingWaveIds.has(waveId)
          ),
          isLoading: Boolean(
            options?.enabled && waveId && fetchingWaveIds.has(waveId)
          ),
        })
    );

    const { rerender } = renderHook(() => useWavePreviewById("wave-1"));

    await waitFor(() => {
      expect(getLatestEnabledByWaveId()["wave-1"]).toBe(true);
    });

    fetchingWaveIds.delete("wave-1");
    rerender();

    await waitFor(() => {
      expect(refetchWaveMock).toHaveBeenCalledTimes(1);
      expect(getLatestEnabledByWaveId()["wave-1"]).toBe(false);
    });
  });

  it("releases the preview slot when an empty retry returns wave data", async () => {
    const fetchingWaveIds = new Set(["wave-1"]);
    const loadedWaveIds = new Set<string>();
    let resolveRefetch: ((value: WaveRefetchResult) => void) | undefined;
    refetchWaveMock.mockImplementationOnce(
      () =>
        new Promise<WaveRefetchResult>((resolve) => {
          resolveRefetch = resolve;
        })
    );
    mockedUseWaveById.mockImplementation(
      (waveId, options?: UseWaveByIdOptions) =>
        createUseWaveByIdResult({
          wave:
            waveId && loadedWaveIds.has(waveId) ? mockWave(waveId) : undefined,
          isFetching: Boolean(
            options?.enabled && waveId && fetchingWaveIds.has(waveId)
          ),
          isLoading: Boolean(
            options?.enabled && waveId && fetchingWaveIds.has(waveId)
          ),
        })
    );

    const { result, rerender } = renderHook(() => useWavePreviewById("wave-1"));

    await waitFor(() => {
      expect(getLatestEnabledByWaveId()["wave-1"]).toBe(true);
    });

    fetchingWaveIds.delete("wave-1");
    rerender();

    await waitFor(() => {
      expect(refetchWaveMock).toHaveBeenCalledTimes(1);
    });

    loadedWaveIds.add("wave-1");
    await act(async () => {
      resolveRefetch?.(mockRefetchResult);
    });
    mockedUseWaveById.mockClear();
    rerender();

    await waitFor(() => {
      expect(result.current.wave).toEqual(mockWave("wave-1"));
      expect(getLatestEnabledByWaveId()["wave-1"]).toBe(false);
    });
    expect(refetchWaveMock).toHaveBeenCalledTimes(1);
  });

  it("does not carry an enabled fetch state across wave id changes", async () => {
    const { rerender } = renderHook(
      ({ waveId }: { waveId: string }) => useWavePreviewById(waveId),
      { initialProps: { waveId: "wave-1" } }
    );

    await waitFor(() => {
      expect(getLatestEnabledByWaveId()["wave-1"]).toBe(true);
    });

    mockedUseWaveById.mockClear();
    rerender({ waveId: "wave-2" });

    expect(mockedUseWaveById.mock.calls[0]).toEqual([
      "wave-2",
      { enabled: false },
    ]);
  });
});
