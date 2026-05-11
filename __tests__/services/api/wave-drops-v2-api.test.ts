import { ApiDropMainType } from "@/generated/models/ApiDropMainType";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import { commonApiFetch } from "@/services/api/common-api";
import { fetchWaveDropsFeedV2 } from "@/services/api/wave-drops-v2-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiFetchWithRetry: jest.fn(),
}));

const commonApiFetchMock = commonApiFetch as jest.MockedFunction<
  typeof commonApiFetch
>;

const identity = {
  id: "author-id",
  handle: "author",
  primary_address: "0xauthor",
  pfp: "author.png",
  level: 1,
  classification: ApiProfileClassification.Pseudonym,
  badges: {},
};

const wave = {
  id: "wave-1",
  name: "Wave 1",
  pfp: "wave.png",
  last_drop_time: 100,
  created_at: 50,
  subscribers_count: 1,
  has_competition: false,
  is_dm_wave: false,
  description_drop: {
    id: "description-drop",
    title: "Wave 1",
    description: "Description",
  },
  total_drops_count: 1,
  is_private: false,
  context_profile_context: {
    subscribed: true,
    pinned: false,
    can_chat: true,
    unread_drops: 0,
    muted: false,
  },
};

const createDrop = (partsCount: number) => ({
  id: "drop-1",
  serial_no: 1,
  created_at: 1000,
  updated_at: null,
  is_signed: false,
  hide_link_preview: false,
  title: "Title",
  content: "Part 1",
  media: [],
  attachments: [],
  parts_count: partsCount,
  author: identity,
  drop_type: ApiDropMainType.Chat,
  referenced_nfts: [],
  mentioned_users: [],
  mentioned_groups: [],
  mentioned_waves: [],
  nft_links: [],
  reactions: [],
  boosts: 0,
  context_profile_context: {
    reaction: null,
    boosted: false,
    bookmarked: false,
  },
});

describe("fetchWaveDropsFeedV2", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses ApiDropV2 as part one without fetching the part endpoint", async () => {
    commonApiFetchMock.mockResolvedValueOnce({
      wave,
      drops: [createDrop(1)],
    });

    const result = await fetchWaveDropsFeedV2({
      waveId: "wave-1",
      limit: 20,
    });

    expect(commonApiFetchMock).toHaveBeenCalledTimes(1);
    expect(commonApiFetchMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: expect.stringContaining("/parts/1"),
      })
    );
    expect(result.drops[0]?.parts).toEqual([
      expect.objectContaining({
        part_id: 1,
        content: "Part 1",
      }),
    ]);
  });

  it("preserves V2 author badges without fabricating legacy artwork ids", async () => {
    const badges = {
      artist_of_main_stage_submissions: 1,
      artist_of_memes: 1,
      profile_wave_id: "profile-wave-1",
    };

    commonApiFetchMock.mockResolvedValueOnce({
      wave,
      drops: [
        {
          ...createDrop(1),
          author: {
            ...identity,
            badges,
          },
        },
      ],
    });

    const result = await fetchWaveDropsFeedV2({
      waveId: "wave-1",
      limit: 20,
    });

    expect(result.drops[0]?.author).toEqual(
      expect.objectContaining({
        active_main_stage_submission_ids: [],
        artist_of_prevote_cards: [],
        badges,
        is_wave_creator: true,
        profile_wave_id: "profile-wave-1",
        winner_main_stage_drop_ids: [],
      })
    );
  });

  it("fetches only additional parts for multi-part drops", async () => {
    commonApiFetchMock
      .mockResolvedValueOnce({
        wave,
        drops: [createDrop(2)],
      })
      .mockResolvedValueOnce({
        part_no: 2,
        content: "Part 2",
        media: [],
        attachments: [],
        quoted_drop: null,
      });

    const result = await fetchWaveDropsFeedV2({
      waveId: "wave-1",
      limit: 20,
    });

    expect(commonApiFetchMock).toHaveBeenCalledTimes(2);
    expect(commonApiFetchMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: expect.stringContaining("/parts/1"),
      })
    );
    expect(commonApiFetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "v2/drops/drop-1/parts/2",
      })
    );
    expect(result.drops[0]?.parts.map((part) => part.content)).toEqual([
      "Part 1",
      "Part 2",
    ]);
  });

  it("rethrows abort errors from additional part fetches", async () => {
    const abortError = new DOMException("Aborted", "AbortError");
    commonApiFetchMock
      .mockResolvedValueOnce({
        wave,
        drops: [createDrop(2)],
      })
      .mockRejectedValueOnce(abortError);

    await expect(
      fetchWaveDropsFeedV2({
        waveId: "wave-1",
        limit: 20,
      })
    ).rejects.toBe(abortError);
  });
});
