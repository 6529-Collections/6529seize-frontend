import { ApiDropMainType } from "@/generated/models/ApiDropMainType";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropV2 } from "@/generated/models/ApiDropV2";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import { ApiSubmissionDropStatus } from "@/generated/models/ApiSubmissionDropStatus";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";
import {
  fetchBoostedDropsV2,
  fetchDropPollOptionVotersV2,
  fetchDropMetadataByIdV2,
  fetchDropRepliesV2,
  fetchDropsV2ByIds,
  fetchDropV2ById,
  fetchGlobalBoostedDropsV2,
  fetchWaveDropsFeedV2,
  fetchWaveCompetitionDropsV2,
  mapLeaderboardDropV2,
  voteDropPollV2,
} from "@/services/api/wave-drops-v2-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  commonApiFetchWithRetry: jest.fn(),
  commonApiPost: jest.fn(),
}));

const commonApiFetchMock = commonApiFetch as jest.MockedFunction<
  typeof commonApiFetch
>;
const commonApiPostMock = commonApiPost as jest.MockedFunction<
  typeof commonApiPost
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

const priorityMetadata = [
  {
    data_key: "additional_media",
    data_value: JSON.stringify({
      preview_image: "ipfs://preview-image",
    }),
  },
];

const poll = {
  id: "poll-1",
  options: [
    {
      option_no: 1,
      option_string: "First",
      votes: 2,
    },
    {
      option_no: 2,
      option_string: "Second",
      votes: 3,
    },
  ],
  voted: [2],
  multichoice: false,
  anonymous: false,
  closing_time: Date.now() + 60_000,
  is_open: true,
};

const createEnrichableDrop = (overrides: Partial<ApiDropV2> = {}) => ({
  ...createDrop(1),
  drop_type: ApiDropMainType.Submission,
  priority_metadata: priorityMetadata,
  submission_context: {
    status: ApiSubmissionDropStatus.Active,
    has_metadata: true,
    voting: {
      is_open: true,
      total_votes_given: 14,
      current_calculated_vote: 10,
      predicted_final_vote: 12,
      voters_count: 7,
      place: 2,
    },
  },
  ...overrides,
});

const waveMin = {
  id: "wave-1",
  name: "Wave 1",
  picture: null,
  voting_credit_type: "TDH",
} as unknown as ApiWaveMin;

const expectNoListEnrichmentCalls = () => {
  expect(commonApiFetchMock).not.toHaveBeenCalledWith(
    expect.objectContaining({
      endpoint: expect.stringContaining("/metadata"),
    })
  );
  expect(commonApiFetchMock).not.toHaveBeenCalledWith(
    expect.objectContaining({
      endpoint: expect.stringContaining("/votes"),
    })
  );
};

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

  it("loads full competition drops only from the lazy author endpoint", async () => {
    commonApiFetchMock.mockResolvedValueOnce({
      data: [
        {
          ...createDrop(1),
          drop_type: ApiDropMainType.Participatory,
          submission_context: {
            voting: {
              is_open: false,
            },
          },
        },
      ],
      page: 1,
      next: false,
    });

    const result = await fetchWaveCompetitionDropsV2({
      wave: { id: "wave-1", name: "Cool Comp" } as ApiWaveMin,
      authorId: "author-1",
      dropType: ApiDropType.Participatory,
      page: 1,
      pageSize: 50,
    });

    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "v2/waves/wave-1/competition-drops",
      params: {
        author_id: "author-1",
        drop_type: ApiDropType.Participatory,
        page: "1",
        page_size: "50",
      },
      signal: undefined,
    });
    expect(result).toEqual(
      expect.objectContaining({
        data: [expect.objectContaining({ id: "drop-1", voting_open: false })],
        page: 1,
        next: false,
      })
    );
  });

  it("preserves V2 author badges and wave participation without fabricating legacy artwork ids", async () => {
    const badges = {
      artist_of_main_stage_submissions: 1,
      artist_of_memes: 1,
      profile_wave_id: "profile-wave-1",
      profile_wave_name: "Profile Wave",
      profile_wave_pfp: "https://example.com/wave.png",
    };
    const waveParticipation = {
      is_participant: true,
      is_winner: true,
    };

    commonApiFetchMock.mockResolvedValueOnce({
      wave,
      drops: [
        {
          ...createDrop(1),
          author: {
            ...identity,
            badges,
            wave_participation: waveParticipation,
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
        wave_participation: waveParticipation,
      })
    );
  });

  it("maps V2 priority metadata into hydrated legacy drops", async () => {
    commonApiFetchMock.mockResolvedValueOnce({
      wave,
      drops: [
        {
          ...createDrop(1),
          priority_metadata: priorityMetadata,
        },
      ],
    });

    const result = await fetchWaveDropsFeedV2({
      waveId: "wave-1",
      limit: 20,
    });

    expect(commonApiFetchMock).toHaveBeenCalledTimes(1);
    expect(result.drops[0]?.metadata).toEqual(priorityMetadata);
  });

  it("preserves V2 poll data on hydrated legacy drops", async () => {
    commonApiFetchMock.mockResolvedValueOnce({
      wave,
      drops: [
        {
          ...createDrop(1),
          poll,
        },
      ],
    });

    const result = await fetchWaveDropsFeedV2({
      waveId: "wave-1",
      limit: 20,
    });

    expect(result.drops[0]?.poll).toEqual(poll);
  });

  it("preserves no-negative vote waves on feed and drop results", async () => {
    commonApiFetchMock.mockResolvedValueOnce({
      wave: {
        ...wave,
        forbid_negative_votes: true,
      },
      drops: [createDrop(1)],
    });

    const result = await fetchWaveDropsFeedV2({
      waveId: "wave-1",
      limit: 20,
    });

    expect(result.wave.forbid_negative_votes).toBe(true);
    expect(result.drops[0]?.wave.forbid_negative_votes).toBe(true);
  });

  it("does not fetch full metadata or top raters for list drops", async () => {
    commonApiFetchMock.mockResolvedValueOnce({
      wave,
      drops: [createEnrichableDrop()],
    });

    const result = await fetchWaveDropsFeedV2({
      waveId: "wave-1",
      limit: 20,
    });

    expect(commonApiFetchMock).toHaveBeenCalledTimes(1);
    expectNoListEnrichmentCalls();
    expect(result.drops[0]?.metadata).toEqual(priorityMetadata);
    expect(result.drops[0]?.top_raters).toEqual([]);
    expect(result.drops[0]?.raters_count).toBe(7);
    expect(result.drops[0]).toEqual(
      expect.objectContaining({
        rating: 10,
        realtime_rating: 14,
        rating_prediction: 12,
      })
    );
  });

  it("preserves the over-threshold timestamp on hydrated legacy drops", async () => {
    commonApiFetchMock.mockResolvedValueOnce({
      wave,
      drops: [
        createEnrichableDrop({
          submission_context: {
            ...createEnrichableDrop().submission_context,
            over_threshold_since_ms: 123_456,
          },
        } as Partial<ApiDropV2>),
      ],
    });

    const result = await fetchWaveDropsFeedV2({
      waveId: "wave-1",
      limit: 20,
    });

    expect(result.drops[0]).toEqual(
      expect.objectContaining({
        over_threshold_since_ms: 123_456,
      })
    );
  });

  it("leaves missing over-threshold timestamps unset on hydrated drops", async () => {
    commonApiFetchMock.mockResolvedValueOnce({
      wave,
      drops: [createEnrichableDrop()],
    });

    const result = await fetchWaveDropsFeedV2({
      waveId: "wave-1",
      limit: 20,
    });

    expect(
      (result.drops[0] as { readonly over_threshold_since_ms?: number })
        ?.over_threshold_since_ms
    ).toBeUndefined();
  });

  it("maps V2 priority metadata into leaderboard legacy drops", () => {
    const priorityMetadata = [
      {
        data_key: "additional_media",
        data_value: JSON.stringify({
          preview_image: "ipfs://leaderboard-preview-image",
        }),
      },
    ];

    const drop = mapLeaderboardDropV2({
      drop: {
        ...createDrop(1),
        priority_metadata: priorityMetadata,
      } as unknown as ApiDropV2,
      wave: {
        id: "wave-1",
        name: "Wave 1",
        picture: null,
        voting_credit_type: "TDH",
      } as unknown as ApiWaveMin,
    });

    expect(drop.metadata).toEqual(priorityMetadata);
  });

  it("preserves V2 poll data on leaderboard legacy drops", () => {
    const drop = mapLeaderboardDropV2({
      drop: {
        ...createDrop(1),
        poll,
      } as unknown as ApiDropV2,
      wave: {
        id: "wave-1",
        name: "Wave 1",
        picture: null,
        voting_credit_type: "TDH",
      } as unknown as ApiWaveMin,
    });

    expect(drop.poll).toEqual(poll);
  });

  it("preserves the over-threshold timestamp on leaderboard drops", () => {
    const drop = mapLeaderboardDropV2({
      drop: createEnrichableDrop({
        submission_context: {
          ...createEnrichableDrop().submission_context,
          over_threshold_since_ms: 123_456,
        },
      }) as unknown as ApiDropV2,
      wave: {
        id: "wave-1",
        name: "Wave 1",
        picture: null,
        voting_credit_type: "TDH",
      } as unknown as ApiWaveMin,
    });

    expect(drop).toEqual(
      expect.objectContaining({
        over_threshold_since_ms: 123_456,
      })
    );
  });

  it("carries a Main Stage Meme card ID into the legacy winning context", () => {
    const drop = mapLeaderboardDropV2({
      drop: createEnrichableDrop({
        submission_context: {
          ...createEnrichableDrop().submission_context,
          status: ApiSubmissionDropStatus.Winner,
          meme_card_id: 521,
        },
      }) as unknown as ApiDropV2,
      wave: {
        id: "wave-1",
        name: "Wave 1",
        picture: null,
        voting_credit_type: "TDH",
      } as unknown as ApiWaveMin,
    });

    expect(drop.winning_context).toEqual(
      expect.objectContaining({ meme_card_id: 521 })
    );
  });

  it("maps V2 submission voting totals into leaderboard legacy vote fields", () => {
    const drop = mapLeaderboardDropV2({
      drop: createEnrichableDrop() as unknown as ApiDropV2,
      wave: {
        id: "wave-1",
        name: "Wave 1",
        picture: null,
        voting_credit_type: "TDH",
      } as unknown as ApiWaveMin,
    });

    expect(drop).toEqual(
      expect.objectContaining({
        rating: 10,
        realtime_rating: 14,
        rating_prediction: 12,
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

describe("fetchDropRepliesV2", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not fetch full metadata or top raters for reply lists", async () => {
    commonApiFetchMock.mockResolvedValueOnce({
      data: [createEnrichableDrop()],
      count: 1,
      page: 1,
      next: false,
    });

    const result = await fetchDropRepliesV2({
      parentDropId: "parent-drop",
      page: 1,
      pageSize: 20,
      wave: waveMin,
    });

    expect(commonApiFetchMock).toHaveBeenCalledTimes(1);
    expect(commonApiFetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "v2/drops",
      })
    );
    expectNoListEnrichmentCalls();
    expect(result.drops[0]?.metadata).toEqual(priorityMetadata);
    expect(result.drops[0]?.top_raters).toEqual([]);
  });
});

describe("fetchBoostedDropsV2", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not fetch full metadata or top raters for boosted drop lists", async () => {
    commonApiFetchMock.mockResolvedValueOnce({
      data: [createEnrichableDrop()],
      count: 1,
      page: 1,
      next: false,
    });

    const result = await fetchBoostedDropsV2({
      waveId: "wave-1",
      wave: waveMin,
      limit: 10,
    });

    expect(commonApiFetchMock).toHaveBeenCalledTimes(1);
    expect(commonApiFetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "v2/boosted-drops",
      })
    );
    expectNoListEnrichmentCalls();
    expect(result[0]?.metadata).toEqual(priorityMetadata);
    expect(result[0]?.top_raters).toEqual([]);
  });
});

describe("fetchGlobalBoostedDropsV2", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches global boosted drops through v2 with the minimum boosts filter", async () => {
    commonApiFetchMock.mockResolvedValueOnce({
      data: [createEnrichableDrop({ wave })],
      count: 1,
      page: 1,
      next: false,
    });

    const result = await fetchGlobalBoostedDropsV2({
      limit: 50,
      countOnlyBoostsAfter: 123,
      minBoosts: 3,
    });

    expect(commonApiFetchMock).toHaveBeenCalledTimes(1);
    expect(commonApiFetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "v2/boosted-drops",
        params: expect.objectContaining({
          sort: "boosts",
          sort_direction: "DESC",
          page_size: "50",
          count_only_boosts_after: "123",
          min_boosts: "3",
        }),
      })
    );
    expectNoListEnrichmentCalls();
    expect(result[0]?.wave).toEqual(
      expect.objectContaining({
        id: "wave-1",
        name: "Wave 1",
      })
    );
  });
});

describe("fetchDropV2ById", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches drop metadata by id without fetching the drop detail", async () => {
    const fullMetadata = [{ data_key: "artist", data_value: "Alice" }];
    commonApiFetchMock.mockResolvedValueOnce(fullMetadata);

    const result = await fetchDropMetadataByIdV2({
      dropId: "drop-1",
      priorityMetadata,
    });

    expect(commonApiFetchMock).toHaveBeenCalledTimes(1);
    expect(commonApiFetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "v2/drops/drop-1/metadata",
      })
    );
    expect(commonApiFetchMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "v2/drops/drop-1",
      })
    );
    expect(result).toEqual([...priorityMetadata, ...fullMetadata]);
  });

  it("keeps by-id drop hydration lean by default", async () => {
    commonApiFetchMock.mockResolvedValueOnce({
      wave,
      drop: createEnrichableDrop(),
    });

    const result = await fetchDropV2ById("drop-1");

    expect(commonApiFetchMock).toHaveBeenCalledTimes(1);
    expect(commonApiFetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "v2/drops/drop-1",
      })
    );
    expectNoListEnrichmentCalls();
    expect(result.metadata).toEqual(priorityMetadata);
    expect(result.top_raters).toEqual([]);
  });

  it("allows explicit full metadata hydration while top raters are skipped", async () => {
    const fullMetadata = [{ data_key: "artist", data_value: "Alice" }];
    commonApiFetchMock
      .mockResolvedValueOnce({
        wave,
        drop: createEnrichableDrop(),
      })
      .mockResolvedValueOnce(fullMetadata);

    const result = await fetchDropV2ById("drop-1", undefined, {
      includeFullMetadata: true,
      includeTopRaters: false,
    });

    expect(commonApiFetchMock).toHaveBeenCalledTimes(2);
    expect(commonApiFetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "v2/drops/drop-1",
      })
    );
    expect(commonApiFetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "v2/drops/drop-1/metadata",
      })
    );
    expect(commonApiFetchMock).not.toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: expect.stringContaining("/votes"),
      })
    );
    expect(result.metadata).toEqual([...priorityMetadata, ...fullMetadata]);
    expect(result.top_raters).toEqual([]);
  });
});

describe("drop poll helpers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("votes through the V2 poll endpoint with a JSON options array", async () => {
    commonApiPostMock.mockResolvedValueOnce({
      ...createDrop(1),
      poll: {
        ...poll,
        voted: [1],
      },
    });

    const result = await voteDropPollV2({
      drop: {
        id: "drop-1",
        wave: waveMin,
      } as unknown as ApiDrop,
      options: [1],
    });

    expect(commonApiPostMock).toHaveBeenCalledWith({
      endpoint: "v2/drops/drop-1/poll/vote",
      body: {
        options: [1],
      },
    });
    expect(result.poll?.voted).toEqual([1]);
  });

  it("fetches V2 poll option voters with pagination params", async () => {
    commonApiFetchMock.mockResolvedValueOnce({
      data: [],
      count: 0,
      page: 2,
      next: false,
    });

    await fetchDropPollOptionVotersV2({
      dropId: "drop 1",
      optionNo: 2,
      page: 2,
      pageSize: 20,
    });

    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "v2/drops/drop%201/poll/2/voters",
      params: {
        page: "2",
        page_size: "20",
      },
      signal: undefined,
    });
  });
});

describe("fetchDropsV2ByIds", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches multiple drops through the v2 drops ids filter", async () => {
    commonApiFetchMock.mockResolvedValueOnce({
      data: [
        { ...createDrop(1), id: "drop-1", wave },
        { ...createDrop(1), id: "drop-2", wave },
      ],
      page: 1,
      next: false,
    });

    const result = await fetchDropsV2ByIds({
      dropIds: ["drop-1", "drop-2"],
    });

    expect(commonApiFetchMock).toHaveBeenCalledTimes(1);
    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "v2/drops",
      params: {
        ids: "drop-1,drop-2",
        page_size: "2",
      },
      signal: undefined,
    });
    expect(result.map((drop) => drop.id)).toEqual(["drop-1", "drop-2"]);
    expect(result[0]?.wave).toEqual(
      expect.objectContaining({
        id: "wave-1",
        name: "Wave 1",
      })
    );
  });

  it("keeps ids-filter hydration lean by default", async () => {
    commonApiFetchMock.mockResolvedValueOnce({
      data: [createEnrichableDrop({ wave })],
      page: 1,
      next: false,
    });

    const result = await fetchDropsV2ByIds({
      dropIds: ["drop-1"],
    });

    expect(commonApiFetchMock).toHaveBeenCalledTimes(1);
    expectNoListEnrichmentCalls();
    expect(result[0]?.metadata).toEqual(priorityMetadata);
    expect(result[0]?.top_raters).toEqual([]);
  });

  it("omits malformed ids-filter drops without embedded wave data", async () => {
    commonApiFetchMock.mockResolvedValueOnce({
      data: [createDrop(1)],
      page: 1,
      next: false,
    });

    const result = await fetchDropsV2ByIds({
      dropIds: ["drop-1"],
    });

    expect(result).toEqual([]);
  });
});
