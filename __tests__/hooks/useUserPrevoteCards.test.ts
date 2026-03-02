import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { MEMES_CONTRACT } from "@/constants/constants";
import { CollectedCollectionType } from "@/entities/IProfile";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { useUserPrevoteCards } from "@/hooks/useUserPrevoteCards";
import { renderHook } from "@testing-library/react";

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
}));

const { useQuery } = require("@tanstack/react-query");

describe("useUserPrevoteCards", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deduplicates, sorts ids descending, and maps cards in that order", () => {
    useQuery.mockReturnValue({
      data: {
        data: [
          {
            id: 1,
            name: "Meme #1",
            scaled: "/1.png",
            thumbnail: "/1-thumb.png",
            image: null,
            tdh: 10,
            tdh_rank: 100,
          },
          {
            id: 2,
            name: "Meme #2",
            scaled: "/2.png",
            thumbnail: "/2-thumb.png",
            image: null,
            tdh: 20,
            tdh_rank: 50,
          },
          {
            id: 3,
            name: "Meme #3",
            scaled: "/3.png",
            thumbnail: "/3-thumb.png",
            image: null,
            tdh: 30,
            tdh_rank: 10,
          },
        ],
      },
      isLoading: false,
      isError: false,
    });

    const user = {
      artist_of_prevote_cards: [2, 1, 3, 2],
    } as ApiProfileMin;

    const { result } = renderHook(() =>
      useUserPrevoteCards({ user, enabled: true })
    );

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          QueryKey.NFTS,
          {
            contract: MEMES_CONTRACT,
            ids: "3,2,1",
            scope: "artist-prevote-cards",
          },
        ],
        enabled: true,
      })
    );

    expect(result.current.prevoteCardIds).toEqual([3, 2, 1]);
    expect(result.current.prevoteCards.map((card) => card.token_id)).toEqual([
      3, 2, 1,
    ]);
    expect(result.current.prevoteCards[0]?.collection).toBe(
      CollectedCollectionType.MEMES
    );
  });

  it("disables the query when there are no prevote ids", () => {
    useQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    });

    const user = {
      artist_of_prevote_cards: [],
    } as ApiProfileMin;

    const { result } = renderHook(() =>
      useUserPrevoteCards({ user, enabled: true })
    );

    expect(useQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    );
    expect(result.current.prevoteCards).toEqual([]);
    expect(result.current.prevoteCardIds).toEqual([]);
  });
});
