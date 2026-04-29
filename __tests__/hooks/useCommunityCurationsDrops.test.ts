import { renderHook } from "@testing-library/react";
import type { ApiCuratedProfileWaveDropsPage } from "@/generated/models/ApiCuratedProfileWaveDropsPage";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { useCommunityCurationsDrops } from "@/hooks/useCommunityCurationsDrops";
import { commonApiFetch } from "@/services/api/common-api";

type InfiniteQueryOptions = {
  readonly queryFn: (context: {
    readonly pageParam: number;
  }) => Promise<unknown>;
  readonly getNextPageParam: (
    lastPage: ApiCuratedProfileWaveDropsPage
  ) => number | undefined;
  readonly enabled?: boolean;
  readonly initialPageParam?: number;
  readonly queryKey?: unknown;
};

const mockUseInfiniteQuery = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useInfiniteQuery: (options: InfiniteQueryOptions) =>
    mockUseInfiniteQuery(options),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const commonApiFetchMock = commonApiFetch as jest.MockedFunction<
  typeof commonApiFetch
>;

const getDefaultQueryResult = (
  pages: ApiCuratedProfileWaveDropsPage[] | undefined = undefined
) => ({
  data: pages ? { pages } : undefined,
  fetchNextPage: jest.fn(),
  hasNextPage: false,
  isError: false,
  isFetchingNextPage: false,
  isLoading: false,
});

const buildDrop = ({ id }: { readonly id: string }): ApiDrop =>
  ({
    id,
    metadata: [],
    nft_links: [],
    parts: [],
  }) as unknown as ApiDrop;

describe("useCommunityCurationsDrops", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseInfiniteQuery.mockReturnValue(getDefaultQueryResult());
  });

  it("fetches curated profile wave drops with page pagination", async () => {
    let queryOptions: InfiniteQueryOptions | null = null;
    mockUseInfiniteQuery.mockImplementation((options: InfiniteQueryOptions) => {
      queryOptions = options;
      return getDefaultQueryResult();
    });

    renderHook(() => useCommunityCurationsDrops({ limit: 12 }));

    expect(queryOptions).not.toBeNull();
    expect(queryOptions?.initialPageParam).toBe(1);

    await queryOptions?.queryFn({ pageParam: 2 });

    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "curated-profile-wave-drops",
      params: {
        page: "2",
        page_size: "12",
      },
    });
    expect(
      queryOptions?.getNextPageParam({
        data: [],
        page: 2,
        next: true,
      })
    ).toBe(3);
    expect(
      queryOptions?.getNextPageParam({
        data: [],
        page: 2,
        next: false,
      })
    ).toBeUndefined();
  });

  it("dedupes loaded drops", () => {
    const firstDrop = buildDrop({ id: "first-drop" });
    const secondDrop = buildDrop({ id: "second-drop" });
    const duplicateSecondDrop = buildDrop({ id: "second-drop" });

    mockUseInfiniteQuery.mockReturnValue(
      getDefaultQueryResult([
        {
          data: [firstDrop, secondDrop],
          page: 1,
          next: true,
        },
        {
          data: [duplicateSecondDrop],
          page: 2,
          next: false,
        },
      ])
    );

    const { result } = renderHook(() =>
      useCommunityCurationsDrops({ limit: 12 })
    );

    expect(result.current.allDrops.map((drop) => drop.id)).toEqual([
      "first-drop",
      "second-drop",
    ]);
    expect(result.current.drops.map((drop) => drop.id)).toEqual([
      "first-drop",
      "second-drop",
    ]);
  });
});
