import { commonApiFetch } from "@/services/api/common-api";
import { fetchArtistMemeCardIds } from "@/services/api/meme-artist-api";

jest.mock("@/services/api/common-api", () => ({ commonApiFetch: jest.fn() }));
const fetchMock = jest.mocked(commonApiFetch);

beforeEach(() => fetchMock.mockReset());

it("combines earlier cards with explicit minted winners and rejects active, unmapped and invalid IDs", async () => {
  fetchMock.mockResolvedValue({
    data: [
      { submission_context: { status: "WINNER", meme_card_id: 479 } },
      { submission_context: { status: "WINNER", meme_card_id: 343 } },
      { submission_context: { status: "ACTIVE", meme_card_id: 900 } },
      { submission_context: { status: "WINNER" } },
      { submission_context: { status: "WINNER", meme_card_id: -1 } },
    ],
  });
  const signal = new AbortController().signal;
  await expect(
    fetchArtistMemeCardIds(
      {
        artist_of_prevote_cards: [37, 37, 0, 2.5],
        winner_main_stage_drop_ids: ["one", "two", "one"],
      },
      signal
    )
  ).resolves.toEqual([479, 343, 37]);
  expect(fetchMock).toHaveBeenCalledWith({
    endpoint: "v2/drops",
    params: { ids: "one,two", page_size: "2" },
    signal,
  });
});

it("batches more than 100 winners without omitting the final batch", async () => {
  fetchMock.mockResolvedValueOnce({
    data: [{ submission_context: { status: "WINNER", meme_card_id: 100 } }],
  });
  fetchMock.mockResolvedValueOnce({
    data: [{ submission_context: { status: "WINNER", meme_card_id: 101 } }],
  });
  await expect(
    fetchArtistMemeCardIds(
      {
        artist_of_prevote_cards: [],
        winner_main_stage_drop_ids: Array.from({ length: 101 }, (_, index) =>
          String(index + 1)
        ),
      },
      new AbortController().signal
    )
  ).resolves.toEqual([101, 100]);
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(fetchMock).toHaveBeenLastCalledWith(
    expect.objectContaining({ params: { ids: "101", page_size: "1" } })
  );
});

it("preserves lookup failures so the gallery can offer retry", async () => {
  fetchMock.mockRejectedValue(new Error("Network unavailable"));
  await expect(
    fetchArtistMemeCardIds(
      { artist_of_prevote_cards: [37], winner_main_stage_drop_ids: ["winner"] },
      new AbortController().signal
    )
  ).rejects.toThrow("Network unavailable");
});

it("requires no winner request for an artist with only earlier cards", async () => {
  await expect(
    fetchArtistMemeCardIds(
      { artist_of_prevote_cards: [3, 1], winner_main_stage_drop_ids: [] },
      new AbortController().signal
    )
  ).resolves.toEqual([3, 1]);
  expect(fetchMock).not.toHaveBeenCalled();
});
