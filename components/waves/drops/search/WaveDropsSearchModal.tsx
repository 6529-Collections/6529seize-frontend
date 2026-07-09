"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import { useApprovalWaveStatus } from "@/hooks/waves/useApprovalWaveStatus";
import { useWaveDropsSearch } from "@/hooks/useWaveDropsSearch";
import {
  ChevronLeftIcon,
  ExclamationTriangleIcon,
  InboxIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { FocusTrap } from "focus-trap-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";
import Drop, { DropLocation } from "../Drop";

const MIN_QUERY_LENGTH = 2;
const DIALOG_TITLE_ID = "wave-drops-search-title";
const DIALOG_DESCRIPTION_ID = "wave-drops-search-description";
const SEARCH_EMPTY_STATUS_ID = "wave-drops-search-empty-status";
const SEARCH_ERROR_STATUS_ID = "wave-drops-search-error-status";
const SEARCH_IDLE_STATUS_ID = "wave-drops-search-idle-status";
const SEARCH_LOADING_STATUS_ID = "wave-drops-search-loading-status";
const SEARCH_RESULTS_STATUS_ID = "wave-drops-search-results-status";

const normalize = (value: string) => value.trim();

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
  const stateRole =
    variant === "error"
      ? "alert"
      : variant === "loading"
        ? "status"
        : undefined;
  const iconClasses = "tw-size-5 tw-flex-shrink-0";
  const icon =
    variant === "loading" ? (
      <span
        className="tw-size-4 tw-animate-spin tw-rounded-full tw-border-2 tw-border-solid tw-border-iron-500 tw-border-t-primary-300"
        aria-hidden="true"
      />
    ) : variant === "error" ? (
      <ExclamationTriangleIcon
        className={`${iconClasses} tw-text-error`}
        aria-hidden="true"
      />
    ) : variant === "empty" ? (
      <InboxIcon
        className={`${iconClasses} tw-text-iron-300`}
        aria-hidden="true"
      />
    ) : (
      <MagnifyingGlassIcon
        className={`${iconClasses} tw-text-primary-300`}
        aria-hidden="true"
      />
    );

  return (
    <div
      id={id}
      role={stateRole}
      aria-live={variant === "loading" ? "polite" : undefined}
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
}: {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly wave: ApiWave;
  readonly onSelectSerialNo: (serialNo: number) => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  useClickAway(modalRef, () => {
    if (isOpen) onClose();
  });
  useKeyPressEvent("Escape", () => {
    if (isOpen) onClose();
  });

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  useDebounce(() => setDebouncedQuery(query), 250, [query]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setDebouncedQuery("");
    }
  }, [isOpen]);

  const normalizedQuery = useMemo(
    () => normalize(debouncedQuery),
    [debouncedQuery]
  );

  const meetsMinLength = normalizedQuery.length >= MIN_QUERY_LENGTH;
  const {
    winningThreshold,
    winningThresholdMinDurationMs,
    isVotingClosed,
    isVotingControlsLocked,
  } = useApprovalWaveStatus({ wave });

  const {
    drops: results,
    isLoading,
    isError,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useWaveDropsSearch({
    wave,
    term: normalizedQuery,
    enabled: isOpen && meetsMinLength,
    size: 50,
  });

  const searchStatusId = isLoading
    ? SEARCH_LOADING_STATUS_ID
    : isError
      ? SEARCH_ERROR_STATUS_ID
      : !meetsMinLength
        ? SEARCH_IDLE_STATUS_ID
        : results.length === 0
          ? SEARCH_EMPTY_STATUS_ID
          : SEARCH_RESULTS_STATUS_ID;

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

  const handleDropResultKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    serialNo: number
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      selectDropResult(serialNo);
    }

    if (event.key === " ") {
      event.preventDefault();
    }
  };

  const handleDropResultKeyUp = (
    event: KeyboardEvent<HTMLDivElement>,
    serialNo: number
  ) => {
    if (event.key === " ") {
      event.preventDefault();
      selectDropResult(serialNo);
    }
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
                  aria-label="Close search"
                  className="-tw-ml-1 tw-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-lg tw-border-none tw-bg-transparent tw-text-iron-300 tw-transition tw-duration-150 hover:tw-bg-iron-900 hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70 sm:tw-hidden"
                >
                  <ChevronLeftIcon className="tw-size-6 tw-flex-shrink-0" />
                </button>

                <div className="tw-min-w-0 tw-flex-1">
                  <h2
                    id={DIALOG_TITLE_ID}
                    className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50"
                  >
                    Search messages
                  </h2>
                  <p
                    id={DIALOG_DESCRIPTION_ID}
                    className="tw-m-0 tw-mt-0.5 tw-truncate tw-text-sm tw-leading-5 tw-text-iron-400"
                  >
                    in {wave.name}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close search"
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
                    Search messages in {wave.name}
                  </label>
                  <input
                    id="wave-drops-search-input"
                    ref={inputRef}
                    type="text"
                    autoComplete="off"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    aria-describedby={searchStatusId}
                    className="sm:text-sm tw-form-input tw-block tw-h-11 tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-py-2.5 tw-pl-10 tw-pr-10 tw-text-base tw-font-normal tw-text-iron-50 tw-caret-primary-300 tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-150 tw-ease-out placeholder:tw-text-iron-500 hover:tw-bg-iron-900 hover:tw-ring-iron-600 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-300/90"
                    placeholder="Search messages"
                  />
                  {query.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      aria-label="Clear search"
                      className="tw-absolute tw-right-2 tw-top-1/2 tw-flex tw-size-8 -tw-translate-y-1/2 tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-transparent tw-text-iron-400 tw-transition tw-duration-150 hover:tw-bg-iron-800 hover:tw-text-iron-100 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70"
                    >
                      <XMarkIcon className="tw-size-5 tw-flex-shrink-0" />
                    </button>
                  )}
                </div>
              </div>

              <div
                className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-px-4 tw-pb-5 tw-pt-4 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-white/20 desktop-hover:hover:tw-scrollbar-thumb-white/30 sm:tw-px-5"
                aria-busy={isLoading}
              >
                {isLoading && (
                  <WaveDropsSearchState
                    id={SEARCH_LOADING_STATUS_ID}
                    variant="loading"
                    title="Searching messages"
                    description={`Looking through ${wave.name}.`}
                  />
                )}

                {!isLoading && isError && (
                  <WaveDropsSearchState
                    id={SEARCH_ERROR_STATUS_ID}
                    variant="error"
                    title="Couldn't load results"
                    description="Change the query or reopen search to try again."
                  />
                )}

                {!isLoading && !isError && !meetsMinLength && (
                  <WaveDropsSearchState
                    id={SEARCH_IDLE_STATUS_ID}
                    variant="idle"
                    title="Ready to search"
                    description={`Type at least ${MIN_QUERY_LENGTH} characters to search this wave.`}
                  />
                )}

                {!isLoading &&
                  !isError &&
                  meetsMinLength &&
                  results.length === 0 && (
                    <WaveDropsSearchState
                      id={SEARCH_EMPTY_STATUS_ID}
                      variant="empty"
                      title="No messages found"
                      description="Try a different word or phrase."
                    />
                  )}

                {!isLoading &&
                  !isError &&
                  meetsMinLength &&
                  results.length > 0 && (
                    <div className="tw-space-y-2.5">
                      <div
                        id={SEARCH_RESULTS_STATUS_ID}
                        role="status"
                        aria-live="polite"
                        aria-label={`${results.length} result${
                          results.length === 1 ? "" : "s"
                        } for "${normalizedQuery}"`}
                        className="tw-flex tw-items-center tw-justify-between tw-gap-3 tw-pb-1"
                      >
                        <p className="tw-m-0 tw-text-sm tw-font-medium tw-text-iron-200">
                          {results.length} result
                          {results.length === 1 ? "" : "s"}
                        </p>
                        <p className="tw-m-0 tw-min-w-0 tw-truncate tw-text-xs tw-text-iron-400">
                          for "{normalizedQuery}"
                        </p>
                      </div>
                      <div className="tw-space-y-2">
                        {results.map((drop, index) => {
                          const previousDrop = results[index - 1] ?? null;
                          const nextDrop = results[index + 1] ?? null;
                          const serialNo = drop.serial_no;
                          const canSelect = typeof serialNo === "number";
                          const author =
                            drop.author?.handle ??
                            drop.author?.primary_address ??
                            "unknown author";
                          return (
                            <div
                              key={drop.stableKey}
                              role={canSelect ? "button" : undefined}
                              tabIndex={canSelect ? 0 : -1}
                              aria-label={
                                canSelect
                                  ? `Open message ${serialNo} by ${author}`
                                  : undefined
                              }
                              aria-disabled={canSelect ? undefined : true}
                              onClick={() => {
                                if (typeof serialNo !== "number") return;
                                selectDropResult(serialNo);
                              }}
                              onKeyDown={(event) => {
                                if (typeof serialNo !== "number") return;
                                handleDropResultKeyDown(event, serialNo);
                              }}
                              onKeyUp={(event) => {
                                if (typeof serialNo !== "number") return;
                                handleDropResultKeyUp(event, serialNo);
                              }}
                              className={`tw-w-full tw-overflow-hidden tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-text-left tw-transition tw-duration-150 focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 ${
                                canSelect
                                  ? "tw-cursor-pointer desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-800/80"
                                  : "tw-cursor-not-allowed tw-opacity-60"
                              }`}
                            >
                              <div
                                className="tw-pointer-events-none"
                                inert={true}
                                aria-hidden="true"
                              >
                                <Drop
                                  drop={drop}
                                  previousDrop={previousDrop}
                                  nextDrop={nextDrop}
                                  showWaveInfo={false}
                                  activeDrop={null}
                                  showReplyAndQuote={false}
                                  location={DropLocation.WAVE}
                                  dropViewDropId={null}
                                  onReply={() => {}}
                                  onReplyClick={() => {}}
                                  onQuoteClick={() => {}}
                                  winningThreshold={winningThreshold}
                                  winningThresholdMinDurationMs={
                                    winningThresholdMinDurationMs
                                  }
                                  isVotingClosed={isVotingClosed}
                                  isVotingControlsLocked={
                                    isVotingControlsLocked
                                  }
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {hasNextPage && (
                        <div className="tw-flex tw-justify-center tw-pt-2">
                          <button
                            type="button"
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="tw-inline-flex tw-items-center tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-200 tw-transition tw-duration-150 hover:tw-border-iron-600 hover:tw-bg-iron-800 hover:tw-text-white focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400/70 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
                          >
                            {isFetchingNextPage ? "Loading..." : "Load more"}
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
