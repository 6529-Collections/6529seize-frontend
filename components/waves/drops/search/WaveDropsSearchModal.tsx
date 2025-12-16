"use client";

import { ApiWave } from "@/generated/models/ApiWave";
import { useWaveDropsSearch } from "@/hooks/useWaveDropsSearch";
import { ChevronLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { FocusTrap } from "focus-trap-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";
import Drop, { DropLocation } from "../Drop";

const MIN_QUERY_LENGTH = 2;

const normalize = (value: string) => value.trim();

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
  useDebounce(
    () => setDebouncedQuery(query),
    250,
    [query]
  );

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

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

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
      <div className="tailwind-scope tw-cursor-default tw-relative tw-z-1000">
        <div className="tw-fixed tw-inset-0 tw-bg-gray-600 tw-bg-opacity-50 tw-backdrop-blur-[1px]" />
        <div className="tw-fixed tw-inset-0 tw-z-1000 tw-overflow-y-auto">
          <div className="tw-flex tw-min-h-full tw-items-start tw-justify-center tw-p-0 tw-text-center sm:tw-items-center sm:tw-p-6">
            <div
              ref={modalRef}
              aria-modal="true"
              aria-labelledby="wave-drops-search-input"
              className="tw-w-full tw-h-full sm:tw-h-[70vh] tw-max-w-[min(100vw,900px)] tw-transform sm:tw-rounded-xl tw-bg-iron-950 tw-text-left tw-shadow-xl tw-transition-all tw-overflow-hidden inset-safe-area tw-flex tw-flex-col tw-min-h-0 tw-border tw-border-solid tw-border-iron-800"
            >
              <div className="tw-border-b tw-border-x-0 tw-border-t-0 tw-border-solid tw-border-white/10 tw-px-4 tw-py-4 tw-flex tw-items-center tw-gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close search"
                  className="tw-flex sm:tw-hidden tw-size-7 tw-bg-transparent -tw-ml-1 tw-mr-1 tw-border-none tw-rounded-full tw-items-center tw-justify-center tw-text-iron-300 hover:tw-text-white tw-transition tw-duration-150"
                >
                  <ChevronLeftIcon className="tw-size-6 tw-flex-shrink-0" />
                </button>

                <div className="tw-min-w-0 tw-flex-1">
                  <div className="tw-text-xs tw-text-iron-400 tw-tracking-wide">
                    Search in
                  </div>
                  <div className="tw-text-sm tw-font-semibold tw-text-iron-50 tw-truncate">
                    {wave.name}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close search"
                  className="tw-hidden sm:tw-inline-flex tw-items-center tw-justify-center tw-size-9 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-text-iron-200 hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white tw-transition tw-duration-150"
                >
                  <XMarkIcon className="tw-size-5 tw-flex-shrink-0" />
                </button>
              </div>

              <div className="tw-px-4 tw-pb-4">
                <div className="tw-relative">
                  <svg
                    className="tw-pointer-events-none tw-absolute tw-left-4 tw-top-3.5 tw-h-5 tw-w-5 tw-text-iron-300"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <label className="tw-sr-only" htmlFor="wave-drops-search-input">
                    Search messages
                  </label>
                  <input
                    id="wave-drops-search-input"
                    ref={inputRef}
                    type="text"
                    autoComplete="off"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-py-3 tw-pl-11 tw-pr-10 tw-bg-iron-900 tw-text-iron-50 tw-font-normal tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 hover:tw-ring-iron-600 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-bg-transparent focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-300 tw-text-base sm:text-sm tw-transition tw-duration-300 tw-ease-out"
                    placeholder="Search messages"
                  />
                  {query.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      aria-label="Clear search"
                      className="tw-absolute tw-right-2 tw-top-1/2 -tw-translate-y-1/2 tw-flex tw-items-center tw-justify-center tw-size-8 tw-rounded-full tw-bg-transparent tw-border-0 tw-text-iron-400 hover:tw-text-iron-100 tw-transition tw-duration-150"
                    >
                      <XMarkIcon className="tw-size-5 tw-flex-shrink-0" />
                    </button>
                  )}
                </div>
              </div>

              <div className="tw-flex-1 tw-min-h-0 tw-overflow-y-auto tw-px-4 tw-pb-6">
                {isLoading && (
                  <div className="tw-flex tw-items-center tw-justify-center tw-py-10 tw-text-iron-300">
                    Loading…
                  </div>
                )}

                {!isLoading && isError && (
                  <div className="tw-flex tw-items-center tw-justify-center tw-py-10 tw-text-iron-300">
                    Couldn’t load drops for search.
                  </div>
                )}

                {!isLoading && !isError && !meetsMinLength && (
                  <div className="tw-flex tw-items-center tw-justify-center tw-py-10 tw-text-iron-400 tw-text-sm">
                    Type at least {MIN_QUERY_LENGTH} characters to search.
                  </div>
                )}

                {!isLoading &&
                  !isError &&
                  meetsMinLength &&
                  results.length === 0 && (
                    <div className="tw-flex tw-items-center tw-justify-center tw-py-10 tw-text-iron-400 tw-text-sm">
                      No matches found.
                    </div>
                  )}

                {!isLoading &&
                  !isError &&
                  meetsMinLength &&
                  results.length > 0 && (
                    <div className="tw-space-y-2">
                      <div className="tw-text-xs tw-text-iron-400">
                        {results.length} result{results.length === 1 ? "" : "s"}
                      </div>
                      <div className="tw-space-y-2">
                        {results.map((drop, index) => {
                          const previousDrop = results[index - 1] ?? null;
                          const nextDrop = results[index + 1] ?? null;
                          const serialNo = drop.serial_no;
                          const canSelect = typeof serialNo === "number";
                          return (
                            <button
                              type="button"
                              key={drop.stableKey}
                              disabled={!canSelect}
                              onClick={() => {
                                if (!canSelect) return;
                                onSelectSerialNo(serialNo);
                                onClose();
                              }}
                              className="tw-w-full tw-text-left tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950/50 desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-900/40 tw-transition tw-duration-150 disabled:tw-opacity-60 disabled:tw-cursor-not-allowed"
                            >
                              <div className="tw-pointer-events-none">
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
                                  onQuote={() => {}}
                                  onReplyClick={() => {}}
                                  onQuoteClick={() => {}}
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      {hasNextPage && (
                        <div className="tw-flex tw-justify-center tw-pt-2">
                          <button
                            type="button"
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className="tw-inline-flex tw-items-center tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-200 hover:tw-border-iron-500 hover:tw-bg-iron-800 hover:tw-text-white disabled:tw-opacity-50 disabled:tw-cursor-not-allowed tw-transition tw-duration-150"
                          >
                            {isFetchingNextPage ? "Loading…" : "Load more"}
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
