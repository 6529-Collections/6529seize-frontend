"use client";

import { useActiveWaveVotes } from "@/hooks/useActiveWaveVotes";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { ExploreWaveCardSkeleton } from "@/components/home/explore-waves/ExploreWaveCardSkeleton";
import { ActiveWaveVoteCard } from "./ActiveWaveVoteCard";

export function ActiveWaveVotes() {
  const locale = useBrowserLocale();
  const votes = useActiveWaveVotes();
  const count = votes.data?.pages[0]?.count;
  return (
    <section
      className="tw-px-4 tw-pb-6 tw-pt-4 md:tw-px-6 lg:tw-px-8"
      aria-label={t(locale, "waves.discovery.activeVotes")}
      aria-busy={votes.isPending}
    >
      <h1 className="tw-m-0 tw-mb-1.5 tw-flex tw-items-center tw-gap-3 tw-text-2xl tw-font-semibold tw-leading-8 tw-tracking-[-0.02em] tw-text-white">
        {t(locale, "waves.discovery.activeVotes")}
        {count !== undefined && (
          <span className="tw-inline-flex tw-aspect-square tw-min-w-[22px] tw-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-px-1 tw-text-[13px] tw-font-medium tw-leading-4 tw-text-iron-400">
            {formatInteger(locale, count)}
          </span>
        )}
      </h1>
      <p className="tw-m-0 tw-mb-6 tw-text-sm tw-leading-5 tw-text-iron-400">
        {t(locale, "waves.discovery.voteDescription")}
      </p>
      {votes.isPending && (
        <output className="tw-sr-only">
          {t(locale, "waves.discovery.loading")}
        </output>
      )}
      {votes.isError && (
        <p role="alert" className="tw-text-iron-400">
          {t(locale, "waves.discovery.error")}{" "}
          <button
            type="button"
            onClick={() => void votes.refetch()}
            className="tw-border-0 tw-bg-transparent tw-text-primary-300"
          >
            {t(locale, "waves.discovery.retry")}
          </button>
        </p>
      )}
      {!votes.isPending && !votes.isError && count === 0 && (
        <output className="tw-block tw-italic tw-text-iron-400">
          {t(locale, "waves.discovery.emptyVotes")}
        </output>
      )}
      <div className="tw-grid tw-grid-cols-1 tw-gap-4 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
        {votes.isPending &&
          Array.from({ length: 6 }, (_, index) => (
            <ExploreWaveCardSkeleton key={`vote-skeleton-${index}`} compact />
          ))}
        {votes.data?.pages
          .flatMap((page) => page.data)
          .map((vote) => (
            <ActiveWaveVoteCard key={vote.wave.id} vote={vote} />
          ))}
      </div>
      {votes.hasNextPage && (
        <button
          type="button"
          disabled={votes.isFetchingNextPage}
          aria-busy={votes.isFetchingNextPage}
          onClick={() => void votes.fetchNextPage()}
          className="tw-mt-6 tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-5 tw-text-sm tw-text-primary-300"
        >
          {t(
            locale,
            votes.isFetchingNextPage
              ? "waves.discovery.loading"
              : "waves.discovery.loadMore"
          )}
        </button>
      )}
    </section>
  );
}
