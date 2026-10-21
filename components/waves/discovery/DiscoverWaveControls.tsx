"use client";

import {
  ACTION_LABEL_CLASSES,
  MOBILE_ACTION_ICON_CLASSES,
  MOBILE_ACTION_ITEM_CLASSES,
} from "@/components/compact-menu/constants";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";
import Button from "@/components/utils/button/Button";
import ButtonLink from "@/components/utils/button/ButtonLink";
import CommonTabs from "@/components/utils/select/tabs/CommonTabs";
import BodyPortalTooltip from "@/components/utils/tooltip/BodyPortalTooltip";
import { ApiWaveScoreSort } from "@/generated/models/ApiWaveScoreSort";
import { buildTooltipId, TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import {
  ArrowsUpDownIcon,
  CalculatorIcon,
  CalendarDaysIcon,
  CheckIcon,
  ChevronDownIcon,
  ClockIcon,
  FireIcon,
  ScaleIcon,
  ShieldCheckIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import { useId, useState, type KeyboardEvent } from "react";

export type DiscoverScoreFilter = "ALL" | "SCORE_50" | "HOT_60" | "REP_60";
export type DiscoverSort = ApiWaveScoreSort | "NEWEST" | "LATEST_POSTS";

export const SORT_OPTIONS = [
  { value: ApiWaveScoreSort.Balanced, label: "waves.discovery.sort.balanced" },
  { value: ApiWaveScoreSort.Quality, label: "waves.discovery.sort.quality" },
  { value: ApiWaveScoreSort.Hotness, label: "waves.discovery.sort.hot" },
  { value: ApiWaveScoreSort.Rep, label: "waves.discovery.sort.rep" },
  { value: "NEWEST", label: "waves.discovery.sort.newest" },
  { value: "LATEST_POSTS", label: "waves.discovery.sort.latestPosts" },
] as const;

const FILTER_OPTIONS = [
  { value: "ALL", label: "waves.discovery.filter.all" },
  { value: "SCORE_50", label: "waves.discovery.filter.score" },
  { value: "HOT_60", label: "waves.discovery.filter.hot" },
  { value: "REP_60", label: "waves.discovery.filter.rep" },
] as const;

function onRadioKeyDown<T extends string>(
  event: KeyboardEvent<HTMLButtonElement>,
  options: readonly { readonly value: T }[],
  activeValue: T,
  onChange: (value: T) => void
) {
  const currentIndex = options.findIndex(({ value }) => value === activeValue);
  let nextIndex: number;
  switch (event.key) {
    case "ArrowRight":
    case "ArrowDown":
      nextIndex = (currentIndex + 1) % options.length;
      break;
    case "ArrowLeft":
    case "ArrowUp":
      nextIndex = (currentIndex - 1 + options.length) % options.length;
      break;
    case "Home":
      nextIndex = 0;
      break;
    case "End":
      nextIndex = options.length - 1;
      break;
    default:
      return;
  }
  event.preventDefault();
  const nextValue = options[nextIndex]?.value;
  if (!nextValue) return;
  const radioGroup = event.currentTarget.parentElement;
  onChange(nextValue);
  requestAnimationFrame(() => {
    const nextRadio = radioGroup?.querySelector<HTMLElement>(
      `[data-radio-value="${nextValue}"]`
    );
    nextRadio?.focus();
    nextRadio?.scrollIntoView({ block: "nearest", inline: "nearest" });
  });
}

function ScoreSortIcon({
  sort,
  className = "tw-size-4 tw-shrink-0",
}: {
  readonly sort: DiscoverSort;
  readonly className?: string;
}) {
  const icons = {
    [ApiWaveScoreSort.Balanced]: Squares2X2Icon,
    [ApiWaveScoreSort.Quality]: ShieldCheckIcon,
    [ApiWaveScoreSort.Hotness]: FireIcon,
    [ApiWaveScoreSort.Rep]: ScaleIcon,
    NEWEST: CalendarDaysIcon,
    LATEST_POSTS: ClockIcon,
  };
  const Icon = icons[sort];
  return <Icon className={className} aria-hidden="true" />;
}

export function ScoreFormulaLink({ returnTo }: { readonly returnTo: string }) {
  const locale = useBrowserLocale();
  const label = t(locale, "waves.discovery.scoreFormula");
  const tooltipId = buildTooltipId("discover-score-formula", useId());
  return (
    <>
      <ButtonLink
        href={{ pathname: "/network/wave-score", query: { returnTo } }}
        variant="secondary"
        size={null}
        aria-label={label}
        data-tooltip-id={tooltipId}
        data-tooltip-content={label}
        className="tw-size-9 tw-text-xs @[36rem]/discovery-heading:tw-w-auto @[36rem]/discovery-heading:tw-px-3 motion-reduce:tw-transition-none"
      >
        <CalculatorIcon className="tw-size-4 tw-shrink-0" aria-hidden="true" />
        <span className="tw-hidden @[36rem]/discovery-heading:tw-inline">
          {label}
        </span>
      </ButtonLink>
      <BodyPortalTooltip
        id={tooltipId}
        place="bottom"
        offset={8}
        opacity={1}
        style={TOOLTIP_STYLES}
        closeEvents={{ mouseleave: true, blur: true, click: true }}
        globalCloseEvents={{
          escape: true,
          clickOutsideAnchor: true,
          scroll: true,
        }}
      />
    </>
  );
}

export function DiscoverWaveControls({
  activeFilter,
  activeSort,
  scoreFiltersEnabled,
  onFilterChange,
  onSortChange,
}: {
  readonly activeFilter: DiscoverScoreFilter;
  readonly activeSort: DiscoverSort;
  readonly scoreFiltersEnabled: boolean;
  readonly onFilterChange: (filter: DiscoverScoreFilter) => void;
  readonly onSortChange: (sort: DiscoverSort) => void;
}) {
  const locale = useBrowserLocale();
  const [sortOpen, setSortOpen] = useState(false);
  const sortLabel = t(locale, "waves.discovery.sort.label");
  const currentLabel = t(
    locale,
    SORT_OPTIONS.find(({ value }) => value === activeSort)?.label ??
      "waves.discovery.sort.balanced"
  );

  return (
    <fieldset className="tw-m-0 tw-w-full tw-min-w-0 tw-border-0 tw-p-0 tw-@container/discovery-controls">
      <legend className="tw-sr-only">
        {t(locale, "waves.discovery.controls")}
      </legend>
      <div className="tw-flex tw-items-center tw-gap-2 tw-overflow-x-auto tw-p-1 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700 @[56rem]/discovery-controls:tw-justify-between">
        <Button
          variant="tertiary"
          size="sm"
          aria-label={t(locale, "waves.discovery.sort.open", {
            sort: currentLabel,
          })}
          aria-haspopup="dialog"
          aria-expanded={sortOpen}
          onClick={() => setSortOpen(true)}
          className="@[56rem]/discovery-controls:tw-hidden motion-reduce:tw-transition-none"
        >
          <ArrowsUpDownIcon className="tw-size-4" aria-hidden="true" />
          {currentLabel}
          <ChevronDownIcon className="tw-size-3" aria-hidden="true" />
        </Button>
        <div className="tw-hidden tw-shrink-0 @[56rem]/discovery-controls:tw-block">
          <CommonTabs<DiscoverSort>
            items={SORT_OPTIONS.map((option) => ({
              key: option.value,
              value: option.value,
              label: t(locale, option.label),
              icon: <ScoreSortIcon sort={option.value} />,
            }))}
            activeItem={activeSort}
            filterLabel={sortLabel}
            setSelected={onSortChange}
            size="sm"
            fill={false}
          />
        </div>
        <span
          aria-hidden="true"
          className="tw-mx-1 tw-h-5 tw-w-px tw-shrink-0 tw-bg-iron-800 @[56rem]/discovery-controls:tw-hidden"
        />
        <div
          role="radiogroup"
          aria-label={t(locale, "waves.discovery.filter.label")}
          aria-disabled={!scoreFiltersEnabled}
          className="tw-flex tw-shrink-0 tw-items-center tw-gap-1.5"
        >
          {FILTER_OPTIONS.map((option) => {
            const selected = activeFilter === option.value;
            return (
              <Button
                key={option.value}
                variant={
                  selected && scoreFiltersEnabled ? "primary" : "tertiary"
                }
                size="xs"
                role="radio"
                aria-checked={selected}
                disabled={!scoreFiltersEnabled}
                tabIndex={scoreFiltersEnabled && selected ? 0 : -1}
                data-radio-value={option.value}
                onClick={() => onFilterChange(option.value)}
                onKeyDown={(event) =>
                  onRadioKeyDown(
                    event,
                    FILTER_OPTIONS,
                    activeFilter,
                    onFilterChange
                  )
                }
                className="tw-scroll-mx-1 motion-reduce:tw-transition-none"
              >
                {t(locale, option.label)}
              </Button>
            );
          })}
        </div>
      </div>
      <MobileWrapperDialog
        isOpen={sortOpen}
        onClose={() => setSortOpen(false)}
        title={sortLabel}
        titleClassName="tw-text-lg tw-font-semibold"
        focusTitleOnOpen
      >
        <div className="tw-space-y-1 tw-px-4 tw-pt-4 sm:tw-px-6">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={activeSort === option.value}
              onClick={() => {
                onSortChange(option.value);
                setSortOpen(false);
              }}
              className={`${MOBILE_ACTION_ITEM_CLASSES} tw-min-h-12 tw-px-3 aria-pressed:tw-bg-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-400`}
            >
              <span className={`${MOBILE_ACTION_ICON_CLASSES} tw-self-center`}>
                <ScoreSortIcon sort={option.value} className="tw-size-5" />
              </span>
              <span
                className={`${ACTION_LABEL_CLASSES} tw-min-w-0 tw-flex-1 tw-self-center`}
              >
                {t(locale, option.label)}
              </span>
              {activeSort === option.value && (
                <CheckIcon
                  className="tw-size-5 tw-shrink-0 tw-self-center"
                  aria-hidden="true"
                />
              )}
            </button>
          ))}
        </div>
      </MobileWrapperDialog>
    </fieldset>
  );
}
