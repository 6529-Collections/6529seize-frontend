"use client";

import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import DropVoteProgressing from "@/components/drops/view/utils/DropVoteProgressing";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import { Time } from "@/helpers/time";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import {
  getWaveCompetitionEntriesQueryKey,
  useWaveCompetitionEntries,
} from "@/hooks/useWaveCompetitionEntries";
import { formatDate, formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { CalendarDaysIcon, FlagIcon } from "@heroicons/react/24/outline";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import {
  SingleWaveDropVote,
  SingleWaveDropVoteSize,
} from "../drop/SingleWaveDropVote";
import { SubmissionPosition } from "./SubmissionPosition";
import type { WaveCompetitionPreviewTab } from "./WaveCompetitionBadges";

interface WaveCompetitionEntriesProps {
  readonly authorId: string;
  readonly wave: ApiWaveMin;
  readonly kind: WaveCompetitionPreviewTab;
  readonly isOpen: boolean;
  readonly isApp: boolean;
  readonly onDropClick: (drop: ApiDrop) => void;
}

const getEntryText = (drop: ApiDrop): string =>
  drop.parts
    .map((part) => part.content?.trim() ?? "")
    .find((content) => content.length > 0) ?? "";

const getEntryTitle = (drop: ApiDrop, untitledLabel: string): string => {
  const title = drop.title?.trim();
  if (title) {
    return title;
  }

  const content = getEntryText(drop);
  return content ? content.slice(0, 80) : untitledLabel;
};

const getFirstMedia = (drop: ApiDrop) => {
  for (const part of drop.parts) {
    const [media] = part.media;
    if (media) {
      return media;
    }
  }

  return null;
};

const LoadingState = () => {
  const locale = useBrowserLocale();

  return (
    <output className="tw-flex tw-h-72 tw-items-center tw-justify-center">
      <span className="tw-flex tw-flex-col tw-items-center tw-gap-4">
        <span className="tw-size-8 tw-animate-spin tw-rounded-full tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-400 motion-reduce:tw-animate-none" />
        <span className="tw-text-sm tw-text-iron-400">
          {t(locale, "waves.competitionBadges.loading")}
        </span>
      </span>
    </output>
  );
};

export const WaveCompetitionEntries = ({
  authorId,
  wave,
  kind,
  isOpen,
  isApp,
  onDropClick,
}: WaveCompetitionEntriesProps) => {
  const locale = useBrowserLocale();
  const queryClient = useQueryClient();
  const {
    entries,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useWaveCompetitionEntries({ authorId, wave, kind, enabled: isOpen });
  const untitledLabel = t(locale, "waves.competitionBadges.untitled");

  const handleVoteSuccess = useCallback(() => {
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: [QueryKey.DROP] }),
      queryClient.invalidateQueries({
        queryKey: getWaveCompetitionEntriesQueryKey({
          authorId,
          waveId: wave.id,
          kind,
        }),
      }),
    ]);
  }, [authorId, kind, queryClient, wave.id]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return (
      <div className="tw-flex tw-h-72 tw-flex-col tw-items-center tw-justify-center tw-gap-4 tw-p-6 tw-text-center">
        <p className="tw-m-0 tw-text-sm tw-text-iron-300" role="alert">
          {t(locale, "waves.competitionBadges.error")}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/60 desktop-hover:hover:tw-bg-iron-800"
        >
          {t(locale, "waves.competitionBadges.retry")}
        </button>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="tw-flex tw-h-72 tw-items-center tw-justify-center tw-p-6 tw-text-center">
        <p className="tw-m-0 tw-text-sm tw-text-iron-400">
          {t(
            locale,
            kind === "active"
              ? "waves.competitionBadges.emptyActive"
              : "waves.competitionBadges.emptyWinners"
          )}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`tw-relative tw-z-[100] tw-p-6 ${
        isApp
          ? ""
          : "tw-max-h-[calc(75vh-120px)] tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300 sm:tw-max-h-[calc(90vh-160px)]"
      }`}
    >
      <div className="tw-grid tw-grid-cols-1 tw-gap-6 sm:tw-grid-cols-2 lg:tw-grid-cols-3">
        {entries.map((drop) => {
          const media = getFirstMedia(drop);
          const entryText = getEntryText(drop);
          const title = getEntryTitle(drop, untitledLabel);
          const now = Time.currentMillis();
          const votingHasStarted =
            drop.wave.voting_period_start == null ||
            now >= drop.wave.voting_period_start;
          const votingHasNotEnded =
            drop.wave.voting_period_end == null ||
            now <= drop.wave.voting_period_end;
          const showVote =
            drop.drop_type === ApiDropType.Participatory &&
            votingHasStarted &&
            votingHasNotEnded;

          return (
            <div key={drop.id} className="tw-flex tw-h-full tw-flex-col">
              <button
                type="button"
                aria-label={t(locale, "waves.competitionBadges.openEntry", {
                  title,
                })}
                onClick={() => onDropClick(drop)}
                className="tw-group tw-relative tw-mb-3 tw-flex tw-flex-1 tw-cursor-pointer tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950/50 tw-p-0 tw-text-left tw-shadow-lg tw-transition-all tw-duration-300 tw-ease-out focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/60 desktop-hover:hover:tw-border-iron-700 desktop-hover:hover:tw-shadow-xl"
              >
                <div className="tw-relative tw-aspect-square tw-overflow-hidden tw-bg-iron-950/50">
                  {media ? (
                    <div className="tw-flex tw-size-full tw-items-center tw-justify-center">
                      <MediaDisplay
                        media_url={media.url}
                        media_mime_type={media.mime_type}
                        disableMediaInteraction={true}
                      />
                    </div>
                  ) : (
                    <div className="tw-flex tw-size-full tw-flex-col tw-items-center tw-justify-center tw-gap-4 tw-bg-gradient-to-br tw-from-violet-950/50 tw-to-iron-950 tw-p-6 tw-text-center">
                      <span className="tw-flex tw-size-12 tw-items-center tw-justify-center tw-rounded-full tw-bg-violet-500/10 tw-text-violet-300 tw-ring-1 tw-ring-violet-400/20">
                        <FlagIcon className="tw-size-6" aria-hidden="true" />
                      </span>
                      {entryText && (
                        <p
                          dir="auto"
                          className="tw-m-0 tw-line-clamp-5 tw-text-sm tw-leading-relaxed tw-text-iron-300"
                        >
                          {entryText}
                        </p>
                      )}
                    </div>
                  )}
                  {drop.drop_type === ApiDropType.Winner && (
                    <span className="tw-absolute tw-left-3 tw-top-3 tw-rounded-full tw-bg-emerald-500/90 tw-px-2.5 tw-py-1 tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-wide tw-text-emerald-950 tw-shadow-lg">
                      {t(locale, "waves.competitionBadges.winner")}
                    </span>
                  )}
                </div>

                <div className="tw-flex tw-flex-1 tw-flex-col tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-bg-iron-950/50 tw-p-3">
                  <div className="tw-mb-3 tw-flex tw-items-start tw-justify-between tw-gap-2">
                    <p
                      dir="auto"
                      className="tw-m-0 tw-line-clamp-2 tw-min-w-0 tw-flex-1 tw-text-sm tw-font-bold tw-leading-tight tw-text-iron-100"
                    >
                      {title}
                    </p>
                    <SubmissionPosition drop={drop} />
                  </div>

                  <div className="tw-mb-3 tw-flex tw-items-center tw-gap-1.5 tw-text-sm">
                    <span className="tw-font-mono tw-font-medium tw-text-iron-300">
                      {t(locale, "waves.competitionBadges.rating", {
                        rating: formatInteger(locale, drop.rating),
                      })}
                    </span>
                    <DropVoteProgressing
                      current={drop.rating}
                      projected={drop.rating_prediction}
                      subtle={true}
                    />
                  </div>

                  <div className="tw-mt-auto tw-flex tw-items-center tw-gap-2 tw-text-xs tw-text-iron-500">
                    <CalendarDaysIcon className="tw-size-4 tw-flex-shrink-0" />
                    <span>{formatDate(locale, drop.created_at)}</span>
                  </div>
                </div>
              </button>

              {showVote && (
                <SingleWaveDropVote
                  drop={drop}
                  size={SingleWaveDropVoteSize.MINI}
                  onVoteSuccess={handleVoteSuccess}
                />
              )}
            </div>
          );
        })}
      </div>
      {hasNextPage && (
        <div className="tw-mt-6 tw-flex tw-justify-center">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold tw-text-iron-100 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/60 disabled:tw-cursor-wait disabled:tw-opacity-60 desktop-hover:hover:tw-bg-iron-800"
          >
            {t(
              locale,
              isFetchingNextPage
                ? "waves.competitionBadges.loadingMore"
                : "waves.competitionBadges.loadMore"
            )}
          </button>
        </div>
      )}
    </div>
  );
};
