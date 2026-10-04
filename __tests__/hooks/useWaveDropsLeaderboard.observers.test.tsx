import { createDeferredPromise } from "@/__tests__/utils/deferredPromise";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiDropsLeaderboardPage } from "@/generated/models/ApiDropsLeaderboardPage";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiDropWithoutWave } from "@/generated/models/ApiDropWithoutWave";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import {
  useWaveDropsLeaderboard,
  WaveDropsLeaderboardSort,
  WAVE_DROPS_LEADERBOARD_MAX_PAGES,
} from "@/hooks/useWaveDropsLeaderboard";
import { fetchWaveLeaderboardV2 } from "@/services/api/wave-drops-v2-api";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

jest.mock("@/services/api/wave-drops-v2-api", () => ({
  fetchWaveLeaderboardV2: jest.fn(),
}));

const fetchLeaderboardMock = jest.mocked(fetchWaveLeaderboardV2);
const wave: ApiWaveMin = {
  id: "shared-leaderboard-wave",
  name: "Shared leaderboard",
  picture: null,
  description_drop_id: "description-drop",
  last_drop_time: 1,
  submission_type: null,
  authenticated_user_eligible_to_vote: true,
  authenticated_user_eligible_to_participate: true,
  authenticated_user_eligible_to_chat: true,
  authenticated_user_admin: false,
  visibility_group_id: null,
  participation_group_id: null,
  chat_group_id: null,
  voting_group_id: null,
  admin_group_id: null,
  voting_period_start: null,
  voting_period_end: null,
  voting_credit_type: ApiWaveCreditType.Tdh,
  voting_credit_scope: ApiWaveCreditScope.Wave,
  voting_credit_nfts: null,
  admin_drop_deletion_enabled: false,
  forbid_negative_votes: false,
  pinned: false,
  identity_wave: false,
};
const drop: ApiDropWithoutWave = {
  id: "surviving-drop",
  serial_no: 1,
  drop_type: ApiDropType.Participatory,
  rank: 1,
  author: {
    id: "author-id",
    handle: "leaderboard-author",
    pfp: null,
    banner1_color: null,
    banner2_color: null,
    cic: 0,
    rep: 0,
    tdh: 100,
    tdh_rate: 0,
    xtdh: 0,
    xtdh_rate: 0,
    level: 1,
    classification: ApiProfileClassification.Pseudonym,
    sub_classification: null,
    primary_address: "0x0000000000000000000000000000000000000001",
    subscribed_actions: [],
    archived: false,
    active_main_stage_submission_ids: [],
    winner_main_stage_drop_ids: [],
    artist_of_prevote_cards: [],
    profile_wave_id: null,
    is_wave_creator: false,
  },
  created_at: 1,
  updated_at: null,
  title: "Surviving leaderboard entry",
  parts: [
    {
      part_id: 1,
      content: "The pending response still reaches its mounted observer.",
      media: [],
      attachments: [],
      quoted_drop: null,
    },
  ],
  parts_count: 1,
  referenced_nfts: [],
  mentioned_users: [],
  mentioned_groups: [],
  mentioned_waves: [],
  metadata: [],
  rating: 10,
  realtime_rating: 10,
  rating_prediction: 10,
  top_raters: [],
  raters_count: 1,
  context_profile_context: null,
  subscribed_actions: [],
  is_signed: false,
  reactions: [],
  boosts: 0,
  is_additional_action_promised: false,
  hide_link_preview: false,
};
const populatedPage: ApiDropsLeaderboardPage = {
  wave,
  drops: [drop],
  count: 1,
  page: 1,
  next: false,
};

describe("useWaveDropsLeaderboard observer cleanup", () => {
  let queryClient: QueryClient;

  function wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  beforeEach(() => {
    fetchLeaderboardMock.mockReset();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: Infinity,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
        },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it.each([
    {
      name: "the same query key",
      siblingSort: WaveDropsLeaderboardSort.RANK,
      siblingMaxPages: WAVE_DROPS_LEADERBOARD_MAX_PAGES,
      keepEnabled: true,
      expectedRequests: 1,
    },
    {
      name: "a different page window",
      siblingSort: WaveDropsLeaderboardSort.RANK,
      siblingMaxPages: undefined,
      keepEnabled: true,
      expectedRequests: 2,
    },
    {
      name: "a different sort and page window",
      siblingSort: WaveDropsLeaderboardSort.MY_REALTIME_VOTE,
      siblingMaxPages: undefined,
      keepEnabled: true,
      expectedRequests: 2,
    },
    {
      name: "a disabled but mounted observer",
      siblingSort: WaveDropsLeaderboardSort.MY_REALTIME_VOTE,
      siblingMaxPages: undefined,
      keepEnabled: false,
      expectedRequests: 2,
    },
  ])(
    "preserves a pending fetch when a sibling unmounts with $name",
    async ({ siblingSort, siblingMaxPages, keepEnabled, expectedRequests }) => {
      const response = createDeferredPromise<ApiDropsLeaderboardPage>();
      fetchLeaderboardMock.mockReturnValue(response.promise);
      const survivor = renderHook(
        ({ enabled }) =>
          useWaveDropsLeaderboard({
            waveId: wave.id,
            sort: WaveDropsLeaderboardSort.RANK,
            maxPages: WAVE_DROPS_LEADERBOARD_MAX_PAGES,
            enabled,
          }),
        { initialProps: { enabled: true }, wrapper }
      );
      const sibling = renderHook(
        () =>
          useWaveDropsLeaderboard({
            waveId: wave.id,
            sort: siblingSort,
            maxPages: siblingMaxPages,
          }),
        { wrapper }
      );
      await waitFor(() =>
        expect(fetchLeaderboardMock).toHaveBeenCalledTimes(expectedRequests)
      );
      const signal = fetchLeaderboardMock.mock.calls[0]?.[0].signal;
      const query = queryClient.getQueryCache().find({
        queryKey: [
          QueryKey.DROPS_LEADERBOARD,
          {
            waveId: wave.id,
            sort: WaveDropsLeaderboardSort.RANK,
            page_window: WAVE_DROPS_LEADERBOARD_MAX_PAGES,
          },
        ],
        exact: false,
      });
      expect(signal).toBeDefined();
      expect(query).toBeDefined();
      if (!signal || !query) {
        throw new Error("The mounted leaderboard must have a pending query.");
      }

      survivor.rerender({ enabled: keepEnabled });
      sibling.unmount();

      expect(signal.aborted).toBe(false);
      expect(queryClient.getQueryCache().get(query.queryHash)).toBe(query);
      expect(query.getObserversCount()).toBe(1);

      await act(async () => {
        response.resolve(populatedPage);
        await response.promise;
      });
      await waitFor(() =>
        expect(survivor.result.current.drops).toEqual([
          expect.objectContaining({ id: drop.id, title: drop.title, wave }),
        ])
      );
      expect(survivor.result.current.isFetching).toBe(false);
      expect(fetchLeaderboardMock).toHaveBeenCalledTimes(expectedRequests);

      survivor.unmount();
      expect(queryClient.getQueryCache().get(query.queryHash)).toBeUndefined();
    }
  );
});
