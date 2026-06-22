import { renderHook, waitFor } from "@testing-library/react";
import { useWavePreviewById } from "@/hooks/useWavePreviewById";
import { resetWavePreviewFetchGateForTests } from "@/hooks/useWavePreviewById";
import { useWaveById } from "@/hooks/useWaveById";

jest.mock("@/hooks/useWaveById", () => ({ useWaveById: jest.fn() }));

const mockedUseWaveById = useWaveById as jest.Mock;

const getLatestEnabledByWaveId = (): Record<string, boolean | undefined> =>
  mockedUseWaveById.mock.calls.reduce<Record<string, boolean | undefined>>(
    (result, [waveId, options]) => ({
      ...result,
      [waveId]: options?.enabled,
    }),
    {}
  );

describe("useWavePreviewById", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetWavePreviewFetchGateForTests();
    mockedUseWaveById.mockImplementation((waveId: string, options: any) => ({
      wave: undefined,
      isFetching: Boolean(options?.enabled),
      isLoading: Boolean(options?.enabled),
    }));
  });

  it("returns cached wave data without enabling a preview fetch", () => {
    mockedUseWaveById.mockReturnValue({
      wave: { id: "cached-wave" },
      isFetching: false,
      isLoading: false,
    });

    const { result } = renderHook(() => useWavePreviewById("cached-wave"));

    expect(result.current.wave).toEqual({ id: "cached-wave" });
    expect(mockedUseWaveById).toHaveBeenCalledWith("cached-wave", {
      enabled: false,
    });
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
    mockedUseWaveById.mockImplementation((waveId: string, options: any) => ({
      wave: undefined,
      isFetching: Boolean(options?.enabled && fetchingWaveIds.has(waveId)),
      isLoading: Boolean(options?.enabled && fetchingWaveIds.has(waveId)),
    }));

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
    fetchingWaveIds.add("wave-4");
    rerender();

    await waitFor(() => {
      expect(getLatestEnabledByWaveId()["wave-4"]).toBe(true);
    });
  });

  it("disables a preview query after its fetch settles", async () => {
    const fetchingWaveIds = new Set(["wave-1"]);
    mockedUseWaveById.mockImplementation((waveId: string, options: any) => ({
      wave: undefined,
      isFetching: Boolean(options?.enabled && fetchingWaveIds.has(waveId)),
      isLoading: Boolean(options?.enabled && fetchingWaveIds.has(waveId)),
    }));

    const { rerender } = renderHook(() => useWavePreviewById("wave-1"));

    await waitFor(() => {
      expect(getLatestEnabledByWaveId()["wave-1"]).toBe(true);
    });

    fetchingWaveIds.delete("wave-1");
    rerender();

    await waitFor(() => {
      expect(getLatestEnabledByWaveId()["wave-1"]).toBe(false);
    });
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
