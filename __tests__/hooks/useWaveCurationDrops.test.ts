import { renderHook } from "@testing-library/react";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useWaveCurationDrops } from "@/hooks/useWaveCurationDrops";
import { fetchWaveCurationDropsV2 } from "@/services/api/wave-curation-drops-v2-api";

jest.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: jest.fn(),
  useQueryClient: jest.fn(),
}));
jest.mock("@/services/api/wave-curation-drops-v2-api", () => ({
  fetchWaveCurationDropsV2: jest.fn(),
}));
jest.mock("@/services/websocket/useWebSocketMessage", () => ({
  useWebSocketMessage: jest.fn(),
}));
jest.mock("@/helpers/waves/wave.helpers", () => ({
  normalizeOptionalWaveId: jest.fn((waveId) =>
    typeof waveId === "string" ? waveId.trim() || null : waveId ?? null
  ),
  toApiWaveMin: jest.fn((wave) => ({ id: wave.id })),
}));

const useInfiniteQueryMock = useInfiniteQuery as jest.Mock;
const useQueryClientMock = useQueryClient as jest.Mock;
const fetchWaveCurationDropsV2Mock = fetchWaveCurationDropsV2 as jest.Mock;

describe("useWaveCurationDrops", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useQueryClientMock.mockReturnValue({ setQueriesData: jest.fn() });
    useInfiniteQueryMock.mockReturnValue({
      data: { pages: [] },
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
      refetch: jest.fn(),
    });
  });

  it("uses the v2 wave curation drops adapter", async () => {
    const wave = { id: "wave-1" } as any;
    fetchWaveCurationDropsV2Mock.mockResolvedValue({
      data: [],
      page: 2,
      next: false,
    });

    renderHook(() =>
      useWaveCurationDrops({
        wave,
        curationId: " curation-1 ",
        pageSize: 25,
      })
    );

    expect(useInfiniteQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          QueryKey.DROPS,
          {
            waveId: "wave-1",
            curationId: "curation-1",
            pageSize: 25,
            context: "wave-curation-drops",
          },
        ],
        enabled: true,
        initialPageParam: 1,
      })
    );

    const options = useInfiniteQueryMock.mock.calls[0][0];
    await options.queryFn({ pageParam: 2 });

    expect(fetchWaveCurationDropsV2Mock).toHaveBeenCalledWith({
      wave,
      curationId: "curation-1",
      page: 2,
      pageSize: 25,
    });
  });
});
