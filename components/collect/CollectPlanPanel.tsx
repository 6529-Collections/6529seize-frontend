"use client";

import Button from "@/components/utils/button/Button";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import type { CollectPlanView } from "./collect.types";

const STATUS_CLASSES = {
  owned: "tw-bg-success/10 tw-text-success",
  selected: "tw-bg-primary-500/10 tw-text-primary-300",
  missing: "tw-bg-iron-800 tw-text-iron-300",
  unavailable: "tw-bg-iron-800 tw-text-iron-400",
} as const;

export default function CollectPlanPanel({
  plan,
  locale,
  onReview,
}: {
  readonly plan: CollectPlanView;
  readonly locale: SupportedLocale;
  readonly onReview: (planId: string, revision: string) => void;
}) {
  const disabled =
    Boolean(plan.reviewDisabledReason) ||
    plan.blockers.length > 0 ||
    plan.totalLabel === null;
  return (
    <section
      aria-label={t(locale, "collect.plan.title")}
      className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950"
    >
      <div className="tw-space-y-2 tw-p-5">
        <p className="tw-m-0 tw-text-xs tw-font-semibold tw-text-primary-300">
          {t(locale, "collect.profileScope", {
            profile: plan.profile.displayName,
          })}
        </p>
        <h2 className="tw-m-0 tw-text-xl tw-font-semibold tw-leading-7 tw-text-iron-100">
          {plan.title}
        </h2>
        <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-200">
          {plan.coverageLabel}
        </p>
        <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
          {t(locale, "collect.profileScopeDetail")}
        </p>
        <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
          {plan.snapshotLabel}
        </p>
      </div>
      <ul
        aria-label={t(locale, "collect.plan.requirements")}
        className="tw-m-0 tw-max-h-[45vh] tw-list-none tw-overflow-y-auto tw-border-0 tw-border-y tw-border-solid tw-border-white/10 tw-p-0"
      >
        {plan.requirements.map((requirement) => (
          <li
            key={requirement.id}
            className="tw-flex tw-items-center tw-gap-3 tw-border-0 tw-border-b tw-border-solid tw-border-white/5 tw-px-5 tw-py-3 last:tw-border-b-0"
          >
            {requirement.media !== undefined && requirement.media !== null && (
              <div className="tw-relative tw-flex tw-size-12 tw-shrink-0 tw-items-center tw-justify-center tw-overflow-hidden tw-rounded-lg tw-bg-iron-900 [&_img]:tw-max-h-full [&_img]:tw-object-contain">
                {requirement.media}
              </div>
            )}
            <div className="tw-min-w-0 tw-flex-1">
              <p className="tw-m-0 tw-break-words tw-text-sm tw-font-medium tw-text-iron-100">
                {requirement.label}
              </p>
              <p className="tw-mb-0 tw-mt-1 tw-text-xs tw-leading-5 tw-text-iron-400">
                {requirement.detail}
              </p>
            </div>
            <span
              className={`tw-shrink-0 tw-rounded-md tw-px-2 tw-py-1 tw-text-[11px] tw-font-medium ${STATUS_CLASSES[requirement.status]}`}
            >
              {t(locale, `collect.plan.status.${requirement.status}`)}
            </span>
          </li>
        ))}
      </ul>
      <div className="tw-space-y-4 tw-p-5">
        {plan.blockers.length > 0 && (
          <ul className="tw-m-0 tw-space-y-2 tw-pl-4 tw-text-sm tw-leading-5 tw-text-iron-300">
            {plan.blockers.map((blocker) => (
              <li key={blocker}>{blocker}</li>
            ))}
          </ul>
        )}
        {plan.assumptions.length > 0 && (
          <details className="tw-text-xs tw-leading-5 tw-text-iron-400">
            <summary className="tw-cursor-pointer tw-rounded tw-py-1 tw-text-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400">
              {t(locale, "collect.plan.assumptions")}
            </summary>
            <ul className="tw-mb-0 tw-mt-2 tw-space-y-1 tw-pl-4">
              {plan.assumptions.map((assumption) => (
                <li key={assumption}>{assumption}</li>
              ))}
            </ul>
          </details>
        )}
        <div className="tw-flex tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-2">
          <span className="tw-text-sm tw-text-iron-400">
            {t(locale, "collect.plan.estimate")}
          </span>
          <strong className="tw-text-lg tw-tabular-nums tw-text-iron-100">
            {plan.totalLabel ?? t(locale, "collect.plan.priceUnavailable")}
          </strong>
        </div>
        <Button
          variant="action"
          size="lg"
          fullWidth
          disabled={disabled}
          onClick={() => onReview(plan.id, plan.revision)}
        >
          {t(locale, "collect.plan.review")}
        </Button>
        {plan.reviewDisabledReason && (
          <p className="tw-m-0 tw-text-xs tw-leading-5 tw-text-iron-400">
            {plan.reviewDisabledReason}
          </p>
        )}
      </div>
    </section>
  );
}
