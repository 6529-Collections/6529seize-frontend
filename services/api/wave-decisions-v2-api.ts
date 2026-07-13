import type { ApiDropWinningContext } from "@/generated/models/ApiDropWinningContext";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiDropV2 } from "@/generated/models/ApiDropV2";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveDecision } from "@/generated/models/ApiWaveDecision";
import type { ApiWaveDecisionAward } from "@/generated/models/ApiWaveDecisionAward";
import type { ApiWaveDecisionV2 } from "@/generated/models/ApiWaveDecisionV2";
import type { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";
import type { ApiWaveDecisionWinnerV2 } from "@/generated/models/ApiWaveDecisionWinnerV2";
import type { ApiWaveDecisionsPage } from "@/generated/models/ApiWaveDecisionsPage";
import type { ApiWaveDecisionsPageV2 } from "@/generated/models/ApiWaveDecisionsPageV2";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import type { ApiDropV2View } from "@/services/api/drop-v2-view.types";
import { commonApiFetch } from "@/services/api/common-api";
import {
  createBasePart,
  getContextProfileContext,
  getWaveMin,
  mapDropReactionCountersV2,
  mapIdentityOverviewToProfileMin,
  mapMentionedWaves,
  mapPriorityMetadataV2ToDropMetadata,
  mapReplyToDrop,
} from "@/services/api/drop-v2-mappers";

interface FetchWaveDecisionsV2Props {
  readonly waveId: string;
  readonly params: Record<string, string>;
  readonly wave?: ApiWave | ApiWaveMin | undefined;
  readonly signal?: AbortSignal | undefined;
}

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
}): ApiDropV2View => {
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
    ...(drop.submission_context
      ? { submission_context: drop.submission_context }
      : {}),
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
    metadata: mapPriorityMetadataV2ToDropMetadata(drop),
    rating: voting?.current_calculated_vote ?? 0,
    realtime_rating:
      voting?.total_votes_given ?? voting?.current_calculated_vote ?? 0,
    rating_prediction: voting?.predicted_final_vote ?? 0,
    top_raters: [],
    raters_count: voting?.voters_count ?? 0,
    context_profile_context: getContextProfileContext(drop),
    subscribed_actions: [],
    is_signed: drop.is_signed,
    reactions: mapDropReactionCountersV2(drop),
    boosts: drop.boosts,
    is_additional_action_promised:
      drop.submission_context?.is_additional_action_promised ?? false,
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
