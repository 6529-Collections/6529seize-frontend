"use client";

import Button from "@/components/utils/button/Button";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { formatNumber } from "@/i18n/format";
import type {
  CollectPlanScenario,
  CollectAcquisitionStrategy,
  CollectPlanView,
  CollectRequirementView,
} from "./collect.types";
import CollectStrategyPicker from "./CollectStrategyPicker";

function RequirementRows({
  requirements,
  locale,
}: {
  readonly requirements: readonly CollectRequirementView[];
  readonly locale: SupportedLocale;
}) {
  return (
    <ul className="tw-m-0 tw-list-none tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-white/5 tw-p-0">
      {requirements.map((requirement) => (
        <li
          key={requirement.id}
          className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-x-6 tw-gap-y-2 tw-py-4"
        >
          <div className="tw-min-w-0 tw-flex-1 tw-basis-48">
            <p className="tw-m-0 tw-break-words tw-text-sm tw-font-medium tw-text-iron-100">
              {requirement.label}
            </p>
            <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-leading-5 tw-text-iron-400">
              {requirement.detail}
            </p>
          </div>
          {requirement.status !== "owned" && (
            <div className="tw-flex tw-flex-wrap tw-items-start tw-gap-x-8 tw-gap-y-2">
              <div className="tw-min-w-32 tw-text-xs tw-leading-5 tw-text-iron-300">
                <p className="tw-m-0">
                  {requirement.availabilityLabel ??
                    t(locale, "collect.plan.notPriced")}
                </p>
                {requirement.purchaseLabel && (
                  <p className="tw-mb-0 tw-mt-1 tw-text-iron-400">
                    {requirement.purchaseLabel}
                  </p>
                )}
              </div>
              <p className="tw-m-0 tw-min-w-28 tw-text-right tw-text-sm tw-font-medium tw-tabular-nums tw-text-iron-100">
                {requirement.priceLabel ?? "—"}
              </p>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

export default function CollectPlanPanel({
  plan,
  locale,
  onReview,
  onPlanOffers,
  onScenarioChange,
  onStrategyChange,
}: {
  readonly plan: CollectPlanView;
  readonly locale: SupportedLocale;
  readonly onReview: (planId: string, revision: string) => void;
  readonly onPlanOffers?: (() => void) | undefined;
  readonly onScenarioChange?:
    | ((scenario: CollectPlanScenario) => void)
    | undefined;
  readonly onStrategyChange?:
    | ((strategy: CollectAcquisitionStrategy) => void)
    | undefined;
}) {
  const disabled =
    Boolean(plan.reviewDisabledReason) ||
    plan.blockers.length > 0 ||
    plan.totalLabel === null;
  const missing = plan.requirements.filter(
    (requirement) => requirement.status !== "owned"
  );
  const owned = plan.requirements.filter(
    (requirement) => requirement.status === "owned"
  );
  return (
    <section
      aria-label={t(locale, "collect.plan.title")}
      className="tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-pt-6"
    >
      <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-4">
        <div>
          <h2 className="tw-m-0 tw-text-xl tw-font-semibold tw-text-iron-100">
            {t(locale, "collect.plan.results")}
          </h2>
          <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-iron-300">
            {plan.coverageLabel}
          </p>
        </div>
        <div className="tw-text-left sm:tw-text-right">
          <p className="tw-m-0 tw-text-xs tw-text-iron-400">
            {t(locale, "collect.plan.estimate")}
          </p>
          <p className="tw-mb-0 tw-mt-1 tw-text-2xl tw-font-semibold tw-tabular-nums tw-text-iron-100">
            {plan.totalLabel ?? t(locale, "collect.plan.priceUnavailable")}
          </p>
        </div>
      </div>
      {onStrategyChange && (
        <CollectStrategyPicker
          value="buy"
          locale={locale}
          onChange={onStrategyChange}
        />
      )}
      {plan.scenarios && onScenarioChange && (
        <div
          role="group"
          aria-label={t(locale, "collect.plan.scenarios")}
          className="tw-mt-5 tw-grid tw-gap-3 sm:tw-grid-cols-2"
        >
          {plan.scenarios.map((scenario) => (
            <button
              key={scenario.id}
              type="button"
              aria-pressed={scenario.id === plan.scenario}
              onClick={() => onScenarioChange(scenario.id)}
              className={`tw-rounded-lg tw-border tw-border-solid tw-p-4 tw-text-left focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400 ${scenario.id === plan.scenario ? "tw-border-iron-500 tw-bg-iron-900" : "tw-border-white/10 tw-bg-transparent hover:tw-bg-iron-950"}`}
            >
              <span className="tw-flex tw-flex-wrap tw-justify-between tw-gap-2 tw-text-sm tw-font-semibold tw-text-iron-100">
                <span>{scenario.label}</span>
                <span className="tw-tabular-nums">{scenario.priceLabel}</span>
              </span>
              <span className="tw-mt-2 tw-block tw-text-xs tw-leading-5 tw-text-iron-400">
                {scenario.detail}
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="tw-my-5 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-4">
        <div className="tw-space-y-1 tw-text-xs tw-leading-5 tw-text-iron-400">
          {plan.outcomeLabel && (
            <p className="tw-m-0 tw-text-sm tw-text-iron-200">
              {plan.outcomeLabel}
            </p>
          )}
          {plan.purchaseTotalLabel && (
            <p className="tw-m-0">
              {t(locale, "collect.plan.costBreakdown", {
                purchases: plan.purchaseTotalLabel,
                gas: plan.gasReserveLabel ?? "—",
              })}
            </p>
          )}
        </div>
        <div className="tw-flex tw-flex-wrap tw-gap-2">
          <Button
            variant="action"
            disabled={disabled}
            onClick={() => onReview(plan.id, plan.revision)}
          >
            {t(locale, "collect.plan.review")}
          </Button>
          {onPlanOffers && (
            <Button variant="secondary" onClick={onPlanOffers}>
              {t(locale, "collect.plan.makeOffers")}
            </Button>
          )}
        </div>
      </div>
      {plan.reviewDisabledReason && (
        <p className="tw-text-xs tw-leading-5 tw-text-iron-400">
          {plan.reviewDisabledReason}
        </p>
      )}
      {plan.blockers.map((blocker) => (
        <p key={blocker} className="tw-text-sm tw-text-iron-300">
          {blocker}
        </p>
      ))}
      {missing.length > 0 && (
        <div role="group" aria-label={t(locale, "collect.plan.requirements")}>
          <div className="tw-flex tw-flex-wrap tw-justify-between tw-gap-2 tw-border-0 tw-border-b tw-border-solid tw-border-white/10 tw-pb-3 tw-text-xs tw-text-iron-400">
            <span>
              {t(locale, "collect.plan.missingNfts", {
                count: formatNumber(locale, missing.length),
              })}
            </span>
            <span>{t(locale, "collect.plan.quantityPrice")}</span>
          </div>
          <RequirementRows requirements={missing} locale={locale} />
        </div>
      )}
      {owned.length > 0 && (
        <details className="tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-py-3">
          <summary className="tw-cursor-pointer tw-rounded-lg tw-py-2 tw-text-sm tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
            {t(locale, "collect.plan.ownedNfts", {
              count: formatNumber(locale, owned.length),
            })}
          </summary>
          <RequirementRows requirements={owned} locale={locale} />
        </details>
      )}
      <details className="tw-border-0 tw-border-t tw-border-solid tw-border-white/10 tw-py-3 tw-text-xs tw-leading-5 tw-text-iron-400">
        <summary className="tw-cursor-pointer tw-rounded-lg tw-py-2 tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
          {t(locale, "collect.plan.assumptions")}
        </summary>
        <p>{plan.snapshotLabel}</p>
        <p>{t(locale, "collect.plan.availabilityScope")}</p>
        <ul className="tw-mb-0 tw-mt-2 tw-space-y-1 tw-pl-4">
          {plan.assumptions.map((assumption) => (
            <li key={assumption}>{assumption}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}
