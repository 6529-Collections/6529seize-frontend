import { renderHook } from "@testing-library/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
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
    typeof waveId === "string" ? waveId.trim() || null : (waveId ?? null)
  ),
  toApiWaveMin: jest.fn((wave) => ({ id: wave.id })),
}));

const useInfiniteQueryMock = useInfiniteQuery as jest.Mock;
const fetchWaveDropsSearchV2Mock = fetchWaveDropsSearchV2 as jest.Mock;
const wave = { id: "wave-1" } as ApiWave;

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
            authorId: null,
            after: null,
            before: null,
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
      authorId: undefined,
      after: undefined,
      before: undefined,
      page: 2,
      size: 25,
    });
  });

  it("supports a filter-only search", async () => {
    renderHook(() =>
      useWaveDropsSearch({
        wave,
        term: "",
        authorId: "author-1",
        after: 100,
        before: 200,
        enabled: true,
      })
    );

    const options = useInfiniteQueryMock.mock.calls[0][0];
    expect(options.enabled).toBe(true);
    await options.queryFn({ pageParam: 1 });
    expect(fetchWaveDropsSearchV2Mock).toHaveBeenCalledWith({
      wave,
      term: "",
      authorId: "author-1",
      after: 100,
      before: 200,
      page: 1,
      size: 50,
    });
  });

  it("does not enable one- or two-character terms, even with filters", () => {
    renderHook(() => useWaveDropsSearch({ wave, term: "lo", enabled: true }));
    expect(useInfiniteQueryMock.mock.calls.at(-1)?.[0].enabled).toBe(false);

    renderHook(() =>
      useWaveDropsSearch({
        wave,
        term: "lo",
        authorId: "author-1",
        enabled: true,
      })
    );
    expect(useInfiniteQueryMock.mock.calls.at(-1)?.[0].enabled).toBe(false);
  });
});
