import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import {
  ApiCollectTdhTargetPlanStatusEnum,
  type ApiCollectTdhTargetPlan,
} from "@/generated/models/ApiCollectTdhTargetPlan";
import {
  ApiCollectTdhTargetRequestTargetModeEnum,
  ApiCollectTdhTargetRequestHorizonDaysEnum,
  type ApiCollectTdhTargetRequest,
} from "@/generated/models/ApiCollectTdhTargetRequest";
import {
  ApiCollectTdhTargetSearchOptimalityEnum,
  ApiCollectTdhTargetSearchStopReasonEnum,
  ApiCollectTdhTargetSearchEvaluationLimitEnum,
  ApiCollectTdhTargetSearchWorkLimitEnum,
} from "@/generated/models/ApiCollectTdhTargetSearch";
import { ApiMarketTradeOrderSideEnum } from "@/generated/models/ApiMarketTradeOrder";
import {
  MARKET_SEAPORT,
  MARKET_ZERO,
} from "@/components/collect/market-validation";

export const TARGET_NOW = Date.parse("2026-09-12T12:00:00Z");
export const TARGET_PRIMARY = "0x52908400098527886E0F7030069857D2E4169EE7";
export const TARGET_CUSTODY = "0xde709f2102306220921060314715629080e2fb77";
export const TARGET_FREN = "0x1111111111111111111111111111111111111111";
const TARGET_PROFILE_ID = "collector";
export const targetProfile = {
  id: TARGET_PROFILE_ID,
  primary_wallet: TARGET_PRIMARY,
  display: "collector.eth",
  wallets: [
    { wallet: TARGET_PRIMARY, display: "collector.eth", tdh: 0 },
    { wallet: TARGET_CUSTODY, display: "custody.eth", tdh: 0 },
  ],
} as ApiIdentity;
export function targetRequest(): ApiCollectTdhTargetRequest {
  return {
    profile_id: TARGET_PROFILE_ID,
    recipient: TARGET_PRIMARY,
    target_tdh: "150",
    target_mode: ApiCollectTdhTargetRequestTargetModeEnum.TotalAtDeadline,
    horizon_days: ApiCollectTdhTargetRequestHorizonDaysEnum.NUMBER_30,
    families: [ApiCollectFamily.Memes],
  };
}
export function targetPlan(request = targetRequest()): ApiCollectTdhTargetPlan {
  const contract = "0x33fd426905f149f8376e227d0c9d3340aad17af1";
  const assetKey = `1:${contract}:1`;
  const baseline = {
    base_tdh: 100,
    boosted_tdh: 100,
    boost: 1,
    full_memes_sets: 0,
    tokens: [],
    boost_breakdown: [],
  };
  return {
    plan_id: "target-plan",
    request,
    status: ApiCollectTdhTargetPlanStatusEnum.TargetMetBestFound,
    projection: {
      account: {
        profile_id: TARGET_PROFILE_ID,
        consolidation_key: "scope",
        wallets: [TARGET_PRIMARY, TARGET_CUSTODY],
        membership_hash: "membership",
      },
      scenario_id: "scenario",
      snapshot_block: 1,
      snapshot_timestamp: new Date(TARGET_NOW).toISOString(),
      evaluated_at: new Date(
        TARGET_NOW + request.horizon_days * 86400_000 - 12 * 3600_000
      ).toISOString(),
      rules_version: "rules",
      baseline,
      proposed: { ...baseline, base_tdh: 160, boosted_tdh: 160 },
      additional_tdh: 60,
      additional_base_tdh: 60,
      changed_boost_on_existing_holdings: 0,
      assumptions: ["Current holdings are retained."],
      horizon_days: request.horizon_days,
      acquisition_timestamp: new Date(TARGET_NOW).toISOString(),
      recipient_allocations: [
        {
          asset_key: assetKey,
          recipient: request.recipient,
          quantity: "2",
          counts_toward_profile: true,
        },
      ],
    },
    target_total_tdh: request.target_tdh,
    shortfall_tdh: "0",
    purchase_cost_wei: "200000000000000000",
    signed_fees_wei: "2000000000000000",
    gas_estimate_wei: null,
    funding_estimate_wei: null,
    items: [
      {
        asset: {
          asset_key: assetKey,
          chain_id: 1,
          contract,
          token_id: "1",
          family: ApiCollectFamily.Memes,
          name: "Target artwork",
          image_url: null,
          artist_ids: [],
          season: 1,
          traits: [],
          hodl_rate: 1,
          tdh_eligible: true,
        },
        order: {
          identity: {
            protocol_address: MARKET_SEAPORT,
            order_hash: `0x${"a".repeat(64)}`,
          },
          asset_key: assetKey,
          maker: TARGET_FREN,
          side: ApiMarketTradeOrderSideEnum.Listing,
          quantity: "1",
          purchase_quantity: "1",
          quantity_step: "1",
          available_quantity: "3",
          currency: MARKET_ZERO,
          total_wei: "100000000000000000",
          net_wei: "99000000000000000",
          fees: [{ recipient: TARGET_FREN, amount_wei: "1000000000000000" }],
          start_time: "1",
          end_time: String(TARGET_NOW / 1000 + 3600),
          recipient: MARKET_ZERO,
        },
        quantity: "2",
        recipient: request.recipient,
      },
    ],
    catalog_version: "catalog",
    valid_until: new Date(TARGET_NOW + 60_000).toISOString(),
    coverage: {
      indexed_ask_count: 4,
      evaluated_ask_count: 4,
      candidate_count: 1,
      excluded_ask_count: 3,
      index_complete: false,
      market_complete: false,
      observed_at: new Date(TARGET_NOW).toISOString(),
    },
    search: {
      optimality: ApiCollectTdhTargetSearchOptimalityEnum.BestFound,
      evaluated_count: 2,
      evaluation_limit: ApiCollectTdhTargetSearchEvaluationLimitEnum.NUMBER_128,
      work_used: 10,
      work_limit: ApiCollectTdhTargetSearchWorkLimitEnum.NUMBER_10000000,
      stop_reason: ApiCollectTdhTargetSearchStopReasonEnum.Complete,
    },
    assumptions: ["Purchases are assumed to occur now."],
  };
}
