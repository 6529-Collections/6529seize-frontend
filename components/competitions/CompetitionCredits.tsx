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
      className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-p-4"
      aria-live="polite"
    >
      <dl className="tw-m-0 tw-grid tw-grid-cols-1 tw-gap-3 sm:tw-grid-cols-3">
        {(["available", "spent", "remaining"] as const).map((field) => (
          <div key={field}>
            <dt className="tw-text-xs tw-text-iron-400">
              {t(locale, `competitions.${field}`)}
            </dt>
            <dd className="tw-m-0 tw-text-lg tw-font-semibold tw-tabular-nums tw-text-iron-100">
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
