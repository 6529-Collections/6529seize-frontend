"use client";

import { useId } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { TrophyIcon } from "@heroicons/react/24/outline";
import { useCompetition } from "@/contexts/CompetitionContext";
import {
  useCompetitionResource,
  useCompetitionViewer,
} from "@/hooks/competitions/useCompetitionQueries";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import {
  competitionScope,
  fetchCompetitionDistribution,
} from "@/services/api/competitions-api";
import type { ApiCompetitionOutcome } from "@/generated/models/ApiCompetitionOutcome";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { formatOutcomePositions } from "@/helpers/competition-outcomes.helpers";
import { CompetitionState } from "./CompetitionState";
import { CompetitionLoadMore } from "./CompetitionLoadMore";

function Outcome({ outcome }: { readonly outcome: ApiCompetitionOutcome }) {
  const { competition } = useCompetition();
  const viewer = useCompetitionViewer();
  const locale = useBrowserLocale();
  const identity = {
    waveId: competition.wave_id,
    competitionId: competition.id,
  };
  const query = useInfiniteQuery({
    queryKey: [
      QueryKey.COMPETITION_RESOURCE,
      { ...competitionScope(identity), viewer },
      "distribution",
      outcome.id,
    ],
    queryFn: ({ pageParam, signal }) =>
      fetchCompetitionDistribution(identity, outcome.id, pageParam, signal),
    initialPageParam: null as string | null,
    getNextPageParam: (page) => (page.has_more ? page.next_cursor : undefined),
  });
  const isCredit = outcome.credit === "REP" || outcome.credit === "CIC";
  const credit = outcome.credit === "CIC" ? "NIC" : "Rep";
  const category = outcome.rep_category ? ` · ${outcome.rep_category}` : "";
  const items = query.data?.pages.flatMap((page) => page.data) ?? [];
  const groups = new Map<string, number[]>();
  for (const item of items) {
    if (!isCredit && item.amount === 0) continue;
    let description = outcome.description.trim();
    const itemDescription = item.description?.trim();
    if (isCredit)
      description = `${formatInteger(locale, item.amount ?? 0)} ${credit}${category}`;
    else if (itemDescription) description = itemDescription;
    if (!description) continue;
    const positions = groups.get(description) ?? [];
    positions.push(item.position);
    groups.set(description, positions);
  }
  const description = outcome.description.trim();
  return (
    <div className="tw-space-y-2 tw-py-3">
      {description && !groups.has(description) && (
        <p className="tw-m-0 tw-whitespace-pre-wrap tw-break-words tw-text-iron-100">
          {description}
        </p>
      )}
      {!query.isPending && !query.isError && !items.length && isCredit && (
        <p className="tw-m-0 tw-text-iron-100">
          {formatInteger(locale, outcome.amount ?? 0)} {credit}
          {category}
        </p>
      )}
      {Array.from(groups, ([text, positions]) => (
        <div key={text} className="tw-space-y-1">
          <p className="tw-m-0 tw-whitespace-pre-wrap tw-break-words tw-text-iron-100">
            {text}
          </p>
          <p className="tw-m-0 tw-text-iron-400">
            {t(locale, "competitions.outcomes.positions", {
              positions: formatOutcomePositions(positions, locale),
            })}
          </p>
        </div>
      ))}
      {query.isPending && <CompetitionState padded={false} />}
      {query.isError && (
        <CompetitionState
          error
          padded={false}
          retry={() => void query.refetch()}
        />
      )}
      <CompetitionLoadMore
        query={query}
        label={t(locale, "competitions.outcomes.morePositions")}
      />
    </div>
  );
}

export default function CompetitionOutcomes() {
  const { competition } = useCompetition();
  const locale = useBrowserLocale();
  const headingId = useId();
  const query = useCompetitionResource(
    { waveId: competition.wave_id, competitionId: competition.id },
    "outcomes"
  );
  const outcomes = query.data?.pages.flatMap((page) => page.data) ?? [];
  if (!query.isPending && !query.isError && !outcomes.length) return null;
  return (
    <section
      aria-labelledby={headingId}
      className="tw-min-w-0 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950"
    >
      <div className="tw-flex tw-items-center tw-gap-2.5 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3.5 sm:tw-px-5">
        <TrophyIcon className="tw-size-4 tw-text-iron-400" aria-hidden="true" />
        <h2
          id={headingId}
          className="tw-m-0 tw-text-sm tw-font-semibold tw-text-iron-100"
        >
          {t(locale, "competitions.outcomes")}
        </h2>
      </div>
      <div className="tw-divide-x-0 tw-divide-y tw-divide-solid tw-divide-iron-800/60 tw-px-4 tw-py-1 tw-text-xs tw-leading-5 sm:tw-px-5">
        {query.isPending && <CompetitionState padded={false} />}
        {query.isError && (
          <CompetitionState
            error
            padded={false}
            retry={() => void query.refetch()}
          />
        )}
        {outcomes.map((outcome) => (
          <Outcome key={outcome.id} outcome={outcome} />
        ))}
        <CompetitionLoadMore
          query={query}
          label={t(locale, "competitions.outcomes.moreOutcomes")}
        />
      </div>
    </section>
  );
}
