"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ApiModerationCheckReviewStatusEnum } from "@/generated/models/ApiModerationCheck";
import { formatDate } from "@/i18n/format";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { fetchModerationChecks } from "@/services/api/moderation-checks-api";
import { MODERATION_CHECKS_QUERY_KEY } from "@/services/content-moderation/content-moderation-query";
import { checkButtonClass, checkValueLabel } from "./checks.helpers";
import CaseQueryFeedback from "./CaseQueryFeedback";

export default function CaseChecks({
  caseId,
  profileId,
  selectedCheckId,
}: {
  readonly caseId: string;
  readonly profileId: string;
  readonly selectedCheckId?: string | undefined;
}) {
  const locale = useBrowserLocale();
  const query = useInfiniteQuery({
    queryKey: [
      ...MODERATION_CHECKS_QUERY_KEY,
      profileId,
      "case-checks",
      caseId,
    ],
    queryFn: ({ pageParam, signal }) =>
      fetchModerationChecks(
        {
          case_id: caseId,
          review_status: ApiModerationCheckReviewStatusEnum.NeedsReview,
        },
        pageParam,
        signal
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.next_cursor ?? undefined,
    retry: false,
    gcTime: 0,
  });
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  return (
    <details
      className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4"
      open
    >
      <summary className="tw-min-h-11 tw-cursor-pointer tw-content-center tw-text-sm tw-font-semibold tw-text-iron-100 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400">
        {t(locale, "checks.caseChecks")}
      </summary>
      <CaseQueryFeedback
        query={query}
        empty={items.length === 0}
        messages={{
          loading: "checks.loading",
          error: "checks.error",
          empty: "checks.empty",
        }}
      />
      <ul className="tw-m-0 tw-list-none tw-space-y-2 tw-p-0">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              prefetch={false}
              aria-current={selectedCheckId === item.id ? "true" : undefined}
              href={`/content-moderation/checks?${new URLSearchParams({ case_id: caseId, review_status: ApiModerationCheckReviewStatusEnum.NeedsReview, check: item.id })}`}
              className={`${checkButtonClass} tw-mt-2 tw-flex tw-flex-col tw-gap-2 tw-no-underline`}
            >
              <span>{t(locale, "checks.open")}</span>
              <span>
                {t(locale, "checks.automatedOutcome", {
                  outcome: checkValueLabel(locale, item.outcome),
                })}
              </span>
              <span>
                {formatDate(locale, item.created_at, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
              {item.preview && (
                <span className="tw-line-clamp-2 tw-whitespace-pre-wrap">
                  {item.preview}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
      {query.hasNextPage && (
        <button
          type="button"
          className={`${checkButtonClass} tw-mt-3`}
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          {t(locale, "checks.more")}
        </button>
      )}
    </details>
  );
}
