import { act, render, screen, waitFor, within } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import type { ReactNode } from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropVoteSummary } from "@/generated/models/ApiDropVoteSummary";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import type { ApiCompetitionEntryContext } from "@/generated/models/ApiCompetitionEntryContext";
import { ApiCompetitionComputedPhase } from "@/generated/models/ApiCompetitionComputedPhase";
import { ApiCompetitionEntryStatus } from "@/generated/models/ApiCompetitionEntryStatus";
import { ApiCompetitionLifecycle } from "@/generated/models/ApiCompetitionLifecycle";
import { ApiCompetitionType } from "@/generated/models/ApiCompetitionType";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { SingleWaveDropAuthor } from "@/components/waves/drop/SingleWaveDropAuthor";
import { useCompetitionEvents } from "@/hooks/competitions/useCompetitionEvents";
import { useCompetitionEntryDrops } from "@/hooks/competitions/useCompetitionEntryDrops";
import {
  competitionCardDrop,
  fetchCompetitionEntryDrop,
} from "@/services/api/competition-entry-drops-api";
import { invalidateCompetitionAuthors } from "@/services/api/competitions-api";

let mockListener: (event: unknown) => void;
const mockCompetition: ApiCompetition = {
  id: "competition",
  wave_id: "wave",
  title: "Anonymous art",
  description: null,
  type: ApiCompetitionType.Rank,
  lifecycle: ApiCompetitionLifecycle.Published,
  computed_phase: ApiCompetitionComputedPhase.VotingOpen,
  config_version: 1,
  participation: {
    anonymous_submissions: true,
    group_id: null,
    signature_required: false,
    max_entries_per_participant: null,
    required_metadata: [],
    required_media: [],
    submission_type: null,
    identity_submission_strategy: null,
    identity_submission_duplicates: null,
    starts_at: null,
    ends_at: null,
    terms: null,
  },
  permissions: { view: true, submit: true, vote: true, administer: false },
  voting: {
    group_id: null,
    credit_type: "TDH",
    credit_scope: "WAVE",
    credit_category: null,
    credit_creditor: null,
    credit_nfts: [],
    signature_required: false,
    starts_at: null,
    ends_at: null,
    max_votes_per_identity_to_entry: null,
    forbid_negative_votes: false,
  },
  decisions: {
    strategy: null,
    next_decision_time: null,
    winning_min_threshold: null,
    winning_max_threshold: null,
    winning_threshold_min_duration_ms: 0,
    max_winners: 1,
    time_lock_ms: null,
  },
  winners: {
    max_winners: 1,
    winning_min_threshold: null,
    winning_max_threshold: null,
    winning_threshold_min_duration_ms: 0,
  },
  outcome_config: [],
  capabilities: [],
  created_at: 1,
  updated_at: 1,
  published_at: 1,
  ended_at: null,
  cancelled_at: null,
  archived_at: null,
};
jest.mock("@/contexts/CompetitionContext", () => ({
  useCompetition: () => ({ competition: mockCompetition }),
}));
jest.mock("@/hooks/competitions/useCompetitionQueries", () => ({
  useCompetitionViewer: () => "viewer:self",
}));
jest.mock("@/services/websocket/useWebSocket", () => ({
  useWebSocket: () => ({
    subscribe: (_type: unknown, listener: (event: unknown) => void) => {
      mockListener = listener;
      return () => undefined;
    },
  }),
}));
jest.mock("@/services/api/competition-entry-drops-api", () => ({
  competitionCardDrop: jest.fn(),
  fetchCompetitionEntryDrop: jest.fn(),
}));
jest.mock("@/components/utils/tooltip/UserProfileTooltipWrapper", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => children,
}));
jest.mock("@/components/user/utils/UserCICAndLevel", () => ({
  __esModule: true,
  default: () => null,
  UserCICAndLevelSize: { SMALL: "small" },
}));
jest.mock("@/components/waves/drops/DropAuthorBadges", () => ({
  DropAuthorBadges: () => null,
}));

const author = (entryId: string, revealed = false): ApiProfileMin => ({
  id: revealed ? "real-author" : `anonymous-${entryId}`,
  handle: revealed ? "Alice" : "Anonymous",
  ...(revealed ? {} : { is_anonymous: true }),
  primary_address: "",
  pfp: null,
  level: 0,
  classification: ApiProfileClassification.Pseudonym,
  sub_classification: null,
  banner1_color: null,
  banner2_color: null,
  cic: 0,
  rep: 0,
  tdh: 0,
  tdh_rate: 0,
  xtdh: 0,
  xtdh_rate: 0,
  subscribed_actions: [],
  archived: false,
  active_main_stage_submission_ids: [],
  winner_main_stage_drop_ids: [],
  artist_of_prevote_cards: [],
  profile_wave_id: null,
  is_wave_creator: false,
});
const drop = (entryId: string, revealed = false, waveId = "wave"): ApiDrop => ({
  id: `drop-${entryId}`,
  serial_no: 1,
  drop_type: revealed ? ApiDropType.Winner : ApiDropType.Participatory,
  rank: revealed ? 1 : null,
  author: author(entryId, revealed),
  wave: {
    id: waveId,
    name: "Anonymous art",
    picture: null,
    description_drop_id: "description",
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
  },
  created_at: 1,
  updated_at: null,
  title: null,
  parts: [],
  parts_count: 0,
  referenced_nfts: [],
  mentioned_users: [],
  mentioned_groups: [],
  mentioned_waves: [],
  metadata: [],
  rating: 1,
  realtime_rating: 1,
  rating_prediction: 1,
  top_raters: [],
  raters_count: 1,
  context_profile_context: null,
  subscribed_actions: [],
  is_signed: false,
  reactions: [],
  boosts: 0,
  is_additional_action_promised: false,
  hide_link_preview: false,
});
const context = (
  entryId: string,
  revealed = false
): ApiCompetitionEntryContext => ({
  entry: {
    id: entryId,
    wave_id: "wave",
    competition_id: "competition",
    drop_id: `drop-${entryId}`,
    submitter: author(entryId, revealed),
    status: revealed
      ? ApiCompetitionEntryStatus.Winner
      : ApiCompetitionEntryStatus.Active,
    config_version: 1,
    submitted_at: 1,
    rank: revealed ? 1 : null,
    won_at: revealed ? 100 : null,
    decision_id: revealed ? "decision" : null,
  },
  awards: [],
  vote_summary: {
    rating: 1,
    realtime_rating: 1,
    rating_prediction: 1,
    rank: 1,
    raters_count: 1,
    user_vote: 0,
    top_raters: [],
  },
});

it("refreshes matching drop identities when vote summaries and collaborations share the drop cache", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity } },
  });
  const summaryKey = [
    QueryKey.DROP,
    { drop_id: "drop-winner", view: "vote-summary" },
  ];
  const collaborationKey = [QueryKey.DROP, "collaborations", "drop-winner"];
  const detailKey = [QueryKey.DROP, { drop_id: "drop-winner" }];
  const unrelatedKey = [QueryKey.DROP, { drop_id: "drop-elsewhere" }];
  client.setQueryData<ApiDropVoteSummary>(summaryKey, {});
  client.setQueryData(collaborationKey, []);
  client.setQueryData(detailKey, drop("winner"));
  client.setQueryData(unrelatedKey, drop("elsewhere", false, "elsewhere"));
  try {
    await expect(
      invalidateCompetitionAuthors(client, "wave")
    ).resolves.toBeUndefined();
    expect(client.getQueryState(detailKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(unrelatedKey)?.isInvalidated).toBe(false);
    expect(client.getQueryState(summaryKey)?.isInvalidated).toBe(false);
    expect(client.getQueryState(collaborationKey)?.isInvalidated).toBe(false);
  } finally {
    client.clear();
  }
});

it("refreshes winner identity in cached cards, chat and detail after the decision event while other entries stay anonymous", async () => {
  jest.useFakeTimers();
  let won = false;
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Infinity, gcTime: Infinity },
    },
  });
  const references = ["winner", "other"].map((entryId) => ({
    entryId,
    dropId: `drop-${entryId}`,
  }));
  const cards = {
    contexts: [context("winner"), context("other")],
    updatedAt: Date.now(),
  };
  const detailKey = [QueryKey.DROP, { drop_id: "drop-winner" }];
  const chatKey = [QueryKey.DROPS, { waveId: "wave" }];
  const unrelated = jest.fn(async () => drop("elsewhere", false, "elsewhere"));
  jest
    .mocked(competitionCardDrop)
    .mockImplementation((item) => drop(item.entry.id));
  jest
    .mocked(fetchCompetitionEntryDrop)
    .mockImplementation(
      async (_identity, _viewer, entryId, _dropId, _signal, cached) => ({
        ...context(entryId, won && entryId === "winner"),
        competition: mockCompetition,
        // The optimized card reader reuses original content even after an identity reveal.
        original: cached?.original ?? drop(entryId),
      })
    );
  function Entries() {
    useCompetitionEvents("wave");
    const entries = useCompetitionEntryDrops(references, cards);
    useQuery({
      queryKey: chatKey,
      queryFn: async () => [drop("winner", won), drop("other")],
    });
    useQuery({ queryKey: detailKey, queryFn: async () => drop("winner", won) });
    useQuery({
      queryKey: [QueryKey.DROP, { drop_id: "elsewhere" }],
      queryFn: unrelated,
    });
    return (
      <>
        {entries.map(
          (entry, index) =>
            entry.data && (
              <article
                key={references[index]!.entryId}
                aria-label={references[index]!.entryId}
              >
                <SingleWaveDropAuthor drop={entry.data.drop} />
              </article>
            )
        )}
      </>
    );
  }
  const view = render(
    <QueryClientProvider client={client}>
      <Entries />
    </QueryClientProvider>
  );
  try {
    await waitFor(() => expect(client.getQueryData(chatKey)).toBeDefined());
    expect(
      within(screen.getByRole("article", { name: "winner" })).getByText(
        "Anonymous"
      )
    ).toBeInTheDocument();
    won = true;
    await act(async () => {
      mockListener({
        event_id: "decision-event",
        event_version: 1,
        event_type: "COMPETITION_DECISION_COMPLETED",
        wave_id: "wave",
        competition_id: "competition",
      });
      jest.advanceTimersByTime(1000);
    });
    await waitFor(() =>
      expect(
        within(screen.getByRole("article", { name: "winner" })).getByRole(
          "link",
          { name: "Alice" }
        )
      ).toHaveAttribute("href", "/Alice")
    );
    const other = within(screen.getByRole("article", { name: "other" }));
    expect(other.getByText("Anonymous")).toBeInTheDocument();
    expect(other.queryByRole("link")).toBeNull();
    expect(client.getQueryData<ApiDrop>(detailKey)?.author.handle).toBe(
      "Alice"
    );
    expect(
      client.getQueryData<ApiDrop[]>(chatKey)?.map((item) => item.author.handle)
    ).toEqual(["Alice", "Anonymous"]);
    expect(unrelated).toHaveBeenCalledTimes(1);
  } finally {
    view.unmount();
    client.clear();
    jest.useRealTimers();
  }
});
