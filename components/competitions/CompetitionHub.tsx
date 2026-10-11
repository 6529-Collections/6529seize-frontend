"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { TabToggle } from "@/components/common/TabToggle";
import { TabToggleWithOverflow } from "@/components/common/TabToggleWithOverflow";
import useDeviceInfo from "@/hooks/useDeviceInfo";
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
import { Time } from "@/helpers/time";
import { CompetitionState, COMPETITION_BUTTON } from "./CompetitionState";
import CompetitionPhaseBadge from "./CompetitionPhaseBadge";

import type { CompetitionCollectionFilter } from "@/services/api/competitions-api";

function CompetitionCard({
  competition,
}: {
  readonly competition: ApiCompetition;
}) {
  const locale = useBrowserLocale();
  const now = Time.currentMillis();
  return (
    <li className="tw-min-w-0">
      <Link
        href={getCompetitionRoute(competition.wave_id, competition.id)}
        className="tw-group tw-flex tw-h-full tw-flex-col tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-text-iron-100 tw-no-underline tw-transition-colors hover:tw-border-iron-600 hover:tw-bg-iron-900/60 hover:tw-text-iron-100 hover:tw-no-underline focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 motion-reduce:tw-transition-none"
      >
        <div className="tw-flex-1 tw-p-5">
          <div className="tw-mb-4 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
            <span className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wider tw-text-iron-400">
              {t(locale, `competitions.type.${competition.type}`)}
            </span>
            <CompetitionPhaseBadge phase={competition.computed_phase} />
          </div>
          <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
            <h2 className="tw-m-0 tw-min-w-0 tw-break-words tw-text-xl tw-font-semibold tw-leading-7 tw-text-iron-50">
              {competition.title}
            </h2>
            <ArrowRightIcon
              className="tw-mt-1 tw-size-5 tw-shrink-0 tw-text-iron-500 group-hover:tw-text-primary-300 group-focus-visible:tw-text-primary-300"
              aria-hidden="true"
            />
          </div>
          {competition.description && (
            <p className="tw-mb-0 tw-mt-2 tw-line-clamp-2 tw-break-words tw-text-sm tw-leading-6 tw-text-iron-400">
              {competition.description}
            </p>
          )}
        </div>
        {(competition.participation.starts_at !== null ||
          competition.voting.ends_at !== null) && (
          <div className="tw-space-y-2 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800/70 tw-px-5 tw-py-3.5">
            {competition.participation.starts_at !== null && (
              <p className="tw-m-0 tw-flex tw-items-start tw-gap-2 tw-text-xs tw-leading-5 tw-text-iron-400">
                <CalendarDaysIcon
                  className="tw-mt-0.5 tw-size-4 tw-shrink-0 tw-text-iron-500"
                  aria-hidden="true"
                />
                <span>
                  {t(
                    locale,
                    competition.participation.starts_at <= now
                      ? "competitions.started"
                      : "competitions.starts",
                    {
                      date: formatDate(
                        locale,
                        competition.participation.starts_at,
                        {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }
                      ),
                    }
                  )}
                </span>
              </p>
            )}
            {competition.voting.ends_at !== null && (
              <p className="tw-m-0 tw-flex tw-items-start tw-gap-2 tw-text-xs tw-leading-5 tw-text-iron-300">
                <ClockIcon
                  className="tw-mt-0.5 tw-size-4 tw-shrink-0 tw-text-iron-500"
                  aria-hidden="true"
                />
                <span>
                  {t(
                    locale,
                    competition.voting.ends_at <= now
                      ? "competitions.ended"
                      : "competitions.ends",
                    {
                      date: formatDate(locale, competition.voting.ends_at, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }),
                    }
                  )}
                </span>
              </p>
            )}
          </div>
        )}
      </Link>
    </li>
  );
}
function CompetitionCollection({ hub }: { readonly hub: ApiWaveV3 }) {
  const locale = useBrowserLocale();
  const { isApp } = useDeviceInfo();
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
      <output className="tw-block tw-py-6 tw-text-iron-400">
        {t(locale, "competitions.empty")}
      </output>
    );
  const filters: CompetitionCollectionFilter[] = ["active", "history"];
  if (hub.permissions.administer) filters.push("drafts");
  filters.push("all");
  const panelId = `competition-collection-${hub.id}-${filter}`;
  const tabOptions = filters.map((value) => ({
    key: value,
    label: t(locale, `competitions.${value}`),
    panelId: `competition-collection-${hub.id}-${value}`,
  }));
  const selectFilter = (key: string) => {
    const selected = filters.find((value) => value === key);
    if (selected) setFilter(selected);
  };
  return (
    <>
      <div
        className={`tw-flex tw-shrink-0 tw-items-center tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-bg-iron-950 ${isApp ? "tw-border-white/5 tw-px-4 tw-py-2.5 md:tw-px-6" : "tw-border-iron-800 tw-px-2 sm:tw-px-4"}`}
      >
        <div
          className={`tw-min-w-0 tw-flex-1 tw-overflow-x-auto ${isApp ? "tw-no-scrollbar tw-overscroll-x-contain" : "tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500"}`}
        >
          {isApp ? (
            <TabToggleWithOverflow
              variant="compactPills"
              maxVisibleTabs={1}
              options={tabOptions}
              activeKey={filter}
              onSelect={selectFilter}
            />
          ) : (
            <TabToggle
              options={tabOptions}
              activeKey={filter}
              onSelect={selectFilter}
            />
          )}
        </div>
        {isMultiCompetitionEnabled() && hub.permissions.create_competition && (
          <Link
            href={getCompetitionRoute(hub.id, "new")}
            aria-label={t(locale, "competitions.add")}
            title={t(locale, "competitions.add")}
            className="tw-inline-flex tw-h-8 tw-shrink-0 tw-items-center tw-justify-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-2 tw-text-xs tw-font-medium tw-text-iron-200 tw-no-underline hover:tw-bg-iron-800 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
          >
            <PlusIcon className="tw-size-4 tw-shrink-0" aria-hidden="true" />
            <span className="tw-hidden sm:tw-inline">
              {t(locale, "competitions.add")}
            </span>
          </Link>
        )}
      </div>
      <div
        id={panelId}
        role="tabpanel"
        aria-label={t(locale, `competitions.${filter}`)}
        className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-p-4 sm:tw-p-6"
      >
        <div className="tw-mx-auto tw-max-w-5xl tw-space-y-5">
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
        </div>
      </div>
    </>
  );
}
export default function CompetitionHub({
  waveId,
  embedded = false,
}: {
  readonly waveId: string;
  readonly embedded?: boolean;
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
      className="tw-flex tw-h-full tw-min-h-0 tw-flex-col"
      aria-labelledby={embedded ? undefined : "competition-hub-heading"}
      aria-label={embedded ? t(locale, "competitions.title") : undefined}
    >
      {!embedded && (
        <div className="tw-flex tw-shrink-0 tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-p-4 sm:tw-p-6">
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
      )}
      {content}
    </section>
  );
}
