"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import { markdownToPlainText } from "@/helpers/waves/waveDescriptionPreview";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { useWaveDropsSearch } from "@/hooks/useWaveDropsSearch";
import { formatDate, formatInteger, formatTime } from "@/i18n/format";
import { t } from "@/i18n/messages";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { FocusTrap } from "focus-trap-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";

const MIN_QUERY_LENGTH = 2;
const DIALOG_TITLE_ID = "wave-drops-search-title";
const DIALOG_DESCRIPTION_ID = "wave-drops-search-description";
const SEARCH_INPUT_DESCRIPTION_ID = "wave-drops-search-input-description";
const SEARCH_EMPTY_STATUS_ID = "wave-drops-search-empty-status";
const SEARCH_ERROR_STATUS_ID = "wave-drops-search-error-status";
const SEARCH_IDLE_STATUS_ID = "wave-drops-search-idle-status";
const SEARCH_LOADING_STATUS_ID = "wave-drops-search-loading-status";
const SEARCH_RESULTS_STATUS_ID = "wave-drops-search-results-status";

const normalize = (value: string) => value.trim();

const getDropPreviewText = (drop: {
  readonly title: string | null;
  readonly parts: readonly {
    readonly content: string | null;
  }[];
}) => {
  const content = drop.parts
    .map((part) => markdownToPlainText(part.content ?? ""))
    .filter(Boolean)
    .join(" ");
  return [drop.title?.trim(), content].filter(Boolean).join(" — ");
};

function HighlightedSearchText({
  query,
  text,
}: {
  readonly query: string;
  readonly text: string;
}) {
  if (query.length === 0) return text;
  const normalizedText = text.toLocaleLowerCase();
  const normalizedQuery = query.toLocaleLowerCase();
  const parts: ReactNode[] = [];
  let cursor = 0;
  let matchIndex = normalizedText.indexOf(normalizedQuery, cursor);
  while (matchIndex !== -1) {
    if (matchIndex > cursor) parts.push(text.slice(cursor, matchIndex));
    const matchEnd = matchIndex + query.length;
    parts.push(
      <mark
        key={`match-${matchIndex}`}
        className="tw-rounded-sm tw-bg-primary-400/20 tw-px-0.5 tw-text-inherit"
      >
        {text.slice(matchIndex, matchEnd)}
      </mark>
    );
    cursor = matchEnd;
    matchIndex = normalizedText.indexOf(normalizedQuery, cursor);
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return parts;
}

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
  const modalRef = useRef<HTMLDivElement>(null);
  const locale = useBrowserLocale();
  useClickAway(modalRef, () => {
    if (isOpen) onClose();
  });
  useKeyPressEvent("Escape", () => {
    if (isOpen) onClose();
  });

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useDebounce(() => setDebouncedQuery(query), 250, [query]);

  const normalizedQuery = useMemo(
    () => normalize(debouncedQuery),
    [debouncedQuery]
  );

  const liveNormalizedQuery = normalize(query);
  const meetsMinLength = liveNormalizedQuery.length >= MIN_QUERY_LENGTH;
  const isQuerySettled = liveNormalizedQuery === normalizedQuery;

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
    enabled:
      isOpen && normalizedQuery.length >= MIN_QUERY_LENGTH && isQuerySettled,
    size: 50,
  });

  const formattedMinQueryLength = formatInteger(locale, MIN_QUERY_LENGTH);
  const visibleResults = isQuerySettled ? results : [];
  const isUpdating = meetsMinLength && !isQuerySettled;
  const showLoading =
    isLoading || isUpdating || (isFetching && visibleResults.length === 0);
  const formattedResultCount = formatInteger(locale, visibleResults.length);

  const inputRef = useRef<HTMLInputElement>(null);
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
                  <button
                    type="button"
                    onClick={onSearchAll}
                    className="tw-flex-shrink-0 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-2.5 tw-py-1.5 tw-text-xs tw-font-medium tw-text-iron-200 tw-transition hover:tw-border-iron-600 hover:tw-bg-iron-800 hover:tw-text-white focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 sm:tw-px-3"
                  >
                    {t(locale, "waves.drops.searchModal.searchAll")}
                  </button>
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
                <div className="tw-relative">
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
              </div>

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
                    <button
                      type="button"
                      onClick={() => {
                        refetch().catch(() => undefined);
                      }}
                      disabled={isFetching}
                      className="tw-text-primary-100 -tw-mt-8 tw-mb-10 tw-rounded-lg tw-border tw-border-solid tw-border-primary-400/40 tw-bg-primary-500/15 tw-px-4 tw-py-2 tw-text-sm tw-font-semibold hover:tw-bg-primary-500/25 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
                    >
                      {isFetching
                        ? t(locale, "waves.drops.searchModal.error.retrying")
                        : t(locale, "waves.drops.searchModal.error.retry")}
                    </button>
                  </div>
                )}

                {!showLoading && !isError && !meetsMinLength && (
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
                  meetsMinLength &&
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
                  meetsMinLength &&
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
                            query: liveNormalizedQuery,
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
                          const previewText =
                            getDropPreviewText(drop) ||
                            t(
                              locale,
                              "waves.drops.searchModal.result.mediaOnly"
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
                              <span
                                className="tw-text-primary-200 tw-flex tw-size-9 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800 tw-text-sm tw-font-semibold tw-ring-1 tw-ring-inset tw-ring-white/5"
                                aria-hidden="true"
                              >
                                {author.slice(0, 1).toLocaleUpperCase(locale)}
                              </span>
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
                                <span className="tw-mt-1 tw-line-clamp-2 tw-block tw-text-sm tw-leading-5 tw-text-iron-300">
                                  <HighlightedSearchText
                                    query={liveNormalizedQuery}
                                    text={previewText}
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
                          <button
                            type="button"
                            onClick={() => {
                              fetchNextPage().catch(() => undefined);
                            }}
                            disabled={isFetchingNextPage}
                            className="tw-inline-flex tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-200 tw-transition tw-duration-150 hover:tw-border-iron-600 hover:tw-bg-iron-800 hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
                          >
                            {isFetchingNextPage
                              ? t(locale, "waves.drops.searchModal.loadingMore")
                              : t(locale, "waves.drops.searchModal.loadMore")}
                          </button>
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
