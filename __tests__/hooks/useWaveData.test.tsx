import { renderHook } from "@testing-library/react";
import { useWaveData } from "@/hooks/useWaveData";
import { useQuery } from "@tanstack/react-query";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

const mockFetch = jest.fn();
jest.mock("@/services/api/common-api", () => ({
  ...jest.requireActual("@/services/api/common-api"),
  commonApiFetch: (params: unknown) => mockFetch(params),
}));

describe("useWaveData", () => {
  it("calls useQuery with correct params", () => {
    (useQuery as jest.Mock).mockReturnValue({ data: null });
    renderHook(() =>
      useWaveData({
        waveId: "1",
        refetchInterval: 1000,
        onWaveNotFound: jest.fn(),
      })
    );
    expect(useQuery).toHaveBeenCalled();
  });

  it("does not fetch when waveId is null", () => {
    (useQuery as jest.Mock).mockImplementation(({ queryFn }: any) => {
      return { data: null, queryFn };
    });
    const { result } = renderHook(() => useWaveData({ waveId: null }));
    expect((result as any).current.queryFn).toBeDefined();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("handles retry logic", () => {
    let options: any;
    (useQuery as jest.Mock).mockImplementation((opts: any) => {
      options = opts;
      return { data: null };
    });
    const onWaveNotFound = jest.fn();
    renderHook(() => useWaveData({ waveId: "1", onWaveNotFound }));
    expect(options.retry(1, "Wave 1 not found")).toBe(false);
    expect(onWaveNotFound).toHaveBeenCalled();
    expect(options.retry(2, new Error("e"))).toBe(true);
    expect(options.retry(4, new Error("e"))).toBe(false);
    expect(options.retryDelay(3)).toBe(3000);
  });

  it("uses structured errors for competition reads so rejected access retains its HTTP status", async () => {
    const query = useQuery as jest.Mock;
    query.mockClear();
    mockFetch.mockReset().mockResolvedValue({ id: "1" });
    renderHook(() => useWaveData({ waveId: "1", structuredErrors: true }));
    const options = query.mock.calls[0][0] as {
      queryFn: () => Promise<unknown>;
    };
    await options.queryFn();
    expect(mockFetch).toHaveBeenCalledWith({
      endpoint: "waves/1",
      errorMode: "structured",
    });
  });

  it("handles a structured missing-wave response without retrying", () => {
    const query = useQuery as jest.Mock;
    query.mockClear();
    const onWaveNotFound = jest.fn();
    renderHook(() =>
      useWaveData({ waveId: "1", structuredErrors: true, onWaveNotFound })
    );
    const options = query.mock.calls[0][0] as {
      retry: (count: number, error: unknown) => boolean;
    };
    expect(options.retry(0, { status: 404 })).toBe(false);
    expect(onWaveNotFound).toHaveBeenCalledTimes(1);
  });
});
