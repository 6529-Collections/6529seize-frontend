"use client";
import type { ApiCompetitionCreditBudget } from "@/generated/models/ApiCompetitionCreditBudget";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { formatInteger } from "@/i18n/format";

export default function CompetitionCredits({
  budget,
}: {
  readonly budget: ApiCompetitionCreditBudget;
}) {
  const locale = useBrowserLocale();
  const formatCredit = (value: number | null) =>
    value === null ? "—" : formatInteger(locale, value);
  return (
    <div
      className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-p-4 group-[.is-vote-panel]/inline-vote:tw-col-span-2 group-[.is-vote-panel]/inline-vote:tw-row-start-3 group-[.is-vote-panel]/inline-vote:tw-rounded-none group-[.is-vote-panel]/inline-vote:tw-border-0 group-[.is-vote-panel]/inline-vote:tw-px-0 group-[.is-vote-panel]/inline-vote:tw-pb-4 group-[.is-vote-panel]/inline-vote:tw-pt-1.5"
      aria-live="polite"
    >
      <dl className="tw-m-0 tw-grid tw-grid-cols-1 tw-gap-3 group-[.is-vote-panel]/inline-vote:tw-hidden sm:tw-grid-cols-3">
        {(["available", "spent", "remaining"] as const).map((field) => (
          <div key={field}>
            <dt className="tw-text-xs tw-text-iron-400">
              {t(locale, `competitions.${field}`)}
            </dt>
            <dd className="tw-m-0 tw-text-lg tw-font-semibold tw-tabular-nums tw-text-iron-100">
              {formatCredit(budget[field])}
            </dd>
          </div>
        ))}
      </dl>
      <dl className="tw-m-0 tw-hidden tw-flex-wrap tw-items-baseline tw-justify-between tw-gap-x-3 tw-gap-y-1 tw-text-xs tw-tabular-nums tw-leading-4 group-[.is-vote-panel]/inline-vote:tw-flex @[22rem]/vote:tw-text-[13px]">
        <div className="tw-flex tw-items-baseline tw-gap-1 tw-whitespace-nowrap">
          <dt className="tw-sr-only">{t(locale, "competitions.remaining")}</dt>
          <dd className="tw-m-0 tw-flex tw-items-baseline tw-gap-1">
            <span className="tw-font-semibold tw-text-white">
              {formatCredit(budget.remaining)}
            </span>
            <span aria-hidden="true" className="tw-text-iron-500">
              {t(locale, "competitions.creditLineRemaining")}
            </span>
          </dd>
        </div>
        <div className="tw-flex tw-items-baseline tw-gap-1 tw-whitespace-nowrap tw-font-medium tw-text-iron-300">
          <dt className="tw-sr-only">{t(locale, "competitions.spent")}</dt>
          <dd className="tw-m-0 tw-flex tw-items-baseline tw-gap-1">
            {formatCredit(budget.spent)}
            <span
              aria-hidden="true"
              className="tw-font-normal tw-text-iron-500"
            >
              {t(locale, "competitions.creditLineOf")}
            </span>
          </dd>
          <dt className="tw-sr-only">{t(locale, "competitions.available")}</dt>
          <dd className="tw-m-0 tw-flex tw-items-baseline tw-gap-1">
            {formatCredit(budget.available)}
            <span
              aria-hidden="true"
              className="tw-font-normal tw-text-iron-500"
            >
              {t(locale, "competitions.creditLineSpent")}
            </span>
          </dd>
        </div>
      </dl>
      {budget.remaining === null && (
        <p className="tw-mb-0 tw-mt-3 tw-text-xs tw-text-iron-400">
          {t(locale, "competitions.entryBudget")}
        </p>
      )}
    </div>
  );
}
