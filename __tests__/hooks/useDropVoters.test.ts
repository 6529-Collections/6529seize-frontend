import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useDropVoters } from "@/hooks/useDropVoters";
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

describe("useDropVoters", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCommonApiFetch.mockResolvedValue({
      data: [],
      count: 0,
      page: 1,
      next: false,
    });
  });

  it("stays disabled until enabled", () => {
    const queryClient = createQueryClient();

    const { result } = renderHook(
      () => useDropVoters({ dropId: "drop-1", enabled: false }),
      { wrapper: createWrapper(queryClient) }
    );

    expect(result.current.voters).toEqual([]);
    expect(mockCommonApiFetch).not.toHaveBeenCalled();
  });

  it("fetches voters with the drop V2 endpoint and params", async () => {
    const queryClient = createQueryClient();
    mockCommonApiFetch.mockResolvedValue({
      data: [{ voter: { id: "v1" }, vote: 100 }],
      count: 1,
      page: 1,
      next: false,
    });

    const { result } = renderHook(
      () => useDropVoters({ dropId: "drop-1", enabled: true }),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => expect(result.current.voters).toHaveLength(1));
    expect(mockCommonApiFetch).toHaveBeenCalledWith({
      endpoint: "v2/drops/drop-1/votes",
      params: {
        page_size: "20",
        page: "1",
        sort_direction: "DESC",
      },
    });
  });

  it("fetches the next voters page", async () => {
    const queryClient = createQueryClient();
    mockCommonApiFetch
      .mockResolvedValueOnce({
        data: [{ voter: { id: "v1" }, vote: 100 }],
        count: 2,
        page: 1,
        next: true,
      })
      .mockResolvedValueOnce({
        data: [{ voter: { id: "v2" }, vote: -50 }],
        count: 2,
        page: 2,
        next: false,
      });

    const { result } = renderHook(
      () => useDropVoters({ dropId: "drop-1", enabled: true }),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => expect(result.current.voters).toHaveLength(1));
    await act(async () => {
      await result.current.fetchNextPage();
    });

    await waitFor(() => expect(result.current.voters).toHaveLength(2));
    expect(mockCommonApiFetch).toHaveBeenLastCalledWith({
      endpoint: "v2/drops/drop-1/votes",
      params: {
        page_size: "20",
        page: "2",
        sort_direction: "DESC",
      },
    });
  });

  it("keeps separate cache entries per drop", async () => {
    const queryClient = createQueryClient();

    renderHook(() => useDropVoters({ dropId: "drop-1", enabled: true }), {
      wrapper: createWrapper(queryClient),
    });
    renderHook(() => useDropVoters({ dropId: "drop-2", enabled: true }), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(mockCommonApiFetch).toHaveBeenCalledTimes(2));
    expect(
      queryClient.getQueryCache().findAll({ queryKey: [QueryKey.DROP_VOTERS] })
    ).toHaveLength(2);
  });
});
