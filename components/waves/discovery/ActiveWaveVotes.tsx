"use client";

import { useActiveWaveVotes } from "@/hooks/useActiveWaveVotes";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { ActiveWaveVoteRow } from "./ActiveWaveVoteRow";

export function ActiveWaveVotes() {
  const locale = useBrowserLocale();
  const votes = useActiveWaveVotes();
  const count = votes.data?.pages[0]?.count;
  return (
    <section
      className="tw-px-4 tw-py-6 md:tw-px-6 lg:tw-px-8"
      aria-label={t(locale, "waves.discovery.activeVotes")}
    >
      <h1 className="tw-text-2xl tw-font-semibold tw-text-white">
        {t(locale, "waves.discovery.activeVotes")}
        {count !== undefined && (
          <span className="tw-ml-3 tw-text-iron-400">
            {formatInteger(locale, count)}
          </span>
        )}
      </h1>
      <p className="tw-text-sm tw-text-iron-400">
        {t(locale, "waves.discovery.voteDescription")}
      </p>
      {votes.isPending && (
        <output className="tw-block tw-text-iron-400">
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
        <output className="tw-block tw-text-iron-400">
          {t(locale, "waves.discovery.emptyVotes")}
        </output>
      )}
      <div className="tw-grid tw-grid-cols-1 tw-gap-3 md:tw-grid-cols-2 xl:tw-grid-cols-3">
        {votes.data?.pages
          .flatMap((page) => page.data)
          .map((vote) => (
            <div
              key={vote.wave.id}
              className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-2"
            >
              <ActiveWaveVoteRow vote={vote} />
            </div>
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
