import type { ApiCollectPlan } from "@/generated/models/ApiCollectPlan";
import type { ApiCollectPlanLeg } from "@/generated/models/ApiCollectPlanLeg";

export function collectPlanReviewFingerprint(plan: ApiCollectPlan): string {
  return JSON.stringify([
    plan.id,
    plan.revision,
    plan.state,
    plan.profile_id,
    plan.analysis.analysis_id,
    plan.analysis.account.membership_hash,
    plan.result.recipient,
    plan.result.evaluated_at,
    plan.result.legs,
  ]);
}

/** Keep the server plan intact and admit only exact legs from that plan. */
export function collectPlanReviewLegs(
  plan: ApiCollectPlan,
  requested: readonly ApiCollectPlanLeg[]
): ApiCollectPlanLeg[] {
  const seen = new Set<string>();
  const result: ApiCollectPlanLeg[] = [];
  for (const leg of requested) {
    const source = plan.result.legs.find(
      (candidate) => candidate.candidate_id === leg.candidate_id
    );
    if (
      !source ||
      seen.has(source.candidate_id) ||
      source.order_id !== leg.order_id ||
      source.asset_key !== leg.asset_key ||
      source.quantity !== leg.quantity ||
      source.unit_price_wei !== leg.unit_price_wei
    )
      return [];
    seen.add(source.candidate_id);
    result.push(source);
  }
  return result;
}
