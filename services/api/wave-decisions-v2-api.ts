import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropContextProfileContext } from "@/generated/models/ApiDropContextProfileContext";
import type { ApiDropPart } from "@/generated/models/ApiDropPart";
import type { ApiDropReaction } from "@/generated/models/ApiDropReaction";
import type { ApiDropWithoutWave } from "@/generated/models/ApiDropWithoutWave";
import type { ApiDropWinningContext } from "@/generated/models/ApiDropWinningContext";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiDropV2 } from "@/generated/models/ApiDropV2";
import type { ApiIdentityOverview } from "@/generated/models/ApiIdentityOverview";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { ApiReplyToDropResponse } from "@/generated/models/ApiReplyToDropResponse";
import type { ApiReplyToDropV2 } from "@/generated/models/ApiReplyToDropV2";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import type { ApiWaveDecision } from "@/generated/models/ApiWaveDecision";
import type { ApiWaveDecisionAward } from "@/generated/models/ApiWaveDecisionAward";
import type { ApiWaveDecisionV2 } from "@/generated/models/ApiWaveDecisionV2";
import type { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";
import type { ApiWaveDecisionWinnerV2 } from "@/generated/models/ApiWaveDecisionWinnerV2";
import type { ApiWaveDecisionsPage } from "@/generated/models/ApiWaveDecisionsPage";
import type { ApiWaveDecisionsPageV2 } from "@/generated/models/ApiWaveDecisionsPageV2";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import { toApiWaveMin } from "@/helpers/waves/wave.helpers";
import { commonApiFetch } from "@/services/api/common-api";

interface FetchWaveDecisionsV2Props {
  readonly waveId: string;
  readonly params: Record<string, string>;
  readonly wave?: ApiWave | ApiWaveMin | undefined;
  readonly signal?: AbortSignal | undefined;
}

const mapIdentityOverviewToProfileMin = (
  identity: ApiIdentityOverview
): ApiProfileMin => ({
  id: identity.id,
  handle: identity.handle ?? null,
  pfp: identity.pfp ?? null,
  banner1_color: null,
  banner2_color: null,
  cic: 0,
  rep: 0,
  tdh: 0,
  tdh_rate: 0,
  xtdh: 0,
  xtdh_rate: 0,
  level: identity.level,
  classification: identity.classification,
  sub_classification: null,
  primary_address: identity.primary_address,
  subscribed_actions: [],
  archived: false,
  active_main_stage_submission_ids: [],
  winner_main_stage_drop_ids: [],
  artist_of_prevote_cards: [],
  profile_wave_id: null,
  is_wave_creator: false,
});

const createFallbackWaveMin = (waveId: string): ApiWaveMin => ({
  id: waveId,
  name: waveId,
  picture: null,
  description_drop_id: "",
  last_drop_time: 0,
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
  voting_credit_nfts: null,
  admin_drop_deletion_enabled: false,
  forbid_negative_votes: false,
  pinned: false,
  identity_wave: false,
});

const normalizeWaveMin = (wave: ApiWave | ApiWaveMin): ApiWaveMin =>
  "description_drop" in wave ? toApiWaveMin(wave) : wave;

const getWaveMin = (
  wave: ApiWave | ApiWaveMin | undefined,
  fallbackWaveId: string
): ApiWaveMin =>
  wave ? normalizeWaveMin(wave) : createFallbackWaveMin(fallbackWaveId);

const createBasePart = (drop: ApiDropV2): ApiDropPart => ({
  part_id: 1,
  content: drop.content ?? null,
  media: drop.media ?? [],
  attachments: drop.attachments ?? [],
  quoted_drop: null,
});

const mapDropReactionCountersV2 = (drop: ApiDropV2): ApiDropReaction[] =>
  drop.reactions
    ?.filter((reaction) => reaction.count > 0)
    .map((reaction) => ({
      reaction: reaction.reaction,
      profiles: [],
      count: reaction.count,
    })) ?? [];

const mapMentionedWaves = (
  drop: ApiDropV2,
  fallbackWave: ApiWaveMin
): ApiMentionedWave[] =>
  drop.mentioned_waves?.map((wave) => ({
    wave_name_in_content: wave.in_content,
    wave_id: wave.id,
    wave: {
      ...fallbackWave,
      id: wave.id,
      name: wave.name ?? wave.in_content,
      picture: wave.pfp ?? null,
    },
  })) ?? [];

const mapReplyToDropPreview = (
  replyToDrop: ApiReplyToDropV2
): ApiDropWithoutWave => ({
  id: replyToDrop.id,
  serial_no: replyToDrop.serial_no ?? 0,
  drop_type: ApiDropType.Chat,
  rank: null,
  author: {
    id: replyToDrop.author?.handle ?? "",
    handle: replyToDrop.author?.handle ?? null,
    pfp: replyToDrop.author?.pfp ?? null,
    banner1_color: null,
    banner2_color: null,
    cic: 0,
    rep: 0,
    tdh: 0,
    tdh_rate: 0,
    xtdh: 0,
    xtdh_rate: 0,
    level: 0,
    classification: ApiProfileClassification.Pseudonym,
    sub_classification: null,
    primary_address: "",
    subscribed_actions: [],
    archived: false,
    active_main_stage_submission_ids: [],
    winner_main_stage_drop_ids: [],
    artist_of_prevote_cards: [],
    profile_wave_id: null,
    is_wave_creator: false,
  },
  created_at: 0,
  updated_at: null,
  title: null,
  parts: [
    {
      part_id: 1,
      content: replyToDrop.content ?? null,
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
  rating: 0,
  realtime_rating: 0,
  rating_prediction: 0,
  top_raters: [],
  raters_count: 0,
  context_profile_context: null,
  subscribed_actions: [],
  is_signed: false,
  reactions: [],
  boosts: 0,
  hide_link_preview: false,
  nft_links: [],
});

const mapReplyToDrop = (
  drop: ApiDropV2
): ApiReplyToDropResponse | undefined => {
  if (!drop.reply_to_drop) {
    return undefined;
  }

  return {
    drop_id: drop.reply_to_drop.id,
    drop_part_id: 1,
    is_deleted: false,
    drop: mapReplyToDropPreview(drop.reply_to_drop),
  };
};

const getContextProfileContext = (
  drop: ApiDropV2
): ApiDropContextProfileContext => {
  const votingContext = drop.submission_context?.voting.context_profile_context;
  const dropContext = drop.context_profile_context;

  return {
    rating: votingContext?.current ?? 0,
    min_rating: votingContext?.min ?? 0,
    max_rating: votingContext?.max ?? 0,
    reaction: dropContext?.reaction ?? null,
    boosted: dropContext?.boosted ?? false,
    bookmarked: dropContext?.bookmarked ?? false,
    curatable: false,
    curated: false,
  };
};

const getDecisionWinningContext = ({
  awards,
  decisionTime,
  place,
}: {
  readonly awards: ApiWaveDecisionAward[];
  readonly decisionTime: number;
  readonly place: number;
}): ApiDropWinningContext => ({
  place,
  awards,
  decision_time: decisionTime,
  sale_time: null,
  sale_price: null,
  sale_price_currency: null,
});

const mapDecisionDropV2 = ({
  awards,
  decisionTime,
  drop,
  place,
  wave,
}: {
  readonly awards: ApiWaveDecisionAward[];
  readonly decisionTime: number;
  readonly drop: ApiDropV2;
  readonly place: number;
  readonly wave: ApiWaveMin;
}): ApiDrop => {
  const voting = drop.submission_context?.voting;
  const replyTo = mapReplyToDrop(drop);

  return {
    id: drop.id,
    serial_no: drop.serial_no,
    drop_type: ApiDropType.Winner,
    rank: place,
    winning_context: getDecisionWinningContext({
      awards,
      decisionTime,
      place,
    }),
    wave,
    ...(replyTo ? { reply_to: replyTo } : {}),
    author: mapIdentityOverviewToProfileMin(drop.author),
    created_at: drop.created_at,
    updated_at: drop.updated_at ?? null,
    title: drop.title ?? null,
    parts: [createBasePart(drop)],
    parts_count: 1,
    referenced_nfts: drop.referenced_nfts ?? [],
    mentioned_users: drop.mentioned_users ?? [],
    mentioned_groups: drop.mentioned_groups ?? [],
    mentioned_waves: mapMentionedWaves(drop, wave),
    metadata: [],
    rating: voting?.current_calculated_vote ?? 0,
    realtime_rating: voting?.current_calculated_vote ?? 0,
    rating_prediction: voting?.predicted_final_vote ?? 0,
    top_raters: [],
    raters_count: voting?.voters_count ?? 0,
    context_profile_context: getContextProfileContext(drop),
    subscribed_actions: [],
    is_signed: drop.is_signed,
    reactions: mapDropReactionCountersV2(drop),
    boosts: drop.boosts,
    hide_link_preview: drop.hide_link_preview,
    nft_links: drop.nft_links ?? [],
  };
};

const mapDecisionWinnerV2 = ({
  decisionTime,
  wave,
  winner,
}: {
  readonly decisionTime: number;
  readonly wave: ApiWaveMin;
  readonly winner: ApiWaveDecisionWinnerV2;
}): ApiWaveDecisionWinner => ({
  place: winner.place,
  awards: winner.awards,
  drop: mapDecisionDropV2({
    awards: winner.awards,
    decisionTime,
    drop: winner.drop,
    place: winner.place,
    wave,
  }),
});

const mapDecisionPointV2 = ({
  decision,
  wave,
}: {
  readonly decision: ApiWaveDecisionV2;
  readonly wave: ApiWaveMin;
}): ApiWaveDecision => ({
  decision_time: decision.decision_time,
  winners: decision.winners.map((winner) =>
    mapDecisionWinnerV2({
      decisionTime: decision.decision_time,
      wave,
      winner,
    })
  ),
});

export async function fetchWaveDecisionsV2({
  waveId,
  params,
  wave,
  signal,
}: FetchWaveDecisionsV2Props): Promise<ApiWaveDecisionsPage> {
  const data = await commonApiFetch<ApiWaveDecisionsPageV2>({
    endpoint: `v2/waves/${waveId}/decisions`,
    params,
    ...(signal ? { signal } : {}),
  });
  const waveMin = getWaveMin(wave, waveId);

  return {
    data: data.data.map((decision) =>
      mapDecisionPointV2({ decision, wave: waveMin })
    ),
    count: data.count,
    page: data.page,
    next: data.next,
  };
}
