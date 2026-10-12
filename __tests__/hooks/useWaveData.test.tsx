import { renderHook } from "@testing-library/react";
import { useWaveData } from "@/hooks/useWaveData";
import { useQuery } from "@tanstack/react-query";
import { getWaveQueryKey } from "@/services/api/wave-query";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

const mockFetch = jest.fn();
jest.mock("@/services/api/common-api", () => ({
  ...jest.requireActual("@/services/api/common-api"),
  commonApiFetch: (params: unknown) => mockFetch(params),
}));

interface CapturedQueryOptions {
  queryFn: () => Promise<unknown>;
  enabled: boolean;
  retry: (count: number, error: unknown) => boolean;
  retryDelay: (count: number) => number;
}

const options = () =>
  jest
    .mocked(useQuery)
    .mock.calls.at(-1)![0] as unknown as CapturedQueryOptions;

beforeEach(() => {
  jest
    .mocked(useQuery)
    .mockReset()
    .mockReturnValue({} as ReturnType<typeof useQuery>);
  mockFetch.mockReset();
});

describe("useWaveData", () => {
  it("uses the shared wave key and always preserves HTTP status", async () => {
    mockFetch.mockResolvedValue({ id: "1" });
    renderHook(() => useWaveData({ waveId: "1", refetchInterval: 1000 }));
    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: getWaveQueryKey("1"),
        refetchInterval: 1000,
        enabled: true,
      })
    );
    await expect(options().queryFn()).resolves.toEqual({ id: "1" });
    expect(mockFetch).toHaveBeenCalledWith({
      endpoint: "waves/1",
      errorMode: "structured",
    });
  });

  it("disables a null wave without making an API request", async () => {
    renderHook(() => useWaveData({ waveId: null }));
    expect(options().enabled).toBe(false);
    await expect(options().queryFn()).rejects.toThrow(
      "Attempted fetch with null waveId"
    );
    expect(
      options().retry(0, new Error("Attempted fetch with null waveId"))
    ).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it.each(["Wave 1 not found", { status: 404 }])(
    "handles legacy and structured missing waves without retrying (%p)",
    (error) => {
      const onWaveNotFound = jest.fn();
      renderHook(() => useWaveData({ waveId: "1", onWaveNotFound }));
      expect(options().retry(0, error)).toBe(false);
      expect(onWaveNotFound).toHaveBeenCalledTimes(1);
    }
  );

  it.each([401, 403])(
    "does not retry HTTP %s or report a missing wave",
    (status) => {
      const onWaveNotFound = jest.fn();
      renderHook(() => useWaveData({ waveId: "1", onWaveNotFound }));
      expect(options().retry(0, { status })).toBe(false);
      expect(onWaveNotFound).not.toHaveBeenCalled();
    }
  );

  it.each([
    new Error("Network unavailable"),
    { status: 429 },
    { status: 500 },
    { status: 503 },
  ])("bounds retries for transient failures (%p)", (error) => {
    const onWaveNotFound = jest.fn();
    renderHook(() => useWaveData({ waveId: "1", onWaveNotFound }));
    expect(options().retry(0, error)).toBe(true);
    expect(options().retry(2, error)).toBe(true);
    expect(options().retry(3, error)).toBe(false);
    expect(options().retryDelay(3)).toBe(3000);
    expect(onWaveNotFound).not.toHaveBeenCalled();
  });
});
