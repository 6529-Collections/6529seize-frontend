import type { ApiCollectPlan } from "@/generated/models/ApiCollectPlan";
import type { ApiCollectAcquisitionPlan } from "@/generated/models/ApiCollectAcquisitionPlan";
import type { ApiCollectPlanLeg } from "@/generated/models/ApiCollectPlanLeg";
import { ApiCollectPlanStateEnum } from "@/generated/models/ApiCollectPlan";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { collectAnalysisView } from "./collect.adapters";
import type {
  CollectPlanScenario,
  CollectPlanView,
  CollectProfileView,
} from "./collect.types";
import { formatDecimalString, formatNumber } from "@/i18n/format";
import { collectPlanSelectionCost } from "./collect-plan-selection.helpers";
import { collectPlanAmount } from "./collect-plan-amounts";

export function collectPlanForScenario(
  plan: ApiCollectPlan,
  scenario: CollectPlanScenario
): ApiCollectPlan {
  if (scenario === "available" && plan.available_result)
    return { ...plan, result: plan.available_result };
  return plan;
}

function copyCount(legs: readonly ApiCollectPlanLeg[]): string {
  return legs
    .reduce((total, leg) => total + BigInt(leg.quantity), 0n)
    .toString();
}

function scenarioView(
  id: CollectPlanScenario,
  label: string,
  result: ApiCollectAcquisitionPlan,
  locale: SupportedLocale
) {
  return {
    id,
    label,
    priceLabel: collectPlanAmount(locale, result.total_cost_wei).compact,
    priceExactLabel: collectPlanAmount(locale, result.total_cost_wei).exact,
    detail: t(locale, "collect.plan.scenario.detail", {
      count: formatNumber(locale, result.legs.length),
      remaining: formatNumber(locale, result.remaining_requirements.length),
    }),
  };
}

export function collectCostPlanView(
  source: ApiCollectPlan,
  profile: CollectProfileView,
  title: string,
  locale: SupportedLocale,
  scenario: CollectPlanScenario = "budget"
): CollectPlanView | null {
  const plan = collectPlanForScenario(source, scenario);
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
  const purchaseTotal = collectPlanSelectionCost(plan.result.legs);
  const total = BigInt(plan.result.total_cost_wei);
  const gas =
    purchaseTotal !== null && total >= BigInt(purchaseTotal)
      ? (total - BigInt(purchaseTotal)).toString()
      : null;
  const available = source.available_result ?? source.result;
  return {
    ...base,
    id: plan.id,
    revision: plan.revision,
    requirements: base.requirements.map((requirement, index) => {
      const keys = new Set(plan.analysis.requirements[index]?.asset_keys ?? []);
      const purchased = plan.result.legs.filter((leg) =>
        keys.has(leg.asset_key)
      );
      const priced = available.legs.filter((leg) => keys.has(leg.asset_key));
      const cost = collectPlanSelectionCost(
        purchased.length > 0 ? purchased : priced
      );
      let availabilityLabel = t(
        locale,
        ready ? "collect.plan.notPriced" : "collect.plan.checkingAvailability"
      );
      if (priced.length > 0)
        availabilityLabel = t(locale, "collect.plan.availableCopies", {
          count: formatDecimalString(locale, copyCount(priced)),
        });
      let purchaseLabel: string | undefined;
      if (purchased.length > 0)
        purchaseLabel = t(locale, "collect.plan.buyCopies", {
          count: formatDecimalString(locale, copyCount(purchased)),
        });
      else if (
        priced.length > 0 &&
        source.budget_wei !== undefined &&
        scenario === "budget"
      )
        purchaseLabel = t(locale, "collect.plan.outsideBudget");
      let availabilityRank: 0 | 1 | 2 = 2;
      if (purchased.length > 0) availabilityRank = 0;
      else if (priced.length > 0) availabilityRank = 1;
      return {
        ...requirement,
        status:
          requirement.status !== "owned" && !remaining.has(requirement.id)
            ? "selected"
            : requirement.status,
        availabilityLabel,
        availabilityRank,
        artworkKeys:
          keys.size === 1
            ? [...keys]
            : [...new Set(purchased.map((leg) => leg.asset_key))],
        ...(cost !== null && (purchased.length > 0 || priced.length > 0)
          ? {
              priceLabel: collectPlanAmount(locale, cost).compact,
              priceExactLabel: collectPlanAmount(locale, cost).exact,
            }
          : {}),
        ...(purchaseLabel ? { purchaseLabel } : {}),
      };
    }),
    totalLabel: collectPlanAmount(locale, plan.result.total_cost_wei).compact,
    totalExactLabel: collectPlanAmount(locale, plan.result.total_cost_wei)
      .exact,
    ...(purchaseTotal !== null
      ? {
          purchaseTotalLabel: collectPlanAmount(locale, purchaseTotal).compact,
          purchaseTotalExactLabel: collectPlanAmount(locale, purchaseTotal)
            .exact,
        }
      : {}),
    ...(gas !== null
      ? {
          gasReserveLabel: collectPlanAmount(locale, gas, 8).compact,
          gasReserveExactLabel: collectPlanAmount(locale, gas, 8).exact,
        }
      : {}),
    outcomeLabel: plan.analysis.counts_toward_profile
      ? t(locale, "collect.plan.outcome", {
          owned: formatNumber(
            locale,
            plan.result.projected_profile_satisfied_count
          ),
          total: formatNumber(locale, plan.analysis.required_count),
        })
      : t(locale, "collect.plan.giftOutcome"),
    scenario,
    ...(source.available_result && source.budget_wei !== undefined
      ? {
          scenarios: [
            scenarioView(
              "budget",
              t(locale, "collect.plan.scenario.budget", {
                budget: collectPlanAmount(locale, source.budget_wei).exact,
              }),
              source.result,
              locale
            ),
            scenarioView(
              "available",
              t(locale, "collect.plan.scenario.available"),
              source.available_result,
              locale
            ),
          ],
        }
      : {}),
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
