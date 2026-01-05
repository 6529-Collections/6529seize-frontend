import { useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import {
  ROW_HEIGHT,
  GRID_ROW_HEIGHT,
  DEFAULT_OVERSCAN,
  getVisibleWindowBounds,
} from "./utils";
import type { VirtualizedTokenListContentProps } from "./types";
import { usePersistentScrollOffset } from "./hooks/usePersistentScrollOffset";
import { useVisibleTokenWindow } from "./hooks/useVisibleTokenWindow";
import { useTokenMetadataWindow } from "./hooks/useTokenMetadataWindow";
import { GridRow } from "./components/GridRow";
import { TokenRow } from "./components/TokenRow";

export function VirtualizedTokenListContent({
  contractAddress,
  chain,
  ranges,
  scrollKey,
  totalCount,
  overscan = DEFAULT_OVERSCAN,
  renderTokenExtra,
  action,
  className = "tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-900",
  scrollContainerClassName = "tw-max-h-80 tw-overflow-y-auto",
  rowClassName,
  footerContent,
  footerClassName = "tw-border-t tw-border-iron-700 tw-px-3 tw-py-2 tw-text-xs tw-text-iron-400",
  onEndReached,
  endReachedOffset,
  emptyState,
  layout = "list",
  columns = 3,

  tokens,
}: VirtualizedTokenListContentProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const initialOffset = usePersistentScrollOffset(
    scrollKey,
    scrollContainerRef
  );

  const isGrid = layout === "grid";
  const rowCount = isGrid ? Math.ceil(totalCount / columns) : totalCount;
  const rowHeight = isGrid ? GRID_ROW_HEIGHT : ROW_HEIGHT;

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => rowHeight,
    overscan,
    initialOffset,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const { firstVisibleIndex, lastVisibleIndex } =
    getVisibleWindowBounds(virtualItems);

  // Calculate token indices based on row indices
  const firstTokenIndex = isGrid
    ? firstVisibleIndex! * columns
    : firstVisibleIndex;
  const lastTokenIndex = isGrid
    ? Math.min((lastVisibleIndex + 1) * columns - 1, totalCount - 1)
    : lastVisibleIndex;

  const windowTokens = useVisibleTokenWindow(
    ranges,
    firstTokenIndex!,
    lastTokenIndex,
    tokens
  );

  const { metadataMap, metadataQuery } = useTokenMetadataWindow({
    contractAddress,
    chain,
    windowTokens,
  });
  const endReachedTriggerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!onEndReached) {
      endReachedTriggerRef.current = null;
      return;
    }
    if (totalCount === 0 || lastVisibleIndex < 0) {
      return;
    }
    const threshold = endReachedOffset ?? overscan ?? DEFAULT_OVERSCAN;
    const distanceFromEnd = rowCount - 1 - lastVisibleIndex;
    if (distanceFromEnd <= threshold) {
      if (endReachedTriggerRef.current !== totalCount) {
        endReachedTriggerRef.current = totalCount;
        onEndReached({ lastVisibleIndex: lastTokenIndex, totalCount });
      }
    }
  }, [
    onEndReached,
    totalCount,
    lastVisibleIndex,
    overscan,
    endReachedOffset,
    rowCount,
    lastTokenIndex,
  ]);

  if (totalCount === 0) {
    return (
      <>
        <div
          ref={scrollContainerRef}
          aria-hidden="true"
          className="tw-hidden"
        />
        {emptyState}
      </>
    );
  }

  return (
    <div className={className}>
      <div ref={scrollContainerRef} className={scrollContainerClassName}>
        <ul
          aria-label="Selected tokens"
          className="tw-relative tw-m-0 tw-list-none tw-p-0"
          style={{ height: virtualizer.getTotalSize(), position: "relative" }}
        >
          {virtualItems.map((virtualItem) => {
            const rowIndex = virtualItem.index;

            if (isGrid) {
              const rowStartTokenIndex = rowIndex * columns;
              const rowTokens = [];

              for (let i = 0; i < columns; i++) {
                const tokenIndex = rowStartTokenIndex + i;
                if (tokenIndex >= totalCount) break;

                // Find the token in our window based on its absolute index
                // windowTokens starts from firstTokenIndex
                const windowIndex = tokenIndex - firstTokenIndex!;
                const token = windowTokens[windowIndex];
                if (token) {
                  rowTokens.push(token);
                }
              }

              return (
                <GridRow
                  key={rowIndex}
                  tokens={rowTokens}
                  metadataMap={metadataMap}
                  metadataQuery={metadataQuery}
                  renderTokenExtra={renderTokenExtra}
                  action={action}
                  positionStyle={{
                    transform: `translateY(${virtualItem.start}px)`,
                    height: virtualItem.size,
                    width: "100%",
                  }}
                  columns={columns}
                />
              );
            }

            // List layout
            const windowIndex = rowIndex - firstVisibleIndex!;
            const token = windowTokens[windowIndex];
            if (!token) {
              return null;
            }

            const metadata = metadataMap.get(token.decimalId);
            const isLoadingMetadata = metadataQuery.isFetching && !metadata;
            const hasMetadataError = metadataQuery.isError && !metadata;

            return (
              <TokenRow
                key={token.decimalId}
                token={token}
                metadata={metadata}
                rowClassName={rowClassName}
                renderTokenExtra={renderTokenExtra}
                action={action}
                isMetadataLoading={isLoadingMetadata}
                hasMetadataError={hasMetadataError}
                positionStyle={{
                  transform: `translateY(${virtualItem.start}px)`,
                  height: virtualItem.size,
                  width: "100%",
                }}
              />
            );
          })}
        </ul>
      </div>
      {footerContent ? (
        <div className={footerClassName}>{footerContent}</div>
      ) : null}
    </div>
  );
}
