"use client";

import type { WaveDropsLeaderboardPageMetadata } from "@/hooks/useWaveDropsLeaderboard";
import { WAVE_DROPS_PARAMS } from "@/components/react-query-wrapper/utils/query-utils";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { Virtualizer } from "@tanstack/react-virtual";
import type { RefObject, ReactNode } from "react";
import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type LeaderboardVirtualLayout = "list" | "grid" | "gallery";
type LeaderboardColumnCount = 1 | 2 | 3;

const TWO_COLUMN_MIN_WIDTH_PX = 512;
const THREE_COLUMN_MIN_WIDTH_PX = 768;
const PREVIOUS_PAGE_PREFETCH_ROWS = 4;
const NEXT_PAGE_PREFETCH_ROWS = 4;

const getColumnCount = (
  layout: LeaderboardVirtualLayout,
  width: number
): LeaderboardColumnCount => {
  if (layout === "list") {
    return 1;
  }
  if (width >= THREE_COLUMN_MIN_WIDTH_PX) {
    return 3;
  }
  if (width >= TWO_COLUMN_MIN_WIDTH_PX) {
    return 2;
  }
  return 1;
};

const getEstimatedRowHeight = (layout: LeaderboardVirtualLayout): number => {
  if (layout === "list") {
    return 560;
  }
  return 520;
};

const getRowGapClassName = (layout: LeaderboardVirtualLayout): string =>
  layout === "gallery" ? "tw-pb-8" : "tw-pb-4";

const getGridColumnsClassName = (columns: LeaderboardColumnCount): string => {
  if (columns === 3) {
    return "tw-grid-cols-3";
  }
  if (columns === 2) {
    return "tw-grid-cols-2";
  }
  return "tw-grid-cols-1";
};

interface PageCountLedger {
  readonly windowKey: string;
  readonly firstRetainedPage: number;
  readonly leadingItemCount: number;
  readonly counts: Map<number, number>;
  readonly countsKey: string;
}

const getProjectedLeadingItemCount = ({
  counts,
  firstRetainedPage,
  ledger,
  windowKey,
}: {
  readonly counts: ReadonlyMap<number, number>;
  readonly firstRetainedPage: number;
  readonly ledger: PageCountLedger;
  readonly windowKey: string;
}): number => {
  if (ledger.windowKey !== windowKey) {
    return Math.max(0, firstRetainedPage - 1) * WAVE_DROPS_PARAMS.limit;
  }

  let leadingItemCount = ledger.leadingItemCount;
  if (firstRetainedPage > ledger.firstRetainedPage) {
    for (
      let page = ledger.firstRetainedPage;
      page < firstRetainedPage;
      page++
    ) {
      leadingItemCount +=
        ledger.counts.get(page) ?? WAVE_DROPS_PARAMS.limit;
    }
  } else if (firstRetainedPage < ledger.firstRetainedPage) {
    for (
      let page = firstRetainedPage;
      page < ledger.firstRetainedPage;
      page++
    ) {
      leadingItemCount -= counts.get(page) ?? WAVE_DROPS_PARAMS.limit;
    }
  }

  return Math.max(0, leadingItemCount);
};

export function useLeaderboardLeadingItemCount({
  pageMetadata,
  visibleItemIds,
  windowKey,
}: {
  readonly pageMetadata: readonly WaveDropsLeaderboardPageMetadata[];
  readonly visibleItemIds: ReadonlySet<string>;
  readonly windowKey: string;
}): number {
  const counts = useMemo(() => {
    const nextCounts = new Map<number, number>();
    for (const page of pageMetadata) {
      nextCounts.set(
        page.page,
        page.dropIds.reduce(
          (count, dropId) => count + (visibleItemIds.has(dropId) ? 1 : 0),
          0
        )
      );
    }
    return nextCounts;
  }, [pageMetadata, visibleItemIds]);
  const countsKey = [...counts.entries()]
    .map(([page, count]) => `${page}:${count}`)
    .join("|");
  const firstRetainedPage = pageMetadata.at(0)?.page ?? 1;
  const [ledger, setLedger] = useState<PageCountLedger>({
    windowKey,
    firstRetainedPage,
    leadingItemCount:
      Math.max(0, firstRetainedPage - 1) * WAVE_DROPS_PARAMS.limit,
    counts,
    countsKey,
  });
  if (
    ledger.windowKey !== windowKey ||
    ledger.firstRetainedPage !== firstRetainedPage ||
    ledger.countsKey !== countsKey
  ) {
    // React Query no longer exposes a page after maxPages evicts it. Update
    // the historical ledger before committing this render so the virtual
    // position stays stable without an effect-driven follow-up render.
    const nextLeadingItemCount = getProjectedLeadingItemCount({
      counts,
      firstRetainedPage,
      ledger,
      windowKey,
    });
    setLedger({
      windowKey,
      firstRetainedPage,
      leadingItemCount: nextLeadingItemCount,
      counts,
      countsKey,
    });
    return nextLeadingItemCount;
  }

  return ledger.leadingItemCount;
}

interface VisibleAnchor {
  readonly dropId: string;
  readonly logicalIndex: number;
  readonly top: number;
}

interface WaveLeaderboardVirtualizedRowsProps<TItem> {
  readonly items: readonly TItem[];
  readonly getItemId: (item: TItem) => string;
  readonly leadingItemCount: number;
  readonly windowKey: string;
  readonly layout: LeaderboardVirtualLayout;
  readonly scrollContainerRef: RefObject<HTMLDivElement | null>;
  readonly renderItem: (item: TItem) => ReactNode;
  readonly fetchNextPage: () => Promise<unknown>;
  readonly fetchPreviousPage: () => Promise<unknown>;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
  readonly isFetchingNextPage: boolean;
  readonly isFetchingPreviousPage: boolean;
  readonly isFetchNextPageError: boolean;
  readonly isFetchPreviousPageError: boolean;
  readonly autoLoadNext?: boolean | undefined;
}

export function WaveLeaderboardVirtualizedRows<TItem>({
  items,
  getItemId,
  leadingItemCount,
  windowKey,
  layout,
  scrollContainerRef,
  renderItem,
  fetchNextPage,
  fetchPreviousPage,
  hasNextPage,
  hasPreviousPage,
  isFetchingNextPage,
  isFetchingPreviousPage,
  isFetchNextPageError,
  isFetchPreviousPageError,
  autoLoadNext = false,
}: WaveLeaderboardVirtualizedRowsProps<TItem>) {
  const locale = useBrowserLocale();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const anchorRef = useRef<VisibleAnchor | null>(null);
  const previousTriggerKeyRef = useRef<string | null>(null);
  const nextTriggerKeyRef = useRef<string | null>(null);
  const [columns, setColumns] = useState<LeaderboardColumnCount>(() =>
    getColumnCount(layout, 0)
  );
  const columnsRef = useRef(columns);
  const [scrollMargin, setScrollMargin] = useState(0);
  const logicalItemCount = leadingItemCount + items.length;
  const rowCount = Math.ceil(logicalItemCount / columns);
  const estimateRowHeight = getEstimatedRowHeight(layout);

  const captureVisibleAnchor = useCallback(() => {
    const root = rootRef.current;
    const scrollContainer = scrollContainerRef.current;
    if (!root || !scrollContainer) {
      return;
    }

    const viewportTop = scrollContainer.getBoundingClientRect().top;
    const candidates = root.querySelectorAll<HTMLElement>(
      "[data-leaderboard-drop-id]"
    );
    const firstVisible = Array.from(candidates).find(
      (candidate) => candidate.getBoundingClientRect().bottom > viewportTop
    );
    if (!firstVisible) {
      return;
    }

    const dropId = firstVisible.dataset["leaderboardDropId"];
    const logicalIndex = Number(
      firstVisible.dataset["leaderboardLogicalIndex"]
    );
    if (!dropId || !Number.isFinite(logicalIndex)) {
      return;
    }

    anchorRef.current = {
      dropId,
      logicalIndex,
      top: firstVisible.getBoundingClientRect().top,
    };
  }, [scrollContainerRef]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const updateColumns = () => {
      const nextColumns = getColumnCount(
        layout,
        root.getBoundingClientRect().width
      );
      if (columnsRef.current === nextColumns) {
        return;
      }
      captureVisibleAnchor();
      columnsRef.current = nextColumns;
      setColumns(nextColumns);
    };

    updateColumns();
    if (globalThis.ResizeObserver === undefined) {
      globalThis.addEventListener("resize", updateColumns);
      return () => globalThis.removeEventListener("resize", updateColumns);
    }

    const observer = new globalThis.ResizeObserver(updateColumns);
    observer.observe(root);
    return () => observer.disconnect();
  }, [captureVisibleAnchor, layout]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const scrollContainer = scrollContainerRef.current;
    if (!root || !scrollContainer) {
      return;
    }

    const updateScrollMargin = () => {
      const nextScrollMargin =
        root.getBoundingClientRect().top -
        scrollContainer.getBoundingClientRect().top +
        scrollContainer.scrollTop;
      setScrollMargin((current) =>
        current === nextScrollMargin ? current : nextScrollMargin
      );
    };

    updateScrollMargin();
    if (globalThis.ResizeObserver === undefined) {
      globalThis.addEventListener("resize", updateScrollMargin);
      return () =>
        globalThis.removeEventListener("resize", updateScrollMargin);
    }

    const observer = new globalThis.ResizeObserver(updateScrollMargin);
    observer.observe(root);
    observer.observe(scrollContainer);
    if (root.parentElement) {
      observer.observe(root.parentElement);
    }
    return () => observer.disconnect();
  }, [scrollContainerRef]);

  const getVirtualRowKey = useCallback(
    (index: number) => `${windowKey}:${columns}:${index}`,
    [columns, windowKey]
  );

  const loadPreviousPage = useCallback(() => {
    if (!hasPreviousPage || isFetchingPreviousPage) {
      return;
    }
    void fetchPreviousPage().catch(() => undefined);
  }, [fetchPreviousPage, hasPreviousPage, isFetchingPreviousPage]);

  const loadNextPage = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage) {
      return;
    }
    void fetchNextPage().catch(() => undefined);
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleVirtualizerChange = useCallback(
    (instance: Virtualizer<HTMLDivElement, Element>) => {
      const changedRows = instance.getVirtualItems();
      const firstChangedRowIndex = changedRows.at(0)?.index ?? 0;
      const lastChangedRowIndex = changedRows.at(-1)?.index ?? -1;

      if (hasPreviousPage && !isFetchingPreviousPage) {
        const firstVisibleLogicalIndex = firstChangedRowIndex * columns;
        const previousPrefetchBoundary =
          leadingItemCount + PREVIOUS_PAGE_PREFETCH_ROWS * columns;
        const previousTriggerKey = `${windowKey}:${leadingItemCount}`;
        if (
          firstVisibleLogicalIndex <= previousPrefetchBoundary &&
          previousTriggerKeyRef.current !== previousTriggerKey
        ) {
          previousTriggerKeyRef.current = previousTriggerKey;
          loadPreviousPage();
        }
      }

      if (!autoLoadNext || !hasNextPage || isFetchingNextPage) {
        return;
      }

      const lastVisibleLogicalIndex =
        (lastChangedRowIndex + 1) * columns - 1;
      const nextPrefetchBoundary = Math.max(
        0,
        logicalItemCount - NEXT_PAGE_PREFETCH_ROWS * columns
      );
      if (lastVisibleLogicalIndex < nextPrefetchBoundary) {
        return;
      }

      const lastItem = items.at(-1);
      const lastItemId =
        lastItem === undefined ? "empty" : getItemId(lastItem);
      const nextTriggerKey = `${windowKey}:${leadingItemCount}:${lastItemId}`;
      if (nextTriggerKeyRef.current === nextTriggerKey) {
        return;
      }
      nextTriggerKeyRef.current = nextTriggerKey;
      loadNextPage();
    },
    [
      autoLoadNext,
      columns,
      getItemId,
      hasNextPage,
      hasPreviousPage,
      isFetchingNextPage,
      isFetchingPreviousPage,
      items,
      leadingItemCount,
      loadNextPage,
      loadPreviousPage,
      logicalItemCount,
      windowKey,
    ]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => estimateRowHeight,
    getItemKey: getVirtualRowKey,
    overscan: layout === "list" ? 4 : 2,
    scrollMargin,
    onChange: handleVirtualizerChange,
  });
  const virtualRows = virtualizer.getVirtualItems();
  const previousRetryRowIndex = virtualRows.find(
    (virtualRow) => virtualRow.index * columns < leadingItemCount
  )?.index;

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    const root = rootRef.current;
    const scrollContainer = scrollContainerRef.current;
    if (!anchor || !root || !scrollContainer) {
      return;
    }

    const anchoredDrop = Array.from(
      root.querySelectorAll<HTMLElement>("[data-leaderboard-drop-id]")
    ).find(
      (candidate) =>
        candidate.dataset["leaderboardDropId"] === anchor.dropId
    );
    if (anchoredDrop) {
      scrollContainer.scrollTo({
        top:
          scrollContainer.scrollTop +
          anchoredDrop.getBoundingClientRect().top -
          anchor.top,
      });
      anchorRef.current = null;
      return;
    }

    if (!items.some((item) => getItemId(item) === anchor.dropId)) {
      anchorRef.current = null;
      return;
    }

    virtualizer.scrollToIndex(Math.floor(anchor.logicalIndex / columns), {
      align: "start",
    });
  }, [
    columns,
    getItemId,
    items,
    leadingItemCount,
    scrollContainerRef,
    virtualizer,
  ]);

  const ariaSetSize = hasNextPage || hasPreviousPage ? -1 : items.length;
  const rowGapClassName = getRowGapClassName(layout);
  const gridColumnsClassName = getGridColumnsClassName(columns);

  return (
    <div ref={rootRef} className="tw-w-full tw-min-w-0 tw-@container">
      {isFetchingPreviousPage ? (
        <span className="tw-sr-only" role="status" aria-live="polite">
          {t(locale, "waves.leaderboard.loadingEarlier")}
        </span>
      ) : null}

      <div
        role={"list" /* NOSONAR -- virtual row wrappers require ARIA roles. */}
        aria-label={t(locale, "waves.leaderboard.listLabel")}
        className="tw-relative tw-w-full tw-min-w-0"
        style={{ height: virtualizer.getTotalSize() }}
      >
        {virtualRows.map((virtualRow) => {
          const rowStart = virtualRow.index * columns;
          const logicalIndexes = Array.from(
            { length: columns },
            (_, columnIndex) => rowStart + columnIndex
          ).filter((logicalIndex) => logicalIndex < logicalItemCount);
          const hasLoadedItem = logicalIndexes.some(
            (logicalIndex) => logicalIndex >= leadingItemCount
          );
          const placeholderLogicalIndexes = logicalIndexes.filter(
            (logicalIndex) => logicalIndex < leadingItemCount
          );
          const loadedLogicalIndexes = logicalIndexes.filter(
            (logicalIndex) => logicalIndex >= leadingItemCount
          );
          const showPreviousRetry =
            isFetchPreviousPageError &&
            virtualRow.index === previousRetryRowIndex &&
            placeholderLogicalIndexes.length > 0;

          return (
            <div
              key={virtualRow.key}
              ref={hasLoadedItem ? virtualizer.measureElement : undefined}
              data-index={virtualRow.index}
              className={`tw-absolute tw-left-0 tw-top-0 tw-grid tw-w-full tw-min-w-0 tw-gap-4 ${gridColumnsClassName} ${rowGapClassName}`}
              style={{
                minHeight: virtualRow.size,
                transform: `translateY(${virtualRow.start - scrollMargin}px)`,
              }}
            >
              {showPreviousRetry ? (
                <div
                  role={
                    "listitem" /* NOSONAR -- this retry is a virtual list entry. */
                  }
                  className="tw-flex tw-min-h-[24rem] tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-iron-800/60 tw-bg-iron-950"
                  style={{
                    gridColumn: `span ${placeholderLogicalIndexes.length}`,
                  }}
                >
                  <span className="tw-sr-only" role="alert">
                    {t(locale, "waves.leaderboard.previousLoadError")}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      previousTriggerKeyRef.current = null;
                      loadPreviousPage();
                    }}
                    className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-text-iron-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
                  >
                    {t(locale, "waves.leaderboard.retryEarlier")}
                  </button>
                </div>
              ) : (
                placeholderLogicalIndexes.map((logicalIndex) => (
                  <div
                    key={`placeholder-${logicalIndex}`}
                    aria-hidden="true"
                    className="tw-flex tw-min-h-[24rem] tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-iron-800/60 tw-bg-iron-950"
                  >
                    <div className="tw-h-full tw-min-h-[24rem] tw-w-full tw-animate-pulse tw-rounded-xl tw-bg-iron-900/50" />
                  </div>
                ))
              )}
              {loadedLogicalIndexes.map((logicalIndex) => {
                const itemIndex = logicalIndex - leadingItemCount;
                const item = items[itemIndex];
                if (item === undefined) {
                  return null;
                }

                const itemId = getItemId(item);
                return (
                  <div
                    key={itemId}
                    role={
                      "listitem" /* NOSONAR -- cards are virtual list entries. */
                    }
                    aria-posinset={itemIndex + 1}
                    aria-setsize={ariaSetSize}
                    data-leaderboard-drop-id={itemId}
                    data-leaderboard-logical-index={logicalIndex}
                    className="tw-min-w-0"
                  >
                    {renderItem(item)}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {isFetchingNextPage ? (
        <div className="tw-py-4" role="status" aria-live="polite">
          <div className="tw-h-1 tw-w-full tw-animate-pulse tw-rounded-full tw-bg-iron-800" />
          <span className="tw-sr-only">
            {t(locale, "waves.leaderboard.loadingMore")}
          </span>
        </div>
      ) : null}

      {isFetchNextPageError ? (
        <div className="tw-flex tw-justify-center tw-py-4">
          <span className="tw-sr-only" role="alert">
            {t(locale, "waves.leaderboard.nextLoadError")}
          </span>
          <button
            type="button"
            onClick={() => {
              nextTriggerKeyRef.current = null;
              loadNextPage();
            }}
            className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-text-iron-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            {t(locale, "waves.leaderboard.retryMore")}
          </button>
        </div>
      ) : null}

      {!autoLoadNext && hasNextPage && !isFetchNextPageError ? (
        <div className="tw-mb-2 tw-mt-4 tw-flex tw-justify-center">
          <button
            type="button"
            onClick={loadNextPage}
            disabled={isFetchingNextPage}
            className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-px-4 tw-py-2 tw-text-sm tw-text-iron-400 tw-transition focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-wait disabled:tw-opacity-60 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-text-iron-300"
          >
            {isFetchingNextPage
              ? t(locale, "waves.leaderboard.loadingMoreButton")
              : t(locale, "waves.leaderboard.loadMore")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
