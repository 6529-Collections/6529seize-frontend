"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchModerationCounts } from "@/services/api/moderation-checks-api";
import { MODERATION_CHECKS_QUERY_KEY } from "@/services/content-moderation/content-moderation-query";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { checkButtonClass } from "./checks.helpers";

export default function ModerationCheckCounts({
  profileId,
}: {
  readonly profileId: string;
}) {
  const locale = useBrowserLocale();
  const query = useQuery({
    queryKey: [...MODERATION_CHECKS_QUERY_KEY, profileId, "counts"],
    queryFn: ({ signal }) => fetchModerationCounts(signal),
    refetchInterval: 60_000,
    retry: false,
    gcTime: 0,
  });
  return (
    <section className="tw-mt-6" aria-label={t(locale, "checks.title")}>
      <dl
        aria-busy={query.isLoading}
        className="tw-m-0 tw-grid tw-grid-cols-2 tw-gap-3 xl:tw-grid-cols-4"
      >
        {(
          [
            "needs_review",
            "quarantined",
            "rejected_today",
            "evaluator_failures_today",
          ] as const
        ).map((key) => (
          <div
            key={key}
            className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4"
          >
            <dt className="tw-text-sm tw-text-iron-300">
              {t(locale, `checks.count.${key}`)}
            </dt>
            <dd className="tw-mb-0 tw-ml-0 tw-mt-2 tw-text-2xl tw-font-semibold tw-tabular-nums tw-text-iron-50">
              {query.data ? formatInteger(locale, query.data[key]) : "—"}
            </dd>
          </div>
        ))}
      </dl>
      <p className="tw-mb-0 tw-mt-2 tw-text-xs tw-text-iron-400">
        {t(locale, "checks.count.help")}
      </p>
      {query.isError && (
        <div role="alert" className="tw-mt-3 tw-text-sm tw-text-iron-300">
          {t(locale, "checks.error")}{" "}
          <button
            className={checkButtonClass}
            onClick={() => void query.refetch()}
            type="button"
          >
            {t(locale, "checks.retry")}
          </button>
        </div>
      )}
    </section>
  );
}
