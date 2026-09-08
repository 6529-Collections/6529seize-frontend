import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode, type ReactNode } from "react";
import type { ApiWaveCuration } from "@/generated/models/ApiWaveCuration";
import { useWaveCurationTabs } from "@/hooks/waves/useWaveCurationTabs";
import { getWaveCurationsQueryKey } from "@/hooks/waves/useWaveCurations";
import { commonApiFetch } from "@/services/api/common-api";

const replace = jest.fn();
const router = { replace };
let searchParams = new URLSearchParams();

jest.mock("next/navigation", () => ({
  usePathname: () => "/waves/wave-id",
  useRouter: () => router,
  useSearchParams: () => searchParams,
}));
jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () => ({
  QueryKey: { WAVE_CURATIONS: "WAVE_CURATIONS" },
}));
jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const fetchCurations = jest.mocked(commonApiFetch);
const queryKey = getWaveCurationsQueryKey("wave-id");
const curation: ApiWaveCuration = {
  id: "curation-1",
  name: "Curators' choice",
  wave_id: "wave-id",
  group_id: "group-1",
  priority_order: 1,
  created_at: 1,
  updated_at: 1,
};
let queryClient: QueryClient;

function wrapper({ children }: { readonly children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <StrictMode>{children}</StrictMode>
    </QueryClientProvider>
  );
}

describe("useWaveCurationTabs", () => {
  beforeEach(() => {
    replace.mockReset();
    fetchCurations.mockReset();
    searchParams = new URLSearchParams("curation=missing");
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it.each(["view=chat", "curation=curation-1"])(
    "keeps available navigation without extra requests for %s",
    (query) => {
      searchParams = new URLSearchParams(query);
      queryClient.setQueryData(queryKey, [curation]);

      const { result } = renderHook(
        () => useWaveCurationTabs({ waveId: "wave-id" }),
        { wrapper }
      );

      expect(result.current.data).toEqual([curation]);
      expect(fetchCurations).not.toHaveBeenCalled();
      expect(replace).not.toHaveBeenCalled();
    }
  );

  it("leaves disabled navigation to its active platform owner", () => {
    queryClient.setQueryData(queryKey, []);

    renderHook(
      () => useWaveCurationTabs({ waveId: "wave-id", enabled: false }),
      { wrapper }
    );

    expect(fetchCurations).not.toHaveBeenCalled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("preserves a valid selection while its initial list loads", async () => {
    searchParams = new URLSearchParams("curation=curation-1");
    const response = Promise.withResolvers<ApiWaveCuration[]>();
    fetchCurations.mockReturnValue(response.promise);

    const { result } = renderHook(
      () => useWaveCurationTabs({ waveId: "wave-id" }),
      { wrapper }
    );

    expect(result.current.isPending).toBe(true);
    expect(replace).not.toHaveBeenCalled();
    await act(async () => response.resolve([curation]));
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(fetchCurations).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();
  });

  it("refreshes a cached miss before preserving a newly available curation", async () => {
    searchParams = new URLSearchParams("curation=curation-1");
    queryClient.setQueryData(queryKey, []);
    fetchCurations.mockResolvedValue([curation]);

    const { result } = renderHook(
      () => useWaveCurationTabs({ waveId: "wave-id" }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.data).toEqual([curation]));
    expect(fetchCurations).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();
  });

  it.each([
    [
      "view=chat&curation=missing&filter=active",
      "/waves/wave-id?view=chat&filter=active",
    ],
    ["curation=missing", "/waves/wave-id"],
    ["curation=", "/waves/wave-id"],
  ])(
    "confirms and clears unavailable selection %s once",
    async (query, url) => {
      searchParams = new URLSearchParams(query);
      queryClient.setQueryData(queryKey, []);
      const response = Promise.withResolvers<ApiWaveCuration[]>();
      fetchCurations.mockReturnValue(response.promise);

      renderHook(() => useWaveCurationTabs({ waveId: "wave-id" }), { wrapper });

      expect(replace).not.toHaveBeenCalled();
      await act(async () => response.resolve([]));
      await waitFor(() => expect(replace).toHaveBeenCalledTimes(1));
      expect(replace).toHaveBeenCalledWith(url, { scroll: false });
      expect(fetchCurations).toHaveBeenCalledTimes(1);
    }
  );

  it("preserves a failed lookup and recovers after a successful background retry", async () => {
    queryClient.setQueryData(queryKey, []);
    fetchCurations.mockRejectedValue(new Error("Curation list unavailable"));

    const { result } = renderHook(
      () => useWaveCurationTabs({ waveId: "wave-id" }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(fetchCurations).toHaveBeenCalledTimes(1);
    expect(replace).not.toHaveBeenCalled();

    fetchCurations.mockResolvedValue([]);
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey });
    });

    await waitFor(() => expect(replace).toHaveBeenCalledTimes(1));
    expect(replace).toHaveBeenCalledWith("/waves/wave-id", { scroll: false });
    expect(result.current.isSuccess).toBe(true);
  });

  it("does not overwrite navigation that changed during confirmation", async () => {
    queryClient.setQueryData(queryKey, []);
    const response = Promise.withResolvers<ApiWaveCuration[]>();
    fetchCurations.mockReturnValue(response.promise);

    const { rerender } = renderHook(
      () => useWaveCurationTabs({ waveId: "wave-id" }),
      { wrapper }
    );

    searchParams = new URLSearchParams("view=chat&filter=new");
    rerender();
    await act(async () => response.resolve([]));

    expect(replace).not.toHaveBeenCalled();
  });
});
