"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { t } from "@/i18n/messages";
import { fetchContentModerationBlockActivity } from "@/services/api/content-moderation-api";
import { BLOCK_ACTIVITY_QUERY_KEY } from "@/services/content-moderation/content-moderation-query";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import BlockActivityCard from "./BlockActivityCard";

const BLOCK_ACTIVITY_PAGE_SIZE = 50;

export default function BlockActivityFeed({
  enabled,
}: {
  readonly enabled: boolean;
}) {
  const locale = useBrowserLocale();
  const query = useInfiniteQuery({
    queryKey: BLOCK_ACTIVITY_QUERY_KEY,
    queryFn: ({ pageParam }) =>
      fetchContentModerationBlockActivity({
        limit: BLOCK_ACTIVITY_PAGE_SIZE,
        ...(pageParam === undefined ? {} : { before: pageParam }),
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.length === BLOCK_ACTIVITY_PAGE_SIZE
        ? lastPage.at(-1)?.cursor
        : undefined,
    enabled,
    retry: false,
  });
  const items = useMemo(() => query.data?.pages.flat() ?? [], [query.data]);
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = query;
  const loadMore = useCallback(() => {
    if (enabled && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [enabled, fetchNextPage, hasNextPage, isFetchingNextPage]);
  const loadMoreRef = useIntersectionObserver(loadMore);

  if (!enabled) {
    return null;
  }

  if (query.isLoading) {
    return (
      <output className="tw-mb-0 tw-mt-8 tw-text-sm tw-text-iron-400">
        {t(locale, "contentModeration.moderator.blockActivity.loading")}
      </output>
    );
  }
  if (query.isError) {
    return (
      <p role="alert" className="tw-mb-0 tw-mt-8 tw-text-sm tw-text-red">
        {t(locale, "contentModeration.moderator.loadError")}
      </p>
    );
  }
  if (items.length === 0) {
    return (
      <p className="tw-mb-0 tw-mt-8 tw-text-sm tw-text-iron-400">
        {t(locale, "contentModeration.moderator.emptyBlockActivity")}
      </p>
    );
  }

  return (
    <div className="tw-mt-4 tw-w-full tw-@container">
      <ul className="tw-m-0 tw-list-none tw-p-0">
        {items.map((item) => (
          <BlockActivityCard key={item.id} item={item} />
        ))}
      </ul>
      {hasNextPage && (
        <div
          ref={loadMoreRef}
          className="tw-flex tw-min-h-14 tw-items-end tw-justify-center tw-pt-3"
        >
          <button
            type="button"
            disabled={isFetchingNextPage}
            onClick={loadMore}
            className="tw-cursor-pointer tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-200 hover:tw-bg-iron-800 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-default disabled:tw-opacity-50"
          >
            {t(
              locale,
              isFetchingNextPage
                ? "contentModeration.moderator.loadingMore"
                : "contentModeration.moderator.loadMore"
            )}
          </button>
        </div>
      )}
    </div>
  );
}
