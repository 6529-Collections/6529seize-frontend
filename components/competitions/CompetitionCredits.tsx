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
  return (
    <div
      className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-p-4 group-[.is-mini]/inline-vote:tw-col-span-2 group-[.is-mini]/inline-vote:tw-row-start-3 group-[.is-mini]/inline-vote:tw-rounded-none group-[.is-mini]/inline-vote:tw-border-0 group-[.is-mini]/inline-vote:tw-p-0"
      aria-live="polite"
    >
      <dl className="tw-m-0 tw-grid tw-grid-cols-1 tw-gap-3 group-[.is-mini]/inline-vote:tw-grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] group-[.is-mini]/inline-vote:tw-gap-x-2 sm:tw-grid-cols-3 group-[.is-mini]/inline-vote:[&>div:nth-child(2)]:tw-text-center group-[.is-mini]/inline-vote:[&>div:last-child]:tw-text-right">
        {(["available", "spent", "remaining"] as const).map((field) => (
          <div key={field}>
            <dt className="tw-text-xs tw-text-iron-400 group-[.is-mini]/inline-vote:tw-text-xs group-[.is-mini]/inline-vote:tw-text-iron-500 group-[.is-mini]/inline-vote:max-sm:tw-text-[13px]">
              <span className="group-[.is-mini]/inline-vote:tw-hidden">
                {t(locale, `competitions.${field}`)}
              </span>
              <span className="tw-hidden group-[.is-mini]/inline-vote:tw-inline">
                {t(locale, `competitions.${field}Short`)}
              </span>
            </dt>
            <dd className="tw-m-0 tw-text-lg tw-font-semibold tw-tabular-nums tw-text-iron-100 group-[.is-mini]/inline-vote:tw-break-all group-[.is-mini]/inline-vote:tw-mt-0.5 group-[.is-mini]/inline-vote:tw-text-xs group-[.is-mini]/inline-vote:tw-font-medium group-[.is-mini]/inline-vote:tw-text-iron-300 group-[.is-mini]/inline-vote:max-sm:tw-text-[13px]">
              {budget[field] === null
                ? "—"
                : formatInteger(locale, budget[field])}
            </dd>
          </div>
        ))}
      </dl>
      {budget.remaining === null && (
        <p className="tw-mb-0 tw-mt-3 tw-text-xs tw-text-iron-400">
          {t(locale, "competitions.entryBudget")}
        </p>
      )}
    </div>
  );
}
