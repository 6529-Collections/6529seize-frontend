import {
  ApiCollectPlanStateEnum,
  type ApiCollectPlan,
} from "@/generated/models/ApiCollectPlan";
import {
  ApiCollectAcquisitionPlanOptimalityEnum,
  ApiCollectAcquisitionPlanStatusEnum,
  type ApiCollectAcquisitionPlan,
} from "@/generated/models/ApiCollectAcquisitionPlan";
import { ApiCollectKind } from "@/generated/models/ApiCollectKind";

export const scenarioProfile = { id: "profile", displayName: "Collector" };
export const scenarioAsset = "1:0x33fd426905f149f8376e227d0c9d3340aad17af1:1";
export function scenarioPlan(): ApiCollectPlan {
  const result: ApiCollectAcquisitionPlan = {
    plan_id: "calculation",
    analysis_id: "analysis",
    status: ApiCollectAcquisitionPlanStatusEnum.Partial,
    optimality: ApiCollectAcquisitionPlanOptimalityEnum.BestFound,
    total_cost_wei: "110000000000000000",
    legs: [
      {
        candidate_id: "listing",
        order_id: `0x${"1".repeat(64)}`,
        asset_key: scenarioAsset,
        quantity: "1",
        unit_price_wei: "100000000000000000",
      },
    ],
    remaining_requirements: [{ requirement_id: "one", missing_quantity: "1" }],
    projected_profile_complete: false,
    projected_profile_satisfied_count: 1,
    recipient: `0x${"2".repeat(40)}`,
    states_examined: 5,
    candidate_count: 1,
    evaluated_at: "2026-09-12T00:00:00Z",
    method: "bounded_integer_set_cover_v1",
  };
  return {
    id: "plan",
    revision: "revision",
    state: ApiCollectPlanStateEnum.Ready,
    profile_id: scenarioProfile.id,
    analysis: {
      analysis_id: "analysis",
      catalog_version: "catalog",
      account: {
        profile_id: scenarioProfile.id,
        consolidation_key: "account",
        wallets: [],
        membership_hash: "membership",
      },
      holdings_snapshot: { block_number: 1, nextgen_block_number: 1 },
      kind: ApiCollectKind.MemesSeason,
      target_copies: "2",
      requirements: [
        {
          id: "one",
          label: "BOOM",
          target_quantity: "2",
          owned_quantity: "0",
          missing_quantity: "2",
          asset_keys: [scenarioAsset],
          holdings: [],
        },
        {
          id: "owned",
          label: "The OMen",
          target_quantity: "2",
          owned_quantity: "82",
          missing_quantity: "0",
          asset_keys: ["owned"],
          holdings: [],
        },
      ],
      required_count: 2,
      satisfied_count: 1,
      complete: false,
      missing_asset_keys: [scenarioAsset],
      recipient: result.recipient,
      recipient_in_profile: true,
      counts_toward_profile: true,
    },
    result,
    available_result: {
      ...result,
      status: ApiCollectAcquisitionPlanStatusEnum.Complete,
      total_cost_wei: "210000000000000000",
      legs: [{ ...result.legs[0]!, quantity: "2" }],
      remaining_requirements: [],
      projected_profile_complete: true,
      projected_profile_satisfied_count: 2,
    },
    budget_wei: "150000000000000000",
    checked_asset_count: 1,
    total_asset_count: 1,
    unavailable_asset_count: 0,
    failed_asset_count: 0,
    candidate_universe_complete: false,
    gas_reserve_per_order_wei: "10000000000000000",
    assumptions: [],
    updated_at: 1,
    asset_scan_complete: true,
  };
}
