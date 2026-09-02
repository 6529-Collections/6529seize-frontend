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

export default function BlockActivityFeed() {
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
    retry: false,
  });
  const items = useMemo(() => query.data?.pages.flat() ?? [], [query.data]);
  const { fetchNextPage, hasNextPage, isFetchingNextPage } = query;
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  const loadMoreRef = useIntersectionObserver(loadMore);

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
    <div className="tw-mt-8 tw-space-y-3">
      {items.map((item) => (
        <BlockActivityCard key={item.id} item={item} />
      ))}
      {hasNextPage && (
        <div
          ref={loadMoreRef}
          aria-hidden={!isFetchingNextPage}
          className="tw-flex tw-min-h-12 tw-items-center tw-justify-center tw-pt-2"
        >
          {isFetchingNextPage && (
            <output className="tw-text-sm tw-text-iron-400">
              {t(locale, "contentModeration.moderator.loadingMore")}
            </output>
          )}
        </div>
      )}
    </div>
  );
}
