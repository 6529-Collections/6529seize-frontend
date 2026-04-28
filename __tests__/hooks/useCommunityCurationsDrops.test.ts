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

const buildDrop = ({
  id,
  mimeType,
}: {
  readonly id: string;
  readonly mimeType?: string | undefined;
}): ApiDrop =>
  ({
    id,
    metadata: [],
    nft_links: [],
    parts: mimeType
      ? [
          {
            media: [{ mime_type: mimeType }],
          },
        ]
      : [],
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

  it("dedupes loaded drops and keeps existing media filtering", () => {
    const imageDrop = buildDrop({ id: "image-drop", mimeType: "image/png" });
    const videoDrop = buildDrop({ id: "video-drop", mimeType: "video/mp4" });
    const duplicateVideoDrop = buildDrop({
      id: "video-drop",
      mimeType: "video/mp4",
    });

    mockUseInfiniteQuery.mockReturnValue(
      getDefaultQueryResult([
        {
          data: [imageDrop, videoDrop],
          page: 1,
          next: true,
        },
        {
          data: [duplicateVideoDrop],
          page: 2,
          next: false,
        },
      ])
    );

    const { result } = renderHook(() =>
      useCommunityCurationsDrops({ limit: 12, mediaFilter: "video" })
    );

    expect(result.current.allDrops.map((drop) => drop.id)).toEqual([
      "image-drop",
      "video-drop",
    ]);
    expect(result.current.drops.map((drop) => drop.id)).toEqual(["video-drop"]);
  });
});
