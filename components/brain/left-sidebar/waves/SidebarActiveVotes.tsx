"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";
import type { useActiveWaveVotes } from "@/hooks/useActiveWaveVotes";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import { ActiveWaveVoteRow } from "@/components/waves/discovery/ActiveWaveVoteRow";
import { t } from "@/i18n/messages";

export function SidebarActiveVotes({
  votes,
  collapsed,
  scoreDetailsDisabled = false,
}: {
  readonly votes: ReturnType<typeof useActiveWaveVotes>;
  readonly collapsed: boolean;
  readonly scoreDetailsDisabled?: boolean;
}) {
  const locale = useBrowserLocale();
  const { activeWave } = useMyStream();
  const scrollRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const items = votes.data?.pages.flatMap((page) => page.data) ?? [];
  const isEmpty =
    !votes.isPending && !votes.isError && votes.data?.pages[0]?.count === 0;
  const { fetchNextPage } = votes;
  const loadNextPage = useCallback(() => {
    void fetchNextPage();
  }, [fetchNextPage]);
  useInfiniteScroll(
    !collapsed && !votes.isError && votes.hasNextPage,
    votes.isFetchingNextPage,
    loadNextPage,
    scrollRef,
    sentinelRef,
    "32px"
  );
  const subscribeToOverflow = useCallback((notify: () => void) => {
    const element = scrollRef.current;
    const content = contentRef.current;
    if (!element || !content) return () => {};
    const observer = new ResizeObserver(notify);
    observer.observe(element);
    observer.observe(content);
    element.addEventListener("scroll", notify, { passive: true });
    return () => {
      observer.disconnect();
      element.removeEventListener("scroll", notify);
    };
  }, []);
  const readOverflow = useCallback(() => {
    const element = scrollRef.current;
    return (
      element !== null &&
      element.scrollHeight - element.scrollTop - element.clientHeight > 1
    );
  }, []);
  const moreBelow = useSyncExternalStore(
    subscribeToOverflow,
    readOverflow,
    () => false
  );
  return (
    <div className="tw-relative">
      <section
        ref={scrollRef}
        aria-label={t(locale, "waves.discovery.voteList")}
        data-wave-feature-list="active-votes"
        tabIndex={items.length > 3 && !collapsed ? 0 : -1}
        className="tw-max-h-36 tw-overflow-y-auto tw-overscroll-y-contain tw-rounded-lg [scrollbar-color:theme(colors.iron.700)_transparent] [scrollbar-width:thin] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        <div ref={contentRef}>
          {items.map((vote) => (
            <ActiveWaveVoteRow
              key={vote.wave.id}
              vote={vote}
              compact
              scoreDetailsDisabled={scoreDetailsDisabled}
              isActive={activeWave.id === vote.wave.id}
              onClick={(event) => {
                if (
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey ||
                  event.button !== 0
                )
                  return;
                event.preventDefault();
                activeWave.set(vote.wave.id, { isDirectMessage: false });
              }}
            />
          ))}
          {votes.isPending && (
            <output className="tw-flex tw-min-h-12 tw-items-center tw-py-2 tw-text-xs tw-leading-4 tw-text-iron-400">
              {t(locale, "waves.discovery.loading")}
            </output>
          )}
          {votes.isError && (
            <p
              role="alert"
              className="tw-m-0 tw-flex tw-min-h-12 tw-flex-wrap tw-items-center tw-gap-x-1 tw-py-2 tw-text-xs tw-leading-4 tw-text-iron-400"
            >
              <span>{t(locale, "waves.discovery.error")}</span>
              <button
                type="button"
                onClick={() => {
                  if (votes.isFetchNextPageError) {
                    void votes.fetchNextPage();
                  } else {
                    void votes.refetch();
                  }
                }}
                className="tw-inline-flex tw-min-h-8 tw-items-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-xs tw-leading-4 tw-text-primary-300"
              >
                {t(locale, "waves.discovery.retry")}
              </button>
            </p>
          )}
          {isEmpty && (
            <output className="tw-flex tw-min-h-12 tw-items-center tw-py-2 tw-text-xs tw-leading-4 tw-text-iron-400">
              {t(locale, "waves.discovery.emptyVotes")}
            </output>
          )}
          {votes.hasNextPage && !votes.isError && (
            <div ref={sentinelRef}>
              <button
                type="button"
                disabled={votes.isFetchingNextPage}
                aria-busy={votes.isFetchingNextPage}
                onClick={() => void votes.fetchNextPage()}
                className="tw-min-h-8 tw-w-full tw-border-0 tw-bg-transparent tw-text-xs tw-text-primary-300"
              >
                {t(
                  locale,
                  votes.isFetchingNextPage
                    ? "waves.discovery.loading"
                    : "waves.discovery.loadMore"
                )}
              </button>
            </div>
          )}
        </div>
      </section>
      {moreBelow && !collapsed && (
        <div
          aria-hidden="true"
          className="tw-pointer-events-none tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-3 tw-bg-gradient-to-t tw-from-[var(--wave-sidebar-background,#000)] tw-to-transparent"
        />
      )}
    </div>
  );
}
