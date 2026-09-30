"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ClockIcon } from "@heroicons/react/24/outline";
import { useCompetition } from "@/contexts/CompetitionContext";
import { useCompetitionResource } from "@/hooks/competitions/useCompetitionQueries";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatDate } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { CompetitionLoadMore } from "./CompetitionLoadMore";
import { CompetitionState } from "./CompetitionState";

export default function CompetitionPauseHistory({
  action,
}: {
  readonly action: ReactNode;
}) {
  const { competition } = useCompetition();
  const locale = useBrowserLocale();
  const query = useCompetitionResource(
    { waveId: competition.wave_id, competitionId: competition.id },
    "pauses",
    { direction: "DESC" }
  );
  const pauses = query.data?.pages.flatMap((page) => page.data) ?? [];
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  const date = (value: number) => (
    <time dateTime={new Date(value).toISOString()}>
      {formatDate(locale, value, { dateStyle: "medium", timeStyle: "short" })}
    </time>
  );
  return (
    <section
      aria-labelledby="competition-pause-history"
      className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950"
    >
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-p-4 sm:tw-px-5">
        <h2
          id="competition-pause-history"
          className="tw-m-0 tw-flex tw-items-center tw-gap-2.5 tw-text-sm tw-font-semibold tw-text-iron-100"
        >
          <ClockIcon
            className="tw-size-4 tw-text-iron-400"
            aria-hidden="true"
          />
          {t(locale, "competitions.pauseHistory")}
        </h2>
        {action}
      </div>
      {query.isLoading ? (
        <CompetitionState />
      ) : (
        <>
          {pauses.length > 0 ? (
            <ol className="tw-m-0 tw-list-none tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800/60 tw-p-0">
              {pauses.map((pause) => {
                const upcoming = pause.start_time > now;
                const ended = pause.end_time !== null && pause.end_time <= now;
                let status:
                  | "competitions.pauseActive"
                  | "competitions.pauseScheduled"
                  | "competitions.pauseEnded" = "competitions.pauseActive";
                if (upcoming) status = "competitions.pauseScheduled";
                else if (ended) status = "competitions.pauseEnded";
                const reason = pause.reason?.trim();
                return (
                  <li key={pause.id} className="tw-space-y-3 tw-p-4 sm:tw-px-5">
                    <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
                      <span
                        className={`tw-rounded-full tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium ${ended ? "tw-bg-iron-800 tw-text-iron-300" : "tw-bg-amber-400/10 tw-text-amber-400"}`}
                      >
                        {t(locale, status)}
                      </span>
                      <span className="tw-text-xs tw-leading-5 tw-text-iron-400">
                        {date(pause.start_time)}
                        <span aria-hidden="true"> – </span>
                        {pause.end_time === null
                          ? t(locale, "competitions.pauseUntilResumed")
                          : date(pause.end_time)}
                      </span>
                    </div>
                    <p className="tw-m-0 tw-whitespace-pre-wrap tw-break-words tw-text-sm tw-leading-6 tw-text-iron-200 [overflow-wrap:anywhere]">
                      {reason === undefined || reason.length === 0
                        ? t(locale, "competitions.pauseNoReason")
                        : reason}
                    </p>
                  </li>
                );
              })}
            </ol>
          ) : (
            !query.isError && (
              <p className="tw-m-0 tw-p-4 tw-text-sm tw-text-iron-400 sm:tw-px-5">
                {t(locale, "competitions.pauseHistoryEmpty")}
              </p>
            )
          )}
          {query.isError && (
            <CompetitionState error retry={() => void query.refetch()} />
          )}
          {query.hasNextPage && (
            <div className="tw-p-4 sm:tw-px-5">
              <CompetitionLoadMore query={query} />
            </div>
          )}
        </>
      )}
    </section>
  );
}
