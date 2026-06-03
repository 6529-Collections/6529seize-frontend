import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useDropVoteLogs } from "@/hooks/useDropVoteLogs";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

jest.mock("@/components/react-query-wrapper/utils/query-utils", () => ({
  getDefaultQueryRetry: jest.fn(() => ({ retry: false })),
}));

const mockCommonApiFetch = commonApiFetch as jest.MockedFunction<
  typeof commonApiFetch
>;

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  });

const createWrapper = (queryClient: QueryClient) => {
  return function Wrapper({ children }: { readonly children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
};

describe("useDropVoteLogs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCommonApiFetch.mockResolvedValue([]);
  });

  it("stays disabled until enabled", () => {
    const queryClient = createQueryClient();

    const { result } = renderHook(
      () => useDropVoteLogs({ dropId: "drop-1", enabled: false }),
      { wrapper: createWrapper(queryClient) }
    );

    expect(result.current.logs).toEqual([]);
    expect(mockCommonApiFetch).not.toHaveBeenCalled();
  });

  it("fetches logs with the drop V2 endpoint and params", async () => {
    const queryClient = createQueryClient();
    mockCommonApiFetch.mockResolvedValue([
      { id: "l1", old_vote: 0, new_vote: 100 },
    ]);

    const { result } = renderHook(
      () => useDropVoteLogs({ dropId: "drop-1", enabled: true }),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => expect(result.current.logs).toHaveLength(1));
    expect(mockCommonApiFetch).toHaveBeenCalledWith({
      endpoint: "v2/drops/drop-1/votes/logs",
      params: {
        limit: "20",
        offset: "0",
        sort_direction: "DESC",
      },
    });
  });

  it("fetches the next logs page by offset", async () => {
    const queryClient = createQueryClient();
    mockCommonApiFetch
      .mockResolvedValueOnce(
        Array.from({ length: 20 }).map((_, index) => ({ id: `l${index}` }))
      )
      .mockResolvedValueOnce([{ id: "l20" }]);

    const { result } = renderHook(
      () => useDropVoteLogs({ dropId: "drop-1", enabled: true }),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => expect(result.current.logs).toHaveLength(20));
    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() => expect(result.current.logs).toHaveLength(21));
    expect(mockCommonApiFetch).toHaveBeenLastCalledWith({
      endpoint: "v2/drops/drop-1/votes/logs",
      params: {
        limit: "20",
        offset: "20",
        sort_direction: "DESC",
      },
    });
  });

  it("keeps separate cache entries per drop", async () => {
    const queryClient = createQueryClient();

    renderHook(() => useDropVoteLogs({ dropId: "drop-1", enabled: true }), {
      wrapper: createWrapper(queryClient),
    });
    renderHook(() => useDropVoteLogs({ dropId: "drop-2", enabled: true }), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(mockCommonApiFetch).toHaveBeenCalledTimes(2));
    expect(
      queryClient
        .getQueryCache()
        .findAll({ queryKey: [QueryKey.DROP_VOTE_LOGS] })
    ).toHaveLength(2);
  });
});
