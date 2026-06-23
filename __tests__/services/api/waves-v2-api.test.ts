import { ApiSubwavesSort } from "@/generated/models/ApiSubwavesSort";
import { ApiWaveScoreSort } from "@/generated/models/ApiWaveScoreSort";
import { ApiWaveVisibilityTier } from "@/generated/models/ApiWaveVisibilityTier";
import { ApiWavesOverviewType } from "@/generated/models/ApiWavesOverviewType";
import {
  createWaveMetadata,
  deleteWaveMetadata,
  fetchWaveMetadata,
  fetchWavesV2Page,
  fetchWaveSubwavesPage,
  searchWavesByName,
} from "@/services/api/waves-v2-api";
import {
  commonApiDelete,
  commonApiFetch,
  commonApiPost,
} from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiDelete: jest.fn(),
  commonApiFetch: jest.fn(),
  commonApiPost: jest.fn(),
}));

const commonApiDeleteMock = commonApiDelete as jest.Mock;
const commonApiFetchMock = commonApiFetch as jest.Mock;
const commonApiPostMock = commonApiPost as jest.Mock;

describe("waves-v2-api", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("fetches subwaves with created-time sort and maps parent metadata", async () => {
    commonApiFetchMock.mockResolvedValue({
      page: 2,
      next: false,
      data: [
        {
          id: "child-wave",
          name: "Child Wave",
          created_at: 123,
          has_competition: false,
          pfp: null,
          contributors: [],
          is_dm_wave: false,
          parent_wave: { id: "api-parent" },
          has_subwaves: true,
          description_drop: {
            contents: null,
            media: [],
          },
          total_drops_count: 3,
          is_private: false,
          last_drop_time: 456,
          context_profile_context: {
            first_unread_drop_serial_no: 7,
            unread_drops: 2,
            followed_subwaves_count: 3,
            latest_followed_subwave_activity_timestamp: 999,
            hidden_followed_subwave_unread_drops: 4,
            first_hidden_followed_subwave_unread_drop_serial_no: 12,
            pinned: false,
            muted: false,
            subscribed: true,
          },
        },
      ],
    });

    const result = await fetchWaveSubwavesPage({
      parentWaveId: "parent-wave",
      page: 2,
      pageSize: 100,
    });

    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "waves/parent-wave/subwaves",
      params: {
        page: "2",
        page_size: "100",
        sort: ApiSubwavesSort.CreatedAt,
      },
    });
    expect(result).toMatchObject({
      page: 2,
      next: false,
      waves: [
        {
          id: "child-wave",
          createdAt: 123,
          parentWaveId: "parent-wave",
          hasSubwaves: false,
          unreadDropsCount: 2,
          firstUnreadDropSerialNo: 7,
          followedSubwavesCount: 3,
          latestFollowedSubwaveDropTimestamp: 999,
          unreadFollowedSubwaveDrops: 4,
          firstUnreadFollowedSubwaveDropSerialNo: 12,
          subscribed: true,
        },
      ],
    });
  });

  it("fetches scored overview waves and maps score fields", async () => {
    const waveScore = {
      score_version: "wave-score-v1",
      visibility_tier: ApiWaveVisibilityTier.TrustedVisible,
      quality_score: 71.2,
      hotness_score: 44.8,
      rep_sort_score: 58.4,
      visibility_score: 62.3,
      components: {
        creator_score: 0.5,
        level_weighted_participation_score: 0.7,
        trusted_diversity_score: 0.4,
        wave_rep_component_score: 0.58,
        trusted_subscription_score: 0.3,
        recent_trusted_activity_score: 0.2,
      },
      penalties: {
        single_actor_penalty: 1,
        low_trust_flood_penalty: 1,
        cross_post_pressure: 0,
        cross_post_penalty: 1,
        negative_rep_penalty: 1,
        safety_multiplier: 1,
      },
      calculated_at: 12345,
    };
    const waveRep = {
      total_rep: 100,
      positive_rep: 100,
      negative_rep: 0,
      contributor_count: 2,
      positive_contributor_count: 2,
      negative_contributor_count: 0,
      authenticated_user_contribution: null,
      categories: [],
    };
    commonApiFetchMock.mockResolvedValue({
      page: 1,
      next: false,
      data: [
        {
          id: "wave-1",
          name: "Wave 1",
          created_at: 123,
          creator: { id: "profile-1", handle: "creator" },
          has_competition: false,
          pfp: null,
          contributors: [],
          is_dm_wave: false,
          parent_wave: null,
          has_subwaves: false,
          description_drop: {
            contents: null,
            media: [],
          },
          total_drops_count: 3,
          is_private: false,
          last_drop_time: 456,
          context_profile_context: undefined,
          wave_rep: waveRep,
          wave_score: waveScore,
        },
      ],
    });

    const result = await fetchWavesV2Page({
      page: 1,
      pageSize: 20,
      overviewType: ApiWavesOverviewType.ScoredRecentlyDroppedTo,
      scoreSort: ApiWaveScoreSort.Hotness,
      minVisibilityScore: 50,
      minHotnessScore: 60,
      visibilityTier: ApiWaveVisibilityTier.TrustedVisible,
    });

    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "v2/waves",
      params: {
        view: "OVERVIEW",
        page: "1",
        page_size: "20",
        overview_type: ApiWavesOverviewType.ScoredRecentlyDroppedTo,
        only_waves_followed_by_authenticated_user: "false",
        score_sort: ApiWaveScoreSort.Hotness,
        min_visibility_score: "50",
        min_hotness_score: "60",
        visibility_tier: ApiWaveVisibilityTier.TrustedVisible,
      },
      headers: undefined,
    });
    expect(result.waves[0]).toMatchObject({
      id: "wave-1",
      creator: { id: "profile-1", handle: "creator" },
      waveRep,
      waveScore,
    });
  });

  it("fetches wave metadata", async () => {
    commonApiFetchMock.mockResolvedValue([]);

    await expect(fetchWaveMetadata({ waveId: "wave-1" })).resolves.toEqual([]);

    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "v2/waves/wave-1/metadata",
      headers: undefined,
    });
  });

  it("uses v2 wave search as authoritative when it completes empty", async () => {
    commonApiFetchMock.mockImplementation(async ({ endpoint }) => {
      if (endpoint === "v2/waves") {
        return {
          page: 1,
          next: false,
          data: [],
        };
      }
      throw new Error("legacy search should not be called");
    });

    const result = await searchWavesByName({ name: "missing", pageSize: 5 });

    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "v2/waves",
      params: {
        view: "SEARCH",
        page: "1",
        page_size: "5",
        direct_message: "false",
        name: "missing",
      },
      headers: undefined,
    });
    expect(commonApiFetchMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual([]);
  });

  it("falls back to legacy wave search only when v2 search fails", async () => {
    commonApiFetchMock.mockImplementation(async ({ endpoint }) => {
      if (endpoint === "v2/waves") {
        throw new Error("v2 search failed");
      }
      if (endpoint === "waves") {
        return [
          {
            id: "legacy-wave",
            name: "Legacy Wave",
            created_at: 100,
            picture: null,
            contributors_overview: [],
            wave: { type: "CHAT" },
            chat: { scope: {} },
            parent_wave: null,
            has_subwaves: false,
            description_drop: { parts: [] },
            metrics: {
              drops_count: 1,
              latest_drop_timestamp: 200,
              first_unread_drop_serial_no: null,
              your_unread_drops_count: 0,
              your_latest_read_timestamp: 0,
              muted: false,
            },
            visibility: { scope: {} },
            pinned: false,
            subscribed_actions: [],
          },
        ];
      }
      return [];
    });

    const result = await searchWavesByName({ name: "legacy", pageSize: 5 });

    expect(commonApiFetchMock).toHaveBeenCalledWith({
      endpoint: "waves",
      params: {
        name: "legacy",
        limit: "5",
        direct_message: "false",
      },
      headers: undefined,
    });
    expect(result[0]).toMatchObject({
      id: "legacy-wave",
      name: "Legacy Wave",
    });
  });

  it("surfaces primary search failure when fallback searches complete empty", async () => {
    const primaryError = new Error("v2 search failed");

    commonApiFetchMock.mockImplementation(async ({ endpoint }) => {
      if (endpoint === "v2/waves") {
        throw primaryError;
      }
      return [];
    });

    await expect(searchWavesByName({ name: "missing" })).rejects.toMatchObject({
      message: "Wave search is unavailable. Try a wave URL or id.",
      cause: primaryError,
    });
    expect(commonApiFetchMock).toHaveBeenCalledTimes(3);
  });

  it("surfaces unavailable search when every wave search endpoint fails", async () => {
    commonApiFetchMock.mockRejectedValue(new Error("search failed"));

    await expect(searchWavesByName({ name: "missing" })).rejects.toThrow(
      "Wave search is unavailable. Try a wave URL or id."
    );
  });

  it("creates wave metadata", async () => {
    const response = { id: 1, data_key: "key", data_value: "value" };
    const body = { data_key: "key", data_value: "value" };
    commonApiPostMock.mockResolvedValue(response);

    await expect(
      createWaveMetadata({ waveId: "wave-1", body })
    ).resolves.toEqual(response);

    expect(commonApiPostMock).toHaveBeenCalledWith({
      endpoint: "v2/waves/wave-1/metadata",
      body,
      headers: undefined,
    });
  });

  it("deletes wave metadata", async () => {
    commonApiDeleteMock.mockResolvedValue(undefined);

    await expect(
      deleteWaveMetadata({ waveId: "wave-1", metadataId: 7 })
    ).resolves.toBeUndefined();

    expect(commonApiDeleteMock).toHaveBeenCalledWith({
      endpoint: "v2/waves/wave-1/metadata/7",
      headers: undefined,
    });
  });
});
