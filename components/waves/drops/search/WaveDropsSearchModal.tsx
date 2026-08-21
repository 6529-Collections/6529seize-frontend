"use client";

import { useLayoutViewportLock } from "@/components/brain/my-stream/layout/LayoutContext";
import ProfileAvatar, {
  ProfileBadgeSize,
} from "@/components/common/profile/ProfileAvatar";
import type { ApiWave } from "@/generated/models/ApiWave";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useWaveDropsSearch } from "@/hooks/useWaveDropsSearch";
import { formatDate, formatInteger, formatTime } from "@/i18n/format";
import type { SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { FocusTrap } from "focus-trap-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";
import Button from "@/components/utils/button/Button";
import type { WaveSearchAuthor } from "@/services/api/wave-drops-v2.types";
import WaveDropSearchResultPreview from "./WaveDropSearchResultPreview";
import WaveDropsSearchFilters from "./WaveDropsSearchFilters";
import {
  isValidWaveSearchDateRange,
  MIN_WAVE_SEARCH_QUERY_LENGTH,
  parseLocalDateStart,
} from "./waveDropsSearch.utils";

const MIN_QUERY_LENGTH = MIN_WAVE_SEARCH_QUERY_LENGTH;
const DIALOG_TITLE_ID = "wave-drops-search-title";
const DIALOG_DESCRIPTION_ID = "wave-drops-search-description";
const SEARCH_INPUT_DESCRIPTION_ID = "wave-drops-search-input-description";
const SEARCH_EMPTY_STATUS_ID = "wave-drops-search-empty-status";
const SEARCH_ERROR_STATUS_ID = "wave-drops-search-error-status";
const SEARCH_IDLE_STATUS_ID = "wave-drops-search-idle-status";
const SEARCH_LOADING_STATUS_ID = "wave-drops-search-loading-status";
const SEARCH_RESULTS_STATUS_ID = "wave-drops-search-results-status";

const normalize = (value: string) => value.trim();

const formatOptionalFilterDate = (
  locale: SupportedLocale,
  timestamp: number | undefined
): string =>
  timestamp === undefined
    ? ""
    : formatDate(locale, timestamp, {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

const getSearchCriteriaLabel = (
  locale: SupportedLocale,
  query: string
): string => {
  if (query) return query;
  return t(locale, "waves.drops.searchModal.results.filtersApplied");
};

function WaveDropsSearchState({
  description,
  id,
  title,
  variant,
}: {
  readonly description: string;
  readonly id: string;
  readonly title: string;
  readonly variant: "empty" | "error" | "idle" | "loading";
}) {
  let stateRole: "alert" | "status" | undefined;
  if (variant === "error") stateRole = "alert";
  else if (variant === "loading" || variant === "empty") stateRole = "status";
  const iconClasses = "tw-size-5 tw-flex-shrink-0";
  let icon: ReactNode;
  if (variant === "loading") {
    icon = (
      <span
        className="tw-size-4 tw-animate-spin tw-rounded-full tw-border-2 tw-border-solid tw-border-iron-500 tw-border-t-primary-300"
        aria-hidden="true"
      />
    );
  } else if (variant === "error") {
    icon = (
      <ExclamationTriangleIcon
        className={`${iconClasses} tw-text-error`}
        aria-hidden="true"
      />
    );
  } else if (variant === "empty") {
    icon = (
      <MagnifyingGlassIcon
        className={`${iconClasses} tw-text-iron-300`}
        aria-hidden="true"
      />
    );
  } else {
    icon = (
      <MagnifyingGlassIcon
        className={`${iconClasses} tw-text-primary-300`}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      id={id}
      role={stateRole}
      aria-live={
        variant === "loading" || variant === "empty" ? "polite" : undefined
      }
      className="tw-flex tw-min-h-[220px] tw-flex-col tw-items-center tw-justify-center tw-px-6 tw-py-10 tw-text-center"
    >
      <div className="tw-mb-4 tw-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-text-iron-200">
        {icon}
      </div>
      <p className="tw-text-sm tw-font-semibold tw-text-iron-100">{title}</p>
      <p className="tw-mt-1 tw-max-w-sm tw-text-sm tw-leading-6 tw-text-iron-400">
        {description}
      </p>
    </div>
  );
}

export default function WaveDropsSearchModal({
  isOpen,
  onClose,
  wave,
  onSelectSerialNo,
  onSearchAll,
}: {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly wave: ApiWave;
  readonly onSelectSerialNo: (serialNo: number) => void;
  readonly onSearchAll?: (() => void) | undefined;
}) {
  useLayoutViewportLock(isOpen);
  const modalRef = useRef<HTMLDivElement>(null);
  const locale = useBrowserLocale();
  const [filtersOpen, setFiltersOpen] = useState(false);
  useClickAway(modalRef, () => {
    if (!isOpen) return;
    if (filtersOpen) setFiltersOpen(false);
    else onClose();
  });
  useKeyPressEvent("Escape", () => {
    if (!isOpen) return;
    if (filtersOpen) setFiltersOpen(false);
    else onClose();
  });

  const [query, setQuery] = useState("");
  const [authorFilter, setAuthorFilter] = useState<WaveSearchAuthor | null>(
    null
  );
  const [authorQuery, setAuthorQuery] = useState("");
  const [afterDate, setAfterDate] = useState("");
  const [beforeDate, setBeforeDate] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useDebounce(() => setDebouncedQuery(query), 250, [query]);

  const normalizedQuery = useMemo(
    () => normalize(debouncedQuery),
    [debouncedQuery]
  );

  const liveNormalizedQuery = normalize(query);
  const isTextValid =
    liveNormalizedQuery.length === 0 ||
    liveNormalizedQuery.length >= MIN_QUERY_LENGTH;
  const hasFilters =
    Boolean(authorFilter) || afterDate.length > 0 || beforeDate.length > 0;
  const hasSearchCriterion = liveNormalizedQuery.length > 0 || hasFilters;
  const validDateRange = isValidWaveSearchDateRange(afterDate, beforeDate);
  const canSearch = isTextValid && hasSearchCriterion && validDateRange;
  const isQuerySettled = liveNormalizedQuery === normalizedQuery;
  const afterTimestamp = afterDate ? parseLocalDateStart(afterDate) : undefined;
  const beforeTimestamp = beforeDate
    ? parseLocalDateStart(beforeDate)
    : undefined;
  const formattedAfterDate = formatOptionalFilterDate(locale, afterTimestamp);
  const formattedBeforeDate = formatOptionalFilterDate(locale, beforeTimestamp);

  const {
    drops: results,
    isLoading,
    isFetching,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useWaveDropsSearch({
    wave,
    term: normalizedQuery,
    authorId: authorFilter?.id,
    after: afterTimestamp,
    before: beforeTimestamp,
    enabled: isOpen && canSearch && isQuerySettled,
    size: 50,
  });

  const formattedMinQueryLength = formatInteger(locale, MIN_QUERY_LENGTH);
  const visibleResults = isQuerySettled ? results : [];
  const isUpdating = canSearch && !isQuerySettled;
  const showLoading =
    isLoading || isUpdating || (isFetching && visibleResults.length === 0);
  const formattedResultCount = formatInteger(locale, visibleResults.length);
  const searchCriteriaLabel = getSearchCriteriaLabel(
    locale,
    liveNormalizedQuery
  );
  const activeFilterCount =
    Number(Boolean(authorFilter)) +
    Number(Boolean(afterDate)) +
    Number(Boolean(beforeDate));

  const inputRef = useRef<HTMLInputElement>(null);
  const filtersButtonRef = useRef<HTMLButtonElement>(null);
  const clearAuthorFilter = () => {
    setAuthorFilter(null);
    setAuthorQuery("");
  };
  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  const selectDropResult = (serialNo: number) => {
    onSelectSerialNo(serialNo);
    onClose();
  };

  return createPortal(
    <FocusTrap
      focusTrapOptions={{
        allowOutsideClick: true,
        fallbackFocus: () =>
          (modalRef.current as HTMLElement | null) ??
          (inputRef.current as HTMLElement | null) ??
          document.body,
        initialFocus: () =>
          (inputRef.current as HTMLElement | null) ??
          (modalRef.current as HTMLElement | null) ??
          document.body,
      }}
    >
      <div className="tailwind-scope tw-relative tw-z-1000 tw-cursor-default">
        <div className="tw-fixed tw-inset-0 tw-bg-gray-600 tw-bg-opacity-50 tw-backdrop-blur-[1px]" />
        <div className="tw-fixed tw-inset-0 tw-z-1000 tw-h-full tw-overflow-y-auto">
          <div className="tw-flex tw-h-full tw-min-h-full tw-items-start tw-justify-center tw-p-0 tw-text-center sm:tw-items-center sm:tw-p-5">
            <div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={DIALOG_TITLE_ID}
              aria-describedby={DIALOG_DESCRIPTION_ID}
              className="tw-mt-[env(safe-area-inset-top)] tw-flex tw-h-full tw-min-h-0 tw-w-full tw-max-w-[min(100vw,860px)] tw-transform tw-flex-col tw-overflow-hidden tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-text-left tw-shadow-[0_24px_70px_rgba(0,0,0,0.55)] tw-transition-all sm:tw-h-[min(720px,78vh)] sm:tw-rounded-xl"
            >
              <div className="tw-flex tw-items-start tw-gap-3 tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3 sm:tw-items-center sm:tw-px-5">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t(locale, "waves.drops.searchModal.close")}
                  className="-tw-ml-1 tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-lg tw-border-none tw-bg-transparent tw-text-iron-300 tw-transition tw-duration-150 hover:tw-bg-iron-900 hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70 sm:tw-hidden"
                >
                  <ChevronLeftIcon className="tw-size-6 tw-flex-shrink-0" />
                </button>

                <div className="tw-min-w-0 tw-flex-1">
                  <h2
                    id={DIALOG_TITLE_ID}
                    className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50"
                  >
                    {t(locale, "waves.drops.searchModal.title")}
                  </h2>
                  <p
                    id={DIALOG_DESCRIPTION_ID}
                    className="tw-m-0 tw-mt-0.5 tw-truncate tw-text-xs tw-leading-4"
                  >
                    <span className="tw-text-iron-600">
                      {t(locale, "waves.drops.searchModal.descriptionPrefix")}
                    </span>{" "}
                    <span className="tw-min-w-0 tw-truncate tw-text-iron-300">
                      {wave.name}
                    </span>
                  </p>
                </div>

                {onSearchAll && (
                  <Button onClick={onSearchAll} variant="tertiary" size="xs">
                    {t(locale, "waves.drops.searchModal.searchAll")}
                  </Button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  aria-label={t(locale, "waves.drops.searchModal.close")}
                  className="tw-hidden tw-size-9 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-300 tw-transition tw-duration-150 hover:tw-bg-iron-900 hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70 sm:tw-inline-flex"
                >
                  <XMarkIcon className="tw-size-5 tw-flex-shrink-0" />
                </button>
              </div>

              <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3 sm:tw-px-5">
                <div className="tw-flex tw-gap-2">
                  <div className="tw-relative tw-min-w-0 tw-flex-1">
                    <MagnifyingGlassIcon
                      className="tw-pointer-events-none tw-absolute tw-left-3.5 tw-top-1/2 tw-size-5 -tw-translate-y-1/2 tw-text-iron-400"
                      aria-hidden="true"
                    />
                    <label
                      className="tw-sr-only"
                      htmlFor="wave-drops-search-input"
                    >
                      {t(locale, "waves.drops.searchModal.inputLabel", {
                        waveName: wave.name,
                      })}
                    </label>
                    <input
                      id="wave-drops-search-input"
                      ref={inputRef}
                      type="text"
                      autoComplete="off"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      aria-describedby={SEARCH_INPUT_DESCRIPTION_ID}
                      className="sm:text-sm tw-form-input tw-block tw-h-11 tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-py-2.5 tw-pl-10 tw-pr-16 tw-text-base tw-font-normal tw-text-iron-50 tw-caret-primary-300 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-150 tw-ease-out placeholder:tw-text-iron-500 hover:tw-bg-iron-900 hover:tw-ring-iron-600 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-300/90"
                      placeholder={t(
                        locale,
                        "waves.drops.searchModal.placeholder"
                      )}
                    />
                    <p id={SEARCH_INPUT_DESCRIPTION_ID} className="tw-sr-only">
                      {t(locale, "waves.drops.searchModal.inputDescription", {
                        minLength: formattedMinQueryLength,
                        waveName: wave.name,
                      })}
                    </p>
                    {query.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setQuery("")}
                        aria-label={t(locale, "waves.drops.searchModal.clear")}
                        className="tw-absolute tw-right-2.5 tw-top-1/2 tw-flex tw-h-7 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-2.5 tw-text-xs tw-font-medium tw-text-iron-300 tw-transition tw-duration-150 hover:tw-border-iron-600 hover:tw-bg-iron-800 hover:tw-text-iron-100 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70"
                      >
                        {t(locale, "waves.drops.searchModal.clearShort")}
                      </button>
                    )}
                  </div>
                  <button
                    ref={filtersButtonRef}
                    type="button"
                    onClick={() => setFiltersOpen((open) => !open)}
                    aria-expanded={filtersOpen}
                    aria-controls="wave-drops-search-filters-title"
                    className="tw-flex tw-h-11 tw-flex-shrink-0 tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-text-sm tw-font-medium tw-text-iron-200 tw-transition hover:tw-border-iron-600 hover:tw-bg-iron-800 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70"
                  >
                    <FunnelIcon className="tw-size-4" aria-hidden="true" />
                    <span className="tw-hidden sm:tw-inline">
                      {t(locale, "waves.drops.searchModal.filters.open")}
                    </span>
                    {activeFilterCount > 0 && (
                      <span className="tw-text-primary-200 tw-flex tw-size-5 tw-items-center tw-justify-center tw-rounded-full tw-bg-primary-400/20 tw-text-xs">
                        {formatInteger(locale, activeFilterCount)}
                      </span>
                    )}
                  </button>
                </div>
                {hasFilters && (
                  <div className="tw-mt-2 tw-flex tw-flex-wrap tw-items-center tw-gap-1.5">
                    {authorFilter && (
                      <button
                        type="button"
                        onClick={clearAuthorFilter}
                        aria-label={t(
                          locale,
                          "waves.drops.searchModal.filters.removeAuthor",
                          { author: authorFilter.handle }
                        )}
                        className="tw-flex tw-items-center tw-gap-1 tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-2 tw-py-1 tw-text-xs tw-text-iron-200"
                      >
                        {t(locale, "waves.drops.searchModal.filters.from")}:{" "}
                        {authorFilter.handle}
                        <XMarkIcon className="tw-size-3.5" aria-hidden="true" />
                      </button>
                    )}
                    {afterDate && (
                      <button
                        type="button"
                        onClick={() => setAfterDate("")}
                        aria-label={t(
                          locale,
                          "waves.drops.searchModal.filters.removeAfter",
                          { date: formattedAfterDate }
                        )}
                        className="tw-flex tw-items-center tw-gap-1 tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-2 tw-py-1 tw-text-xs tw-text-iron-200"
                      >
                        {t(locale, "waves.drops.searchModal.filters.after")}:{" "}
                        {formattedAfterDate}
                        <XMarkIcon className="tw-size-3.5" aria-hidden="true" />
                      </button>
                    )}
                    {beforeDate && (
                      <button
                        type="button"
                        onClick={() => setBeforeDate("")}
                        aria-label={t(
                          locale,
                          "waves.drops.searchModal.filters.removeBefore",
                          { date: formattedBeforeDate }
                        )}
                        className="tw-flex tw-items-center tw-gap-1 tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-2 tw-py-1 tw-text-xs tw-text-iron-200"
                      >
                        {t(locale, "waves.drops.searchModal.filters.before")}:{" "}
                        {formattedBeforeDate}
                        <XMarkIcon className="tw-size-3.5" aria-hidden="true" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        clearAuthorFilter();
                        setAfterDate("");
                        setBeforeDate("");
                      }}
                      className="tw-border-0 tw-bg-transparent tw-px-2 tw-py-1 tw-text-xs tw-text-iron-400 hover:tw-text-iron-100"
                    >
                      {t(locale, "waves.drops.searchModal.filters.clear")}
                    </button>
                  </div>
                )}
              </div>

              {filtersOpen && (
                <WaveDropsSearchFilters
                  waveId={wave.id}
                  author={authorFilter}
                  authorQuery={authorQuery}
                  after={afterDate}
                  before={beforeDate}
                  invalidDateRange={!validDateRange}
                  onAuthorChange={setAuthorFilter}
                  onAuthorQueryChange={setAuthorQuery}
                  onAfterChange={setAfterDate}
                  onBeforeChange={setBeforeDate}
                  onClose={() => setFiltersOpen(false)}
                  returnFocusRef={filtersButtonRef}
                />
              )}

              <div
                className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-px-4 tw-pb-5 tw-pt-4 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-white/20 desktop-hover:hover:tw-scrollbar-thumb-white/30 sm:tw-px-5"
                aria-busy={showLoading}
              >
                {showLoading && (
                  <WaveDropsSearchState
                    id={SEARCH_LOADING_STATUS_ID}
                    variant="loading"
                    title={t(locale, "waves.drops.searchModal.loading.title")}
                    description={t(
                      locale,
                      "waves.drops.searchModal.loading.description",
                      { waveName: wave.name }
                    )}
                  />
                )}

                {!showLoading && isError && (
                  <div className="tw-flex tw-flex-col tw-items-center">
                    <WaveDropsSearchState
                      id={SEARCH_ERROR_STATUS_ID}
                      variant="error"
                      title={t(locale, "waves.drops.searchModal.error.title")}
                      description={t(
                        locale,
                        "waves.drops.searchModal.error.description"
                      )}
                    />
                    <Button
                      onClick={() => {
                        refetch().catch(() => undefined);
                      }}
                      loading={isFetching}
                      variant="tertiary"
                      size="sm"
                      className="-tw-mt-8 tw-mb-10"
                    >
                      {isFetching
                        ? t(locale, "waves.drops.searchModal.error.retrying")
                        : t(locale, "waves.drops.searchModal.error.retry")}
                    </Button>
                  </div>
                )}

                {!showLoading && !isError && !canSearch && (
                  <WaveDropsSearchState
                    id={SEARCH_IDLE_STATUS_ID}
                    variant="idle"
                    title={t(locale, "waves.drops.searchModal.idle.title")}
                    description={t(
                      locale,
                      "waves.drops.searchModal.idle.description",
                      { minLength: formattedMinQueryLength }
                    )}
                  />
                )}

                {!showLoading &&
                  !isError &&
                  canSearch &&
                  visibleResults.length === 0 && (
                    <WaveDropsSearchState
                      id={SEARCH_EMPTY_STATUS_ID}
                      variant="empty"
                      title={t(locale, "waves.drops.searchModal.empty.title")}
                      description={t(
                        locale,
                        "waves.drops.searchModal.empty.description"
                      )}
                    />
                  )}

                {!showLoading &&
                  !isError &&
                  canSearch &&
                  visibleResults.length > 0 && (
                    <div className="tw-space-y-2.5">
                      <div
                        id={SEARCH_RESULTS_STATUS_ID}
                        role="status"
                        aria-live="polite"
                        aria-label={t(
                          locale,
                          visibleResults.length === 1
                            ? "waves.drops.searchModal.results.status.one"
                            : "waves.drops.searchModal.results.status.other",
                          {
                            count: formattedResultCount,
                            query: searchCriteriaLabel,
                          }
                        )}
                        className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-pb-1"
                      >
                        <p className="tw-m-0 tw-text-xs tw-font-medium tw-text-iron-300">
                          {t(
                            locale,
                            visibleResults.length === 1
                              ? "waves.drops.searchModal.results.count.one"
                              : "waves.drops.searchModal.results.count.other",
                            { count: formattedResultCount }
                          )}
                        </p>
                        {liveNormalizedQuery ? (
                          <p className="tw-m-0 tw-min-w-0 tw-truncate tw-text-xs">
                            <span className="tw-text-iron-600">
                              {t(
                                locale,
                                "waves.drops.searchModal.results.queryPrefix"
                              )}
                            </span>{" "}
                            <span className="tw-text-iron-300">
                              &quot;{liveNormalizedQuery}&quot;
                            </span>
                          </p>
                        ) : (
                          <p className="tw-m-0 tw-text-xs tw-text-iron-400">
                            {t(
                              locale,
                              "waves.drops.searchModal.results.filtersApplied"
                            )}
                          </p>
                        )}
                      </div>
                      <div className="tw-space-y-2">
                        {visibleResults.map((drop) => {
                          const serialNo = drop.serial_no;
                          const author =
                            typeof drop.author.handle === "string" &&
                            drop.author.handle.length > 0
                              ? drop.author.handle
                              : drop.author.primary_address;
                          const resultButtonLabel = t(
                            locale,
                            "waves.drops.searchModal.result.open",
                            { serialNo, author }
                          );
                          const formattedDate = formatDate(
                            locale,
                            drop.created_at,
                            { day: "numeric", month: "short" }
                          );
                          const formattedTime = formatTime(
                            locale,
                            drop.created_at
                          );
                          return (
                            <button
                              key={drop.stableKey}
                              type="button"
                              onClick={() => selectDropResult(serialNo)}
                              aria-label={resultButtonLabel}
                              className="tw-group tw-flex tw-min-h-20 tw-w-full tw-cursor-pointer tw-items-start tw-gap-3 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/80 tw-p-3 tw-text-left tw-transition tw-duration-150 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-800/80"
                            >
                              <ProfileAvatar
                                pfpUrl={drop.author.pfp}
                                size={ProfileBadgeSize.MEDIUM}
                                alt=""
                                fallbackContent={
                                  <span className="tw-text-primary-200 tw-text-sm tw-font-semibold">
                                    {([...author][0] ?? "").toLocaleUpperCase(
                                      locale
                                    )}
                                  </span>
                                }
                              />
                              <span className="tw-min-w-0 tw-flex-1">
                                <span className="tw-flex tw-items-center tw-justify-between tw-gap-3">
                                  <span className="tw-min-w-0 tw-truncate tw-text-sm tw-font-semibold tw-text-iron-100">
                                    {author}
                                  </span>
                                  <span className="tw-flex-shrink-0 tw-text-[11px] tw-text-iron-500">
                                    {t(
                                      locale,
                                      "waves.drops.searchModal.result.serial",
                                      { serialNo }
                                    )}
                                    <span aria-hidden="true"> · </span>
                                    {formattedDate} {formattedTime}
                                  </span>
                                </span>
                                <span className="tw-mt-1 tw-line-clamp-4 tw-block tw-text-sm tw-leading-5 tw-text-iron-300">
                                  <WaveDropSearchResultPreview
                                    title={drop.title}
                                    parts={drop.parts}
                                    query={liveNormalizedQuery}
                                    fallback={t(
                                      locale,
                                      "waves.drops.searchModal.result.mediaOnly"
                                    )}
                                    checkedLabel={t(
                                      locale,
                                      "waves.drops.searchModal.result.checked"
                                    )}
                                    imageFallback={t(
                                      locale,
                                      "waves.drops.searchModal.result.imageFallback"
                                    )}
                                    uncheckedLabel={t(
                                      locale,
                                      "waves.drops.searchModal.result.unchecked"
                                    )}
                                  />
                                </span>
                              </span>
                              <ChevronRightIcon
                                className="tw-mt-2 tw-size-4 tw-flex-shrink-0 -tw-translate-x-1 tw-text-iron-600 tw-transition group-hover:tw-translate-x-0 group-hover:tw-text-primary-300"
                                aria-hidden="true"
                              />
                            </button>
                          );
                        })}
                      </div>
                      {hasNextPage && (
                        <div className="tw-flex tw-justify-center tw-pt-2">
                          <Button
                            onClick={() => {
                              fetchNextPage().catch(() => undefined);
                            }}
                            loading={isFetchingNextPage}
                            variant="tertiary"
                            size="sm"
                          >
                            {isFetchingNextPage
                              ? t(locale, "waves.drops.searchModal.loadingMore")
                              : t(locale, "waves.drops.searchModal.loadMore")}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </FocusTrap>,
    document.body
  );
}
