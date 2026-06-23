import { renderHook } from "@testing-library/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useWaveDropsSearch } from "@/hooks/useWaveDropsSearch";
import { fetchWaveDropsSearchV2 } from "@/services/api/wave-drops-v2-api";

jest.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: jest.fn(),
}));
jest.mock("@/services/api/wave-drops-v2-api", () => ({
  fetchWaveDropsSearchV2: jest.fn(),
}));
jest.mock("@/helpers/waves/wave.helpers", () => ({
  normalizeOptionalWaveId: jest.fn((waveId) =>
    typeof waveId === "string" ? waveId.trim() || null : waveId ?? null
  ),
  toApiWaveMin: jest.fn((wave) => ({ id: wave.id })),
}));

const useInfiniteQueryMock = useInfiniteQuery as jest.Mock;
const fetchWaveDropsSearchV2Mock = fetchWaveDropsSearchV2 as jest.Mock;

describe("useWaveDropsSearch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useInfiniteQueryMock.mockReturnValue({
      data: { pages: [] },
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
      refetch: jest.fn(),
    });
  });

  it("uses the v2 wave search adapter with trimmed terms", async () => {
    const wave = { id: "wave-1" } as any;
    fetchWaveDropsSearchV2Mock.mockResolvedValue({
      data: [],
      page: 2,
      next: false,
    });

    renderHook(() =>
      useWaveDropsSearch({
        wave,
        term: "  hello  ",
        enabled: true,
        size: 25,
      })
    );

    expect(useInfiniteQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          QueryKey.DROPS,
          {
            waveId: "wave-1",
            term: "hello",
            size: 25,
            context: "wave-search",
          },
        ],
        enabled: true,
        initialPageParam: 1,
      })
    );

    const options = useInfiniteQueryMock.mock.calls[0][0];
    await options.queryFn({ pageParam: 2 });

    expect(fetchWaveDropsSearchV2Mock).toHaveBeenCalledWith({
      wave,
      term: "hello",
      page: 2,
      size: 25,
    });
  });
});
