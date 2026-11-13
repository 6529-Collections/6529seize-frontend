"use client";

import { useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { fetchContentModerationQueue } from "@/services/api/content-moderation-api";
import { formatContentModerationEnum } from "@/services/content-moderation/content-moderation-formatters";
import { MODERATION_CHECKS_QUERY_KEY } from "@/services/content-moderation/content-moderation-query";
import { checkButtonClass } from "./checks.helpers";
import CaseQueryFeedback from "./CaseQueryFeedback";

export default function CaseReports({
  caseId,
  profileId,
  initiallyOpen = false,
}: {
  readonly caseId: string;
  readonly profileId: string;
  readonly initiallyOpen?: boolean;
}) {
  const locale = useBrowserLocale();
  const [open, setOpen] = useState(initiallyOpen);
  const query = useInfiniteQuery({
    queryKey: [
      ...MODERATION_CHECKS_QUERY_KEY,
      profileId,
      "case-reports",
      caseId,
    ],
    queryFn: ({ pageParam, signal }) =>
      fetchContentModerationQueue({
        case_id: caseId,
        view: "OPEN",
        limit: 50,
        ...(pageParam ? { before: pageParam } : {}),
        signal,
      }),
    enabled: open,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) =>
      page.length === 50 ? page.at(-1)?.cursor : undefined,
    retry: false,
    gcTime: 0,
  });
  const items = query.data?.pages.flat() ?? [];
  return (
    <details
      className="tw-mt-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-p-4"
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary className="tw-min-h-11 tw-cursor-pointer tw-content-center tw-text-sm tw-font-semibold tw-text-iron-100 focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400">
        {t(locale, "checks.caseReports")}
      </summary>
      {open && (
        <div className="tw-mt-4 tw-space-y-4">
          <CaseQueryFeedback
            query={query}
            empty={items.length === 0}
            messages={{
              loading: "contentModeration.moderator.loading",
              error: "contentModeration.moderator.loadError",
              empty: "contentModeration.moderator.empty",
            }}
          />
          {items.map((item) => (
            <div
              key={item.id}
              className="tw-rounded-lg tw-bg-iron-900 tw-p-4 tw-text-sm tw-text-iron-200"
            >
              <p className="tw-m-0">
                {t(locale, "checks.caseAuthor", {
                  profile: item.author_handle
                    ? `@${item.author_handle}`
                    : item.author_profile_id,
                })}
              </p>
              <p className="tw-mb-0 tw-mt-2">
                {t(locale, "contentModeration.moderator.reportedBy", {
                  profile: item.reporter_handle
                    ? `@${item.reporter_handle}`
                    : item.reporter_profile_id,
                })}
              </p>
              <p className="tw-mb-0 tw-mt-2">
                {t(locale, "contentModeration.moderator.reportedFor", {
                  reason: formatContentModerationEnum(item.reason),
                })}
              </p>
              {item.notes && (
                <p className="tw-mb-0 tw-mt-2 tw-whitespace-pre-wrap tw-break-words">
                  {item.notes}
                </p>
              )}
              <Link
                className={`${checkButtonClass} tw-mt-3 tw-inline-flex tw-items-center tw-no-underline`}
                prefetch={false}
                href={`/content-moderation/checks?${new URLSearchParams({ case_id: caseId, review_status: "NEEDS_REVIEW", report: item.id }).toString()}`}
              >
                {t(locale, "checks.reviewReport")}
              </Link>
            </div>
          ))}
          {query.hasNextPage && (
            <button
              type="button"
              className={checkButtonClass}
              disabled={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              {t(locale, "contentModeration.moderator.loadMore")}
            </button>
          )}
        </div>
      )}
    </details>
  );
}
