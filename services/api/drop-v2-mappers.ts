import type { ApiDropContextProfileContext } from "@/generated/models/ApiDropContextProfileContext";
import type { ApiDropMetadataResponse } from "@/generated/models/ApiDropMetadataResponse";
import type { ApiDropPart } from "@/generated/models/ApiDropPart";
import type { ApiDropPartV2 } from "@/generated/models/ApiDropPartV2";
import type { ApiDropReaction } from "@/generated/models/ApiDropReaction";
import type { ApiDropWithoutWave } from "@/generated/models/ApiDropWithoutWave";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiDropV2 } from "@/generated/models/ApiDropV2";
import type { ApiIdentityOverview } from "@/generated/models/ApiIdentityOverview";
import type { ApiIdentityOverviewBadges } from "@/generated/models/ApiIdentityOverviewBadges";
import type { ApiIdentityWaveParticipation } from "@/generated/models/ApiIdentityWaveParticipation";
import { ApiIdentitySubscriptionTargetAction } from "@/generated/models/ApiIdentitySubscriptionTargetAction";
import type { ApiMentionedWave } from "@/generated/models/ApiMentionedWave";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { ApiReplyToDropResponse } from "@/generated/models/ApiReplyToDropResponse";
import type { ApiReplyToDropV2 } from "@/generated/models/ApiReplyToDropV2";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import type { ApiWaveOverview } from "@/generated/models/ApiWaveOverview";
import {
  toApiWaveMin,
  type ApiWaveMinWithChatLinkSettings,
} from "@/helpers/waves/wave.helpers";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";

type ApiProfileMinWithBadges = ApiProfileMin & {
  readonly badges?: ApiIdentityOverviewBadges;
  readonly wave_participation?: ApiIdentityWaveParticipation;
};

type ApiWaveOverviewWithVoteRestrictions = ApiWaveOverview & {
  readonly forbid_negative_votes?: boolean;
};

const getIdentitySubscribedActions = (
  identity: ApiIdentityOverview
): ApiIdentitySubscriptionTargetAction[] =>
  identity.context_profile_context?.subscribed
    ? [ApiIdentitySubscriptionTargetAction.WaveCreated]
    : [];

export const mapIdentityOverviewToProfileMin = (
  identity: ApiIdentityOverview
): ApiProfileMinWithBadges => {
  const profileWaveId = identity.badges.profile_wave_id ?? null;

  return {
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
    subscribed_actions: getIdentitySubscribedActions(identity),
    archived: false,
    active_main_stage_submission_ids: [],
    winner_main_stage_drop_ids: [],
    artist_of_prevote_cards: [],
    profile_wave_id: profileWaveId,
    is_wave_creator: profileWaveId !== null,
    badges: identity.badges,
    ...(identity.wave_participation
      ? { wave_participation: identity.wave_participation }
      : {}),
  };
};

export const mapPriorityMetadataV2ToDropMetadata = (
  drop: ApiDropV2
): ApiDropMetadataResponse[] =>
  (drop.priority_metadata ?? []).map((metadata) => ({
    data_key: metadata.data_key,
    data_value: metadata.data_value,
  }));

export const mapApiWaveOverviewToApiWaveMin = (
  wave: ApiWaveOverviewWithVoteRestrictions
): ApiWaveMinWithChatLinkSettings => ({
  id: wave.id,
  name: wave.name,
  picture: wave.pfp ?? null,
  description_drop_id: "",
  last_drop_time: wave.last_drop_time,
  submission_type: null,
  authenticated_user_eligible_to_vote: true,
  authenticated_user_eligible_to_participate: true,
  authenticated_user_eligible_to_chat:
    wave.context_profile_context?.can_chat ?? true,
  authenticated_user_admin: false,
  visibility_group_id: wave.is_private ? "private" : null,
  participation_group_id: null,
  chat_group_id: null,
  voting_group_id: null,
  admin_group_id: null,
  voting_period_start: null,
  voting_period_end: null,
  voting_credit_type: ApiWaveCreditType.Tdh,
  voting_credit_nfts: null,
  admin_drop_deletion_enabled: false,
  forbid_negative_votes: wave.forbid_negative_votes === true,
  pinned: wave.context_profile_context?.pinned ?? false,
  identity_wave: false,
  links_disabled: wave.links_disabled,
  voting_credit_scope: ApiWaveCreditScope.Wave,
});

export const createFallbackWaveMin = (waveId: string): ApiWaveMin => ({
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
  voting_credit_scope: ApiWaveCreditScope.Wave,
});

export const normalizeWaveMin = (wave: ApiWave | ApiWaveMin): ApiWaveMin =>
  "description_drop" in wave ? toApiWaveMin(wave) : wave;

export const getWaveMin = (
  wave: ApiWave | ApiWaveMin | undefined,
  fallbackWaveId: string
): ApiWaveMin =>
  wave ? normalizeWaveMin(wave) : createFallbackWaveMin(fallbackWaveId);

export const createBasePart = (drop: ApiDropV2): ApiDropPart => ({
  part_id: 1,
  content: drop.content ?? null,
  media: drop.media ?? [],
  attachments: drop.attachments ?? [],
  quoted_drop: null,
});

export const mapDropPartV2ToApiDropPart = (
  part: ApiDropPartV2
): ApiDropPart => ({
  part_id: part.part_no,
  content: part.content ?? null,
  media: part.media ?? [],
  attachments: part.attachments ?? [],
  quoted_drop: part.quoted_drop
    ? {
        drop_id: part.quoted_drop.drop_id,
        drop_part_id: part.quoted_drop.drop_part_id,
      }
    : null,
});

export const mapDropReactionCountersV2 = (drop: ApiDropV2): ApiDropReaction[] =>
  drop.reactions
    ?.filter((reaction) => reaction.count > 0)
    .map((reaction) => ({
      reaction: reaction.reaction,
      profiles: [],
      count: reaction.count,
    })) ?? [];

export const mapMentionedWaves = (
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
  is_additional_action_promised: false,
  hide_link_preview: false,
  nft_links: [],
});

export const mapReplyToDrop = (
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

export const getContextProfileContext = (
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
