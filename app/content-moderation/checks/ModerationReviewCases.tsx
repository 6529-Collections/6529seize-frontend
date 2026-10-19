"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import ModerationOriginalPostLink from "@/components/content-moderation/ModerationOriginalPostLink";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { fetchModerationReviewCases } from "@/services/api/moderation-checks-api";
import { MODERATION_CHECKS_QUERY_KEY } from "@/services/content-moderation/content-moderation-query";
import { formatContentModerationEnum } from "@/services/content-moderation/content-moderation-formatters";
import { checkButtonClass, checkValueLabel } from "./checks.helpers";
import type { ApiModerationReviewCase } from "@/generated/models/ApiModerationReviewCase";

function CaseCard({ item }: { readonly item: ApiModerationReviewCase }) {
  const locale = useBrowserLocale();
  const params = new URLSearchParams({
    case_id: item.id,
    review_status: "NEEDS_REVIEW",
  });
  if (item.report_id) params.set("report", item.report_id);
  else if (item.check_id) params.set("check", item.check_id);
  return (
    <article className="tw-min-w-0 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-5">
      <div className="tw-flex tw-flex-wrap tw-gap-2 tw-text-xs tw-font-semibold tw-text-iron-300">
        {item.open_report_count > 0 && (
          <span className="tw-rounded-full tw-bg-iron-800 tw-px-2 tw-py-1">
            {t(locale, "checks.queue.userReport")}
          </span>
        )}
        {item.pending_check_count > 0 && (
          <span className="tw-rounded-full tw-bg-iron-800 tw-px-2 tw-py-1">
            {t(locale, "checks.queue.automatedCheck")}
          </span>
        )}
      </div>
      <h2 className="tw-mb-0 tw-mt-3 tw-text-base tw-font-semibold tw-text-iron-100">
        {checkValueLabel(locale, item.subject_type)}
      </h2>
      <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-iron-400">
        {t(locale, "checks.caseRequirements", {
          reports: formatInteger(locale, item.open_report_count),
          checks: formatInteger(locale, item.pending_check_count),
        })}
      </p>
      {item.open_report_count > 0 && item.report_reason && (
        <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-iron-300">
          {t(locale, "contentModeration.moderator.reportedFor", {
            reason: formatContentModerationEnum(item.report_reason),
          })}
        </p>
      )}
      {item.pending_check_count > 0 &&
        item.check_outcome !== null &&
        item.check_outcome !== undefined && (
          <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-iron-300">
            {t(locale, "checks.caseOutcome", {
              outcome: checkValueLabel(locale, item.check_outcome),
            })}
          </p>
        )}
      <p className="tw-mb-0 tw-mt-3 tw-whitespace-pre-wrap tw-break-words tw-text-sm tw-leading-6 tw-text-iron-200 [overflow-wrap:anywhere]">
        {item.preview ?? t(locale, "checks.noPreview")}
      </p>
      {item.drop_id && (
        <ModerationOriginalPostLink
          dropId={item.drop_id}
          waveId={item.wave_id}
          deleted={item.drop_deleted}
        />
      )}
      <Link
        href={`/content-moderation/checks?${params.toString()}`}
        prefetch={false}
        className={`${checkButtonClass} tw-mt-4 tw-inline-flex tw-items-center tw-no-underline`}
      >
        {t(locale, "checks.reviewCase")}
      </Link>
    </article>
  );
}

export default function ModerationReviewCases({
  profileId,
}: {
  readonly profileId: string;
}) {
  const locale = useBrowserLocale();
  const query = useInfiniteQuery({
    queryKey: [...MODERATION_CHECKS_QUERY_KEY, profileId, "cases"],
    queryFn: ({ pageParam, signal }) =>
      fetchModerationReviewCases(pageParam, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.next_cursor ?? undefined,
    retry: false,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
    gcTime: 0,
  });
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <div className="tw-mt-8 tw-space-y-5">
      {query.isLoading && (
        <output className="tw-block tw-text-sm tw-text-iron-400">
          {t(locale, "checks.loading")}
        </output>
      )}
      {query.isError && (
        <div role="alert" className="tw-text-sm tw-text-iron-300">
          <p>{t(locale, "contentModeration.moderator.loadError")}</p>
          <button
            type="button"
            className={checkButtonClass}
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            {t(locale, "checks.retry")}
          </button>
        </div>
      )}
      {query.isSuccess && items.length === 0 && (
        <p className="tw-text-sm tw-text-iron-400">
          {t(locale, "checks.queue.empty")}
        </p>
      )}
      {items.map((item) => (
        <CaseCard key={item.id} item={item} />
      ))}
      {query.hasNextPage && (
        <button
          type="button"
          className={`${checkButtonClass} tw-w-full`}
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          {t(
            locale,
            query.isFetchingNextPage
              ? "checks.loading"
              : "contentModeration.moderator.loadMore"
          )}
        </button>
      )}
    </div>
  );
}
