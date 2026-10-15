"use client";
import {
  COMPACT_ACTION_BUTTON_CLASS,
  COMPACT_ACTION_CONTENT_CLASS,
} from "@/components/utils/button/compactActionButtonStyles";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  ClockIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { TabToggleWithOverflow } from "@/components/common/TabToggleWithOverflow";
import MobileTabsScrollControls from "@/components/brain/my-stream/MobileTabsScrollControls";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import useIsMobileLayoutViewport from "@/hooks/useIsMobileLayoutViewport";
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
        <div className="tw-flex-1 tw-px-5 tw-pb-3 tw-pt-4">
          <div className="tw-mb-3 tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2">
            <span className="tw-inline-flex tw-items-center tw-rounded-full tw-px-2.5 tw-py-1 tw-text-xs tw-font-medium tw-text-iron-400 tw-ring-1 tw-ring-inset tw-ring-iron-700">
              {t(locale, `competitions.type.${competition.type}`)}
            </span>
            <CompetitionPhaseBadge phase={competition.computed_phase} />
          </div>
          <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
            <h2 className="tw-m-0 tw-min-w-0 tw-break-words tw-text-lg tw-font-semibold tw-leading-6 tw-tracking-tight tw-text-iron-50">
              {competition.title}
            </h2>
            <ArrowRightIcon
              className="tw-size-4 tw-shrink-0 tw-text-iron-500 tw-transition group-hover:tw-translate-x-0.5 group-hover:tw-text-primary-300 group-focus-visible:tw-text-primary-300 motion-reduce:tw-transition-none"
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
          <div className="tw-flex tw-flex-col tw-gap-1.5 tw-px-5 tw-pb-4">
            {competition.participation.starts_at !== null && (
              <p className="tw-m-0 tw-flex tw-items-start tw-gap-2 tw-text-xs tw-tabular-nums tw-leading-5 tw-text-iron-400">
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
              <p className="tw-m-0 tw-flex tw-items-start tw-gap-2 tw-text-xs tw-tabular-nums tw-leading-5 tw-text-iron-300">
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
  const isMobileViewport = useIsMobileLayoutViewport();
  const canCreateCompetition =
    isMultiCompetitionEnabled() && hub.permissions.create_competition;
  const createClassName = `${COMPACT_ACTION_BUTTON_CLASS} tw-no-underline hover:tw-no-underline ${isApp || isMobileViewport ? "tw-min-h-11" : "tw-h-8"}`;
  const createContent = (
    <span className={COMPACT_ACTION_CONTENT_CLASS}>
      <PlusIcon className="-tw-ml-1 tw-size-4 tw-shrink-0" aria-hidden="true" />
      <span>{t(locale, "competitions.createAction")}</span>
    </span>
  );
  const filtersScrollerRef = useRef<HTMLDivElement | null>(null);
  const [filter, setFilter] = useState<CompetitionCollectionFilter>("active");
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const scroller = filtersScrollerRef.current;
      if (!scroller) return;
      const selected =
        scroller.querySelector<HTMLButtonElement>(
          '[role="tab"][aria-selected="true"]'
        ) ??
        scroller.querySelector<HTMLButtonElement>(
          'button[aria-haspopup="menu"]'
        );
      if (!selected) return;
      selected.scrollIntoView({
        block: "nearest",
        inline: "nearest",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [filter, isApp]);

  const query = useCompetitionList(hub.id, filter);
  const visible = query.data?.pages.flatMap((page) => page.data) ?? [];
  let results = <CompetitionState padded={false} />;
  if (query.isError)
    results = (
      <CompetitionState
        error
        padded={false}
        retry={() => {
          void query.refetch();
        }}
      />
    );
  else if (query.data)
    results = visible.length ? (
      <ul className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-4 tw-p-0 md:tw-grid-cols-2">
        {visible.map((competition) => (
          <CompetitionCard key={competition.id} competition={competition} />
        ))}
      </ul>
    ) : (
      <output className="tw-block tw-text-sm tw-text-iron-400">
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
      <div className="tw-flex tw-shrink-0 tw-items-center tw-gap-3 tw-bg-iron-950 tw-px-4 tw-py-1.5 md:tw-px-6">
        <div className="tw-relative tw-min-w-0 tw-flex-1">
          <div
            ref={filtersScrollerRef}
            data-competition-filters-scroll
            className={`tw-scroll-px-10 tw-overflow-x-auto ${isApp ? "tw-no-scrollbar tw-overscroll-x-contain" : "tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500"}`}
          >
            <TabToggleWithOverflow
              variant="compactPills"
              maxVisibleTabs={isApp ? 1 : tabOptions.length}
              options={tabOptions}
              activeKey={filter}
              onSelect={selectFilter}
            />
          </div>
          <MobileTabsScrollControls
            scrollerRef={filtersScrollerRef}
            showButtons={false}
          />
        </div>
        {canCreateCompetition && (
          <Link
            href={getCompetitionRoute(hub.id, "new")}
            className={createClassName}
          >
            {createContent}
          </Link>
        )}
      </div>
      <div
        id={panelId}
        role="tabpanel"
        aria-label={t(locale, `competitions.${filter}`)}
        className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-p-4 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-white/10 hover:tw-scrollbar-thumb-white/15 sm:tw-px-6"
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
