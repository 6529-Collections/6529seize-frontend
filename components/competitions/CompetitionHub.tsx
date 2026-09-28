"use client";
import Link from "next/link";
import { useState } from "react";
import type { ApiCompetition } from "@/generated/models/ApiCompetition";
import type { ApiWaveV3 } from "@/generated/models/ApiWaveV3";
import {
  useCompetitionHub,
  useCompetitionList,
} from "@/hooks/competitions/useCompetitionQueries";
import {
  getCompetitionRoute,
  isMultiCompetitionEnabled,
} from "@/helpers/competition.helpers";
import { getWavePathRoute } from "@/helpers/navigation.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { formatDate } from "@/i18n/format";
import { CompetitionState, COMPETITION_BUTTON } from "./CompetitionState";

import type { CompetitionCollectionFilter } from "@/services/api/competitions-api";
function CompetitionCard({
  competition,
}: {
  readonly competition: ApiCompetition;
}) {
  const locale = useBrowserLocale();
  return (
    <li className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950">
      <Link
        href={getCompetitionRoute(competition.wave_id, competition.id)}
        className="tw-block tw-space-y-3 tw-rounded-xl tw-p-5 tw-text-iron-100 hover:tw-bg-iron-900 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
      >
        <span className="tw-text-xs tw-text-iron-400">
          {t(locale, `competitions.type.${competition.type}`)} ·{" "}
          {t(locale, `competitions.phase.${competition.computed_phase}`)}
        </span>
        <h2 className="tw-m-0 tw-break-words tw-text-lg tw-font-semibold">
          {competition.title}
        </h2>
        {competition.description && (
          <p className="tw-line-clamp-3 tw-text-sm tw-text-iron-400">
            {competition.description}
          </p>
        )}
        {competition.participation.starts_at !== null && (
          <p className="tw-m-0 tw-text-xs tw-text-iron-400">
            {t(locale, "competitions.starts", {
              date: formatDate(locale, competition.participation.starts_at, {
                dateStyle: "medium",
                timeStyle: "short",
              }),
            })}
          </p>
        )}
      </Link>
    </li>
  );
}
function CompetitionCollection({ hub }: { readonly hub: ApiWaveV3 }) {
  const locale = useBrowserLocale();
  const [filter, setFilter] = useState<CompetitionCollectionFilter>("active");
  const query = useCompetitionList(hub.id, filter);
  const visible = query.data?.pages.flatMap((page) => page.data) ?? [];
  let results = <CompetitionState />;
  if (query.isError)
    results = (
      <CompetitionState
        error
        retry={() => {
          void query.refetch();
        }}
      />
    );
  else if (query.data)
    results = visible.length ? (
      <ul className="tw-grid tw-list-none tw-grid-cols-1 tw-gap-4 tw-p-0 md:tw-grid-cols-2">
        {visible.map((competition) => (
          <CompetitionCard key={competition.id} competition={competition} />
        ))}
      </ul>
    ) : (
      <p role="status" className="tw-py-6 tw-text-iron-400">
        {t(locale, "competitions.empty")}
      </p>
    );
  const filters: CompetitionCollectionFilter[] = ["active", "history"];
  if (hub.permissions.administer) filters.push("drafts");
  filters.push("all");
  return (
    <>
      {isMultiCompetitionEnabled() && hub.permissions.create_competition && (
        <Link
          href={getCompetitionRoute(hub.id, "new")}
          className={COMPETITION_BUTTON}
        >
          {t(locale, "competitions.new")}
        </Link>
      )}
      <div
        className="tw-flex tw-flex-wrap tw-gap-2"
        aria-label={t(locale, "competitions.title")}
      >
        {filters.map((value) => (
          <button
            key={value}
            type="button"
            className={COMPETITION_BUTTON}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {t(locale, `competitions.${value}`)}
          </button>
        ))}
      </div>
      {results}
      {query.hasNextPage && (
        <button
          type="button"
          className={COMPETITION_BUTTON}
          disabled={query.isFetchingNextPage}
          onClick={() => {
            void query.fetchNextPage();
          }}
        >
          {t(locale, "competitions.more")}
        </button>
      )}
    </>
  );
}
export default function CompetitionHub({
  waveId,
}: {
  readonly waveId: string;
}) {
  const locale = useBrowserLocale();
  const hub = useCompetitionHub(waveId);
  let content = <CompetitionState />;
  if (hub.isError)
    content = (
      <CompetitionState
        error
        retry={() => {
          void hub.refetch();
        }}
      />
    );
  else if (hub.data) content = <CompetitionCollection hub={hub.data} />;
  return (
    <section
      className="tw-h-full tw-min-h-0 tw-overflow-y-auto tw-p-4 sm:tw-p-6"
      aria-labelledby="competition-hub-heading"
    >
      <div className="tw-mx-auto tw-max-w-5xl tw-space-y-5">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
          <div>
            <p className="tw-mb-1 tw-text-sm tw-text-iron-400">
              {hub.data?.name}
            </p>
            <h1
              id="competition-hub-heading"
              className="tw-m-0 tw-text-xl tw-font-semibold tw-text-iron-50"
            >
              {t(locale, "competitions.title")}
            </h1>
          </div>
          <Link href={getWavePathRoute(waveId)} className={COMPETITION_BUTTON}>
            {t(locale, "competitions.chat")}
          </Link>
        </div>
        <p className="tw-text-sm tw-leading-6 tw-text-iron-400">
          {t(locale, "competitions.parallel")}
        </p>
        {content}
      </div>
    </section>
  );
}
