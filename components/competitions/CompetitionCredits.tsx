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
      <dl className="tw-m-0 tw-grid tw-grid-cols-1 tw-gap-3 group-[.is-mini]/inline-vote:tw-grid-cols-2 group-[.is-mini]/inline-vote:tw-gap-x-2 group-[.is-mini]/inline-vote:tw-gap-y-2 sm:tw-grid-cols-3 group-[.is-mini]/inline-vote:[&>div:first-child]:tw-order-last group-[.is-mini]/inline-vote:[&>div:last-child>dd]:tw-text-sm group-[.is-mini]/inline-vote:[&>div:last-child>dd]:tw-text-iron-100 group-[.is-mini]/inline-vote:[&>div:last-child>dt]:tw-text-sm group-[.is-mini]/inline-vote:[&>div:last-child>dt]:tw-text-iron-200 group-[.is-mini]/inline-vote:[&>div:last-child]:-tw-order-1 group-[.is-mini]/inline-vote:[&>div:last-child]:tw-col-span-2 group-[.is-mini]/inline-vote:[&>div:last-child]:tw-justify-between group-[.is-mini]/inline-vote:[&>div:last-child]:tw-border-0 group-[.is-mini]/inline-vote:[&>div:last-child]:tw-border-b group-[.is-mini]/inline-vote:[&>div:last-child]:tw-border-solid group-[.is-mini]/inline-vote:[&>div:last-child]:tw-border-iron-700 group-[.is-mini]/inline-vote:[&>div:last-child]:tw-pb-2 group-[.is-mini]/inline-vote:[&>div]:tw-flex group-[.is-mini]/inline-vote:[&>div]:tw-flex-wrap group-[.is-mini]/inline-vote:[&>div]:tw-items-baseline group-[.is-mini]/inline-vote:[&>div]:tw-gap-x-1">
        {(["available", "spent", "remaining"] as const).map((field) => (
          <div key={field}>
            <dt className="tw-text-xs tw-text-iron-400">
              {t(locale, `competitions.${field}`)}
            </dt>
            <dd className="tw-m-0 tw-text-lg tw-font-semibold tw-tabular-nums tw-text-iron-100 group-[.is-mini]/inline-vote:tw-break-all group-[.is-mini]/inline-vote:tw-text-xs group-[.is-mini]/inline-vote:tw-text-iron-400">
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
