"use client";

import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiReplyToDropResponse } from "@/generated/models/ApiReplyToDropResponse";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiIdentity } from "@/generated/models/ObjectSerializer";
import { getBannerColorValue } from "@/helpers/profile-banner.helpers";
import { getOptimisticDropId } from "@/helpers/waves/drop.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import { ActiveDropAction } from "@/types/dropInteractionTypes";

export const getOptimisticDrop = (
  dropRequest: ApiCreateDropRequest,
  connectedProfile: ApiIdentity | null,
  wave: ApiWave,
  activeDrop: ActiveDropState | null,
  dropType: ApiDropType
): ApiDrop | null => {
  if (!connectedProfile?.id || !connectedProfile.handle) {
    return null;
  }

  const getReplyTo = (): ApiReplyToDropResponse | undefined => {
    if (activeDrop?.action === ActiveDropAction.REPLY) {
      return {
        drop_id: activeDrop.drop.id,
        drop_part_id: activeDrop.partId,
        is_deleted: false,
        drop: activeDrop.drop,
      };
    }
    return undefined;
  };

  const replyTo = getReplyTo();
  const replyToObj = replyTo ? { reply_to: replyTo } : {};

  return {
    id: getOptimisticDropId(),
    serial_no: Date.now(),
    ...replyToObj,
    wave: {
      id: wave.id,
      name: wave.name,
      pinned: wave.pinned,
      picture: wave.picture ?? "",
      description_drop_id: wave.description_drop.id,
      authenticated_user_eligible_to_participate:
        wave.participation.authenticated_user_eligible,
      authenticated_user_eligible_to_vote:
        wave.voting.authenticated_user_eligible,
      authenticated_user_eligible_to_chat:
        wave.chat.authenticated_user_eligible,
      voting_credit_type: wave.voting.credit_type,
      voting_period_start: wave.voting.period?.min ?? null,
      voting_period_end: wave.voting.period?.max ?? null,
      visibility_group_id: null,
      participation_group_id: null,
      chat_group_id: null,
      voting_group_id: null,
      admin_group_id: null,
      admin_drop_deletion_enabled: false,
      authenticated_user_admin: false,
      forbid_negative_votes: wave.voting.forbid_negative_votes,
    },
    author: {
      id: connectedProfile.id,
      handle: connectedProfile.handle,
      active_main_stage_submission_ids:
        connectedProfile.active_main_stage_submission_ids,
      winner_main_stage_drop_ids: connectedProfile.winner_main_stage_drop_ids,
      pfp: connectedProfile.pfp,
      banner1_color: getBannerColorValue(connectedProfile.banner1),
      banner2_color: getBannerColorValue(connectedProfile.banner2),
      cic: connectedProfile.cic,
      rep: connectedProfile.rep,
      tdh: connectedProfile.tdh,
      tdh_rate: connectedProfile.tdh_rate,
      xtdh: connectedProfile.xtdh,
      xtdh_rate: connectedProfile.xtdh_rate,
      level: connectedProfile.level,
      subscribed_actions: [],
      archived: false,
      primary_address: connectedProfile.primary_wallet,
      is_wave_creator: connectedProfile.is_wave_creator,
    },
    created_at: Date.now(),
    updated_at: null,
    title: dropRequest.title ?? null,
    parts: dropRequest.parts.map((part, i) => ({
      part_id: i + 1,
      content: part.content ?? null,
      media: part.media.map((media) => ({
        url: media.url,
        mime_type: media.mime_type,
      })),
      quoted_drop: part.quoted_drop
        ? {
            ...part.quoted_drop,
            is_deleted: false,
          }
        : null,
      replies_count: 0,
      quotes_count: 0,
    })),
    parts_count: dropRequest.parts.length,
    referenced_nfts: dropRequest.referenced_nfts,
    mentioned_users: dropRequest.mentioned_users,
    mentioned_waves: dropRequest.mentioned_waves ?? [],
    metadata: dropRequest.metadata,
    rating: 0,
    top_raters: [],
    raters_count: 0,
    context_profile_context: null,
    subscribed_actions: [],
    drop_type: dropType,
    rank: null,
    realtime_rating: 0,
    is_signed: false,
    rating_prediction: 0,
    reactions: [],
    boosts: 0,
    hide_link_preview: false,
  };
};
