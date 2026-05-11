import { renderHook } from "@testing-library/react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropMainType } from "@/generated/models/ApiDropMainType";
import type { ApiDropV2 } from "@/generated/models/ApiDropV2";
import type { ApiDropV2PageWithoutCount } from "@/generated/models/ApiDropV2PageWithoutCount";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import { useCommunityCurationsDrops } from "@/hooks/useCommunityCurationsDrops";
import { commonApiFetch } from "@/services/api/common-api";

type CommunityCurationsDropsPage = {
  readonly data: ApiDrop[];
  readonly page: number;
  readonly next: boolean;
};

type InfiniteQueryOptions = {
  readonly queryFn: (context: {
    readonly pageParam: number;
  }) => Promise<unknown>;
  readonly getNextPageParam: (
    lastPage: CommunityCurationsDropsPage
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
  pages: CommunityCurationsDropsPage[] | undefined = undefined
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

const buildDropV2 = ({ id }: { readonly id: string }): ApiDropV2 =>
  ({
    id,
    serial_no: 1,
    created_at: 1000,
    updated_at: null,
    is_signed: false,
    hide_link_preview: false,
    title: "Curated drop",
    content: "Part 1",
    media: [],
    attachments: [],
    parts_count: 1,
    author: {
      id: "author-id",
      handle: "artist",
      primary_address: "0xauthor",
      pfp: "author.png",
      level: 1,
      classification: ApiProfileClassification.Pseudonym,
      badges: {
        artist_of_main_stage_submissions: 0,
        artist_of_memes: 0,
        profile_wave_id: "profile-wave-1",
      },
    },
    drop_type: ApiDropMainType.Chat,
    referenced_nfts: [],
    mentioned_users: [],
    mentioned_groups: [],
    mentioned_waves: [],
    nft_links: [],
    reactions: [{ reaction: "👍", count: 2 }],
    boosts: 0,
    context_profile_context: {
      reaction: null,
      boosted: false,
      bookmarked: false,
    },
  }) as unknown as ApiDropV2;

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

    commonApiFetchMock.mockResolvedValueOnce({
      data: [buildDropV2({ id: "curated-drop-1" })],
      page: 2,
      next: true,
    } as ApiDropV2PageWithoutCount);

    const response = await queryOptions?.queryFn({ pageParam: 2 });

    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "v2/curated-profile-wave-drops",
      params: {
        page: "2",
        page_size: "12",
      },
    });
    expect(response).toEqual({
      data: [
        expect.objectContaining({
          id: "curated-drop-1",
          parts: [
            expect.objectContaining({
              content: "Part 1",
              part_id: 1,
            }),
          ],
          reactions: [
            expect.objectContaining({
              count: 2,
              profiles: [],
              reaction: "👍",
            }),
          ],
          wave: expect.objectContaining({
            id: "profile-wave-1",
          }),
        }),
      ],
      page: 2,
      next: true,
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
