import {
  ApiCollectDailyTdhPlanStatusEnum,
  type ApiCollectDailyTdhPlan,
} from "@/generated/models/ApiCollectDailyTdhPlan";
import {
  ApiCollectDailyTdhRequestModeEnum,
  type ApiCollectDailyTdhRequest,
} from "@/generated/models/ApiCollectDailyTdhRequest";
import {
  ApiCollectDailyTdhSearchOptimalityEnum,
  ApiCollectDailyTdhSearchStopReasonEnum,
} from "@/generated/models/ApiCollectDailyTdhSearch";
import {
  targetPlan,
  targetRequest,
  TARGET_NOW,
} from "./collect-tdh-target.fixture";

export function dailyRequest(): ApiCollectDailyTdhRequest {
  const original = targetRequest();
  return {
    profile_id: original.profile_id,
    recipient: original.recipient,
    families: original.families ?? [],
    mode: ApiCollectDailyTdhRequestModeEnum.BaseTdhTarget,
    target_base_tdh_per_day_hundredths: "200",
  };
}
export function dailyPlan(request = dailyRequest()): ApiCollectDailyTdhPlan {
  const original = targetPlan();
  return {
    plan_id: "daily-plan",
    request,
    status: ApiCollectDailyTdhPlanStatusEnum.TargetMetBestFound,
    base_tdh_per_day_hundredths: "200",
    shortfall_base_tdh_per_day_hundredths: "0",
    purchase_cost_wei: original.purchase_cost_wei,
    signed_fees_wei: original.signed_fees_wei,
    remaining_budget_wei: null,
    gas_estimate_wei: null,
    funding_estimate_wei: null,
    items: original.items,
    personal_effects: {
      counts_toward_profile: true,
      baseline_base_tdh_per_day_hundredths: "100",
      proposed_base_tdh_per_day_hundredths: "300",
      baseline_boost: 1,
      proposed_boost: 1.1,
      baseline_boosted_tdh_per_day_ten_thousandths: "10000",
      proposed_boosted_tdh_per_day_ten_thousandths: "33000",
      additional_boosted_tdh_per_day_ten_thousandths: "23000",
      changed_boost_on_existing_tdh: 10,
    },
    catalog_version: original.catalog_version,
    valid_until: original.valid_until,
    coverage: original.coverage,
    search: {
      evaluated_portfolios: 2,
      candidate_count: 1,
      stop_reason: ApiCollectDailyTdhSearchStopReasonEnum.Complete,
      optimality: ApiCollectDailyTdhSearchOptimalityEnum.BestFound,
    },
    snapshot_block: 1,
    snapshot_timestamp: new Date(TARGET_NOW).toISOString(),
    acquisition_timestamp: new Date(TARGET_NOW).toISOString(),
    rules_version: "rules",
    assumptions: ["Captured listings only."],
  };
}
