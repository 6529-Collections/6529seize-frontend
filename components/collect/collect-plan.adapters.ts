import type { ApiCollectPlan } from "@/generated/models/ApiCollectPlan";
import { ApiCollectPlanStateEnum } from "@/generated/models/ApiCollectPlan";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { collectAnalysisView } from "./collect.adapters";
import type { CollectPlanView, CollectProfileView } from "./collect.types";
import { marketAmount } from "./market.adapters";
import { MARKET_ZERO } from "./market-validation";

export function collectCostPlanView(
  plan: ApiCollectPlan,
  profile: CollectProfileView,
  title: string,
  locale: SupportedLocale
): CollectPlanView | null {
  const base = collectAnalysisView(plan.analysis, profile, title, locale);
  if (!base || plan.profile_id !== profile.id) return null;
  const ready = plan.state === ApiCollectPlanStateEnum.Ready;
  const remaining = new Set(
    plan.result.remaining_requirements.map((item) => item.requirement_id)
  );
  let disabledReason: string | undefined;
  if (!ready)
    disabledReason = t(
      locale,
      plan.state === ApiCollectPlanStateEnum.Stale
        ? "collect.plan.stale"
        : "collect.plan.scanningShort"
    );
  else if (plan.result.legs.length === 0)
    disabledReason = t(
      locale,
      plan.analysis.complete
        ? "collect.goal.complete"
        : "collect.plan.noPurchases"
    );
  return {
    ...base,
    id: plan.id,
    revision: plan.revision,
    requirements: base.requirements.map((requirement) => ({
      ...requirement,
      status:
        requirement.status !== "owned" && !remaining.has(requirement.id)
          ? "selected"
          : requirement.status,
    })),
    totalLabel: marketAmount(plan.result.total_cost_wei, MARKET_ZERO),
    blockers: [],
    assumptions: [
      ...base.assumptions,
      t(locale, "collect.plan.observedPool", {
        count: plan.result.candidate_count,
      }),
      t(locale, "collect.plan.gasReserve"),
      t(locale, "collect.plan.remaining", {
        count: plan.result.remaining_requirements.length,
      }),
      ...plan.assumptions,
    ],
    reviewDisabledReason: disabledReason,
  };
}
