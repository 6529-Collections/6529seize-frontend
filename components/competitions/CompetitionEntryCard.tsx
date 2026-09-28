"use client";
import { ApiCompetitionEntryStatus } from "@/generated/models/ApiCompetitionEntryStatus";
import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { ApiCompetitionEntry } from "@/generated/models/ApiCompetitionEntry";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import { commonApiFetch } from "@/services/api/common-api";
import {
  competitionEndpoint,
  competitionScope,
} from "@/services/api/competitions-api";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { useCompetitionViewer } from "@/hooks/competitions/useCompetitionQueries";
import CompetitionEntryContent from "./CompetitionEntryContent";
import { useCompetition } from "@/contexts/CompetitionContext";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { formatInteger } from "@/i18n/format";
import { getCompetitionRoute } from "@/helpers/competition.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import CompetitionVote from "./CompetitionVote";
import { COMPETITION_BUTTON } from "./CompetitionState";
import CompetitionEntryModeration from "./CompetitionEntryModeration";

export default function CompetitionEntryCard({
  entryId,
  dropId,
  entry,
  rating,
  rank,
  selected,
  disabled = false,
}: {
  readonly entryId: string;
  readonly dropId: string;
  readonly entry?: ApiCompetitionEntry;
  readonly rating?: number;
  readonly rank?: number | null;
  readonly selected?: boolean;
  readonly disabled?: boolean;
}) {
  const { competition } = useCompetition();
  const locale = useBrowserLocale();
  const viewer = useCompetitionViewer();
  const identity = {
    waveId: competition.wave_id,
    competitionId: competition.id,
  };
  const [showVote, setShowVote] = useState(false);
  const content = useQuery({
    queryKey: [
      QueryKey.COMPETITION_RESOURCE,
      { ...competitionScope(identity), viewer },
      "content",
      entryId,
    ],
    queryFn: ({ signal }) =>
      commonApiFetch<ApiCreateDropRequest>({
        endpoint: `${competitionEndpoint(identity)}/entries/${encodeURIComponent(entryId)}/content`,
        signal,
        errorMode: "structured",
      }),
    staleTime: 30_000,
    retry: false,
  });
  const entryTerminal =
    entry && entry.status !== ApiCompetitionEntryStatus.Active;
  return (
    <article
      id={`entry-${entryId}`}
      className="tw-min-w-0 tw-space-y-4 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-4"
      data-competition-entry={entryId}
    >
      <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-2">
        <h3 className="tw-m-0 tw-break-words tw-text-base tw-font-semibold tw-text-iron-100">
          {content.data?.title ?? entry?.submitter.handle ?? "…"}
        </h3>
        {rank !== null && rank !== undefined && (
          <span className="tw-text-sm tw-text-iron-300">
            {t(locale, "competitions.position", {
              rank: formatInteger(locale, rank),
            })}
          </span>
        )}
      </div>
      {entry && (
        <p className="tw-text-xs tw-text-iron-400">
          {t(locale, "competitions.status", {
            status: t(locale, `competitions.entryStatus.${entry.status}`),
          })}
        </p>
      )}
      {content.data ? (
        <CompetitionEntryContent content={content.data} dropId={dropId} />
      ) : (
        <p role="status" className="tw-text-sm tw-text-iron-400">
          {t(
            locale,
            content.isPending
              ? "competitions.loading"
              : "competitions.unavailableDrop"
          )}
        </p>
      )}
      {entry?.meme_card_id !== null && entry?.meme_card_id !== undefined && (
        <Link
          className={COMPETITION_BUTTON}
          href={`/the-memes/${entry.meme_card_id}`}
        >
          {t(locale, "competitions.viewMeme", {
            number: formatInteger(locale, entry.meme_card_id),
          })}
        </Link>
      )}
      {rating !== undefined && (
        <p className="tw-text-sm tw-text-iron-200">
          {t(locale, "competitions.total", {
            value: formatInteger(locale, rating),
          })}
        </p>
      )}
      <div className="tw-flex tw-flex-wrap tw-gap-2">
        <Link
          className={COMPETITION_BUTTON}
          href={`${getCompetitionRoute(competition.wave_id, competition.id)}?entry=${encodeURIComponent(entryId)}`}
        >
          {t(locale, "competitions.openEntry")}
        </Link>
        <Link
          className={COMPETITION_BUTTON}
          href={getWaveRoute({
            waveId: competition.wave_id,
            extraParams: { drop: dropId },
            isDirectMessage: false,
            isApp: false,
          })}
        >
          {t(locale, "competitions.viewDrop")}
        </Link>
        <button
          type="button"
          className={COMPETITION_BUTTON}
          aria-expanded={(selected ?? false) || showVote}
          onClick={() => setShowVote((value) => !value)}
        >
          {t(locale, "competitions.voteValue")}
        </button>
      </div>
      {((selected ?? false) || showVote) && (
        <CompetitionVote
          key={entryId}
          entryId={entryId}
          dropId={dropId}
          disabled={disabled || Boolean(entryTerminal)}
        />
      )}
      {entry && <CompetitionEntryModeration entry={entry} />}
    </article>
  );
}
