import { act, renderHook, waitFor } from "@testing-library/react";
import { usePrefetchWaveData } from "@/hooks/usePrefetchWaveData";
import { useQueryClient } from "@tanstack/react-query";
import { commonApiFetch } from "@/services/api/common-api";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

jest.mock("@tanstack/react-query");
jest.mock("@/services/api/common-api");

describe("usePrefetchWaveData", () => {
  it("keeps a structured access rejection in the shared cache without throwing from prefetch", async () => {
    const { QueryClient } = jest.requireActual<
      typeof import("@tanstack/react-query")
    >("@tanstack/react-query");
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    (useQueryClient as jest.Mock).mockReturnValue(client);
    const error = { status: 403, message: "Access denied" };
    (commonApiFetch as jest.Mock).mockRejectedValueOnce(error);
    const { result } = renderHook(() => usePrefetchWaveData());
    await act(async () => result.current("denied-wave"));
    const key = [QueryKey.WAVE, { wave_id: "denied-wave" }];
    await waitFor(() => {
      expect(client.getQueryState(key)?.status).toBe("error");
    });
    expect(client.getQueryState(key)?.error).toBe(error);
    expect(client.getQueryData(key)).toBeUndefined();
    client.clear();
  });

  it("prefetches wave data with correct params", async () => {
    const prefetchQuery = jest.fn();
    (useQueryClient as jest.Mock).mockReturnValue({ prefetchQuery });
    (commonApiFetch as jest.Mock).mockResolvedValue({ id: "wave" });

    const { result } = renderHook(() => usePrefetchWaveData());
    await act(async () => {
      result.current("wave");
    });

    expect(prefetchQuery).toHaveBeenCalledWith({
      queryKey: [QueryKey.WAVE, { wave_id: "wave" }],
      queryFn: expect.any(Function),
      staleTime: 60000,
    });

    await prefetchQuery.mock.calls[0][0].queryFn();
    expect(commonApiFetch).toHaveBeenCalledWith({
      endpoint: "waves/wave",
      errorMode: "structured",
    });
  });
});
