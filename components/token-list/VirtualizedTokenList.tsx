"use client";

import Image from "next/image";
import clsx from "clsx";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import Spinner from "@/components/utils/Spinner";
import { useScrollPositionContext } from "@/contexts/ScrollPositionContext";
import { useTokenMetadataQuery } from "@/hooks/useAlchemyNftQueries";
import type {
  SupportedChain,
  TokenMetadata,
  TokenRange,
} from "@/components/nft-picker/NftPicker.types";
import { expandRangesWindow } from "@/components/nft-picker/NftPicker.utils";

const ROW_HEIGHT = 72;
const GRID_ROW_HEIGHT = 380; // Taller rows for grid items
const DEFAULT_OVERSCAN = 8;
const BIGINT_ZERO = BigInt(0);
const BIGINT_ONE = BigInt(1);
const MAX_VIRTUAL_ITEM_COUNT = 100_000;
const MAX_VIRTUAL_ITEM_COUNT_BIGINT = BigInt(MAX_VIRTUAL_ITEM_COUNT);
const EMPTY_METADATA_MAP = new Map<string, TokenMetadata>();

type TokenListAction = {
  label: string;
  onClick: (tokenId: bigint, metadata?: TokenMetadata) => void;
  getAriaLabel?: (tokenLabel: string) => string;
};

type TokenWindowEntry = {
  tokenId: bigint;
  decimalId: string;
};

export interface VirtualizedTokenListProps {
  readonly contractAddress?: `0x${string}`;
  readonly chain: SupportedChain | null;
  readonly ranges: TokenRange[];
  readonly scrollKey: string;
  readonly overscan?: number;
  readonly renderTokenExtra?: (tokenId: bigint, metadata?: TokenMetadata) => ReactNode;
  readonly action?: TokenListAction;
  readonly className?: string;
  readonly scrollContainerClassName?: string;
  readonly rowClassName?: string;
  readonly footerContent?: ReactNode;
  readonly footerClassName?: string;
  readonly emptyState?: ReactNode;
  readonly onEndReached?: (info: { lastVisibleIndex: number; totalCount: number }) => void;
  readonly endReachedOffset?: number;
  readonly layout?: "list" | "grid";
  readonly columns?: number;
  readonly collectionName?: string;
}

function getTotalCount(ranges: TokenRange[]): number {
  let total = BIGINT_ZERO;
  for (const range of ranges) {
    const size = range.end - range.start + BIGINT_ONE;
    total += size;
    if (total >= MAX_VIRTUAL_ITEM_COUNT_BIGINT) {
      return MAX_VIRTUAL_ITEM_COUNT;
    }
  }
  return Number(total);
}

function toDecimalString(value: bigint): string {
  return value.toString(10);
}

export function VirtualizedTokenList({
  contractAddress,
  chain,
  ranges,
  scrollKey,
  overscan,
  renderTokenExtra,
  action,
  className,
  scrollContainerClassName,
  rowClassName,
  footerContent,
  footerClassName,
  emptyState = <div className="tw-text-sm tw-text-iron-300">No tokens available.</div>,
  onEndReached,
  endReachedOffset,
  layout = "list",
  columns = 3,
  collectionName,
}: Readonly<VirtualizedTokenListProps>) {
  const totalCount = useMemo(() => getTotalCount(ranges), [ranges]);

  return (
    <VirtualizedTokenListContent
      key={scrollKey}
      contractAddress={contractAddress}
      chain={chain}
      ranges={ranges}
      scrollKey={scrollKey}
      totalCount={totalCount}
      overscan={overscan}
      renderTokenExtra={renderTokenExtra}
      action={action}
      className={className}
      scrollContainerClassName={scrollContainerClassName}
      rowClassName={rowClassName}
      footerContent={footerContent}
      footerClassName={footerClassName}
      onEndReached={onEndReached}
      endReachedOffset={endReachedOffset}
      emptyState={emptyState}
      layout={layout}
      columns={columns}
      collectionName={collectionName}
    />
  );
}

type VirtualizedTokenListContentProps = Readonly<
  Omit<VirtualizedTokenListProps, "emptyState"> & { totalCount: number; emptyState: ReactNode; collectionName?: string }
>;

function VirtualizedTokenListContent({
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
  collectionName,
}: VirtualizedTokenListContentProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const initialOffset = usePersistentScrollOffset(scrollKey, scrollContainerRef);

  const isGrid = layout === "grid";
  const rowCount = isGrid ? Math.ceil(totalCount / columns) : totalCount;
  const rowHeight = isGrid ? GRID_ROW_HEIGHT : ROW_HEIGHT;

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => rowHeight,
    overscan,
    initialOffset,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const { firstVisibleIndex, lastVisibleIndex } = getVisibleWindowBounds(virtualItems);

  // Calculate token indices based on row indices
  const firstTokenIndex = isGrid ? firstVisibleIndex * columns : firstVisibleIndex;
  const lastTokenIndex = isGrid
    ? Math.min((lastVisibleIndex + 1) * columns - 1, totalCount - 1)
    : lastVisibleIndex;

  const windowTokens = useVisibleTokenWindow(ranges, firstTokenIndex, lastTokenIndex);

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
  }, [onEndReached, totalCount, lastVisibleIndex, overscan, endReachedOffset, rowCount, lastTokenIndex]);

  if (totalCount === 0) {
    return (
      <>
        <div ref={scrollContainerRef} aria-hidden="true" className="tw-hidden" />
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
                const windowIndex = tokenIndex - firstTokenIndex;
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
                  collectionName={collectionName}
                />
              );
            }

            // List layout
            const windowIndex = rowIndex - firstVisibleIndex;
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

function usePersistentScrollOffset(
  scrollKey: string,
  scrollContainerRef: RefObject<HTMLDivElement | null>
): number {
  const { getPosition, setPosition } = useScrollPositionContext();
  const [initialOffset] = useState(() => getPosition(scrollKey));

  const persistScrollPosition = useEffectEvent(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    setPosition(scrollKey, container.scrollTop);
  });

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }

    const handleScroll = () => {
      persistScrollPosition();
    };

    container.addEventListener("scroll", handleScroll);
    return () => {
      persistScrollPosition();
      container.removeEventListener("scroll", handleScroll);
    };
  }, [persistScrollPosition, scrollKey]);

  return initialOffset;
}

function getVisibleWindowBounds(virtualItems: Array<{ index: number }>) {
  if (virtualItems.length === 0) {
    return { firstVisibleIndex: 0, lastVisibleIndex: -1 };
  }

  const firstVisibleIndex = virtualItems[0].index;
  const lastItem = virtualItems.at(-1)!;
  const lastVisibleIndex = lastItem.index;

  return { firstVisibleIndex, lastVisibleIndex };
}

function useVisibleTokenWindow(
  ranges: TokenRange[],
  firstTokenIndex: number,
  lastTokenIndex: number
): TokenWindowEntry[] {
  return useMemo(() => {
    if (lastTokenIndex < firstTokenIndex) {
      return [];
    }

    const windowSize = lastTokenIndex - firstTokenIndex + 1;
    return expandRangesWindow(ranges, firstTokenIndex, windowSize).map((tokenId) => ({
      tokenId,
      decimalId: toDecimalString(tokenId),
    }));
  }, [ranges, firstTokenIndex, lastTokenIndex]);
}

type TokenMetadataWindowParams = Readonly<{
  contractAddress?: `0x${string}`;
  chain: SupportedChain | null;
  windowTokens: TokenWindowEntry[];
}>;

function useTokenMetadataWindow({
  contractAddress,
  chain,
  windowTokens,
}: TokenMetadataWindowParams) {
  const decimalTokenIds = useMemo(
    () => windowTokens.map((token) => token.decimalId),
    [windowTokens]
  );
  const canLoadMetadata = Boolean(
    contractAddress &&
    chain &&
    decimalTokenIds.length > 0
  );

  const metadataQuery = useTokenMetadataQuery({
    address: contractAddress,
    chain: chain ?? undefined,
    tokenIds: decimalTokenIds,
    enabled: canLoadMetadata,
  });

  const metadataMap = useMemo(() => {
    if (!canLoadMetadata) {
      return EMPTY_METADATA_MAP;
    }

    const entries = metadataQuery.data ?? [];
    if (!entries.length) {
      return EMPTY_METADATA_MAP;
    }

    const map = new Map<string, TokenMetadata>();
    for (const entry of entries) {
      // Store by raw and decimal string IDs to support either lookup format
      map.set(entry.tokenIdRaw, entry);
      map.set(entry.tokenId.toString(10), entry);
    }
    return map;
  }, [metadataQuery.data, canLoadMetadata]);

  return { metadataQuery, metadataMap };
}

type TokenRowProps = Readonly<{
  token: TokenWindowEntry;
  metadata?: TokenMetadata;
  rowClassName?: string;
  renderTokenExtra?: (tokenId: bigint, metadata?: TokenMetadata) => ReactNode;
  action?: TokenListAction;
  isMetadataLoading: boolean;
  hasMetadataError: boolean;
  positionStyle: CSSProperties;
}>;

function TokenRow({
  token,
  metadata,
  rowClassName,
  renderTokenExtra,
  action,
  isMetadataLoading,
  hasMetadataError,
  positionStyle,
}: Readonly<TokenRowProps>) {
  return (
    <li
      className={clsx(
        "tw-absolute tw-flex tw-w-full tw-items-center tw-gap-3 tw-px-3 tw-py-2",
        rowClassName
      )}
      style={positionStyle}
    >
      <div className="tw-h-10 tw-w-10">
        <TokenThumbnail
          metadata={metadata}
          decimalId={token.decimalId}
          isLoading={isMetadataLoading}
          hasError={hasMetadataError}
        />
      </div>
      <div className="tw-flex tw-flex-1 tw-items-center tw-justify-between tw-gap-4">
        <div className="tw-flex tw-flex-col tw-gap-0.5">
          <span className="tw-text-sm tw-font-medium tw-text-white">#{token.decimalId}</span>
          {metadata?.name && <span className="tw-text-xs tw-text-iron-400">{metadata.name}</span>}
        </div>
        {renderTokenExtra?.(token.tokenId, metadata)}
        {action ? (
          <button
            type="button"
            className="tw-rounded tw-border tw-border-iron-700 tw-bg-transparent tw-px-2 tw-py-1.5 tw-text-xs tw-text-iron-200 hover:tw-border-primary-500 hover:tw-text-white"
            onClick={() => action.onClick(token.tokenId, metadata)}
            aria-label={action.getAriaLabel?.(`#${token.decimalId}`) ?? action.label}
          >
            {action.label}
          </button>
        ) : null}
      </div>
    </li>
  );
}

type GridRowProps = Readonly<{
  tokens: TokenWindowEntry[];
  metadataMap: Map<string, TokenMetadata>;
  metadataQuery: any;
  renderTokenExtra?: (tokenId: bigint, metadata?: TokenMetadata) => ReactNode;
  action?: TokenListAction;
  positionStyle: CSSProperties;
  columns: number;
  collectionName?: string;
}>;

function GridRow({
  tokens,
  metadataMap,
  metadataQuery,
  renderTokenExtra,
  action,
  positionStyle,
  columns,
  collectionName,
}: GridRowProps) {
  return (
    <li
      className="tw-absolute tw-grid tw-w-full tw-gap-3 tw-px-3 tw-py-2"
      style={{
        ...positionStyle,
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
      }}
    >
      {tokens.map((token) => {
        const metadata = metadataMap.get(token.decimalId);
        const isLoadingMetadata = metadataQuery.isFetching && !metadata;
        const hasMetadataError = metadataQuery.isError && !metadata;

        return (
          <div
            key={token.decimalId}
            className="tw-flex tw-flex-col tw-rounded-lg tw-bg-iron-950 tw-border tw-border-iron-800 tw-overflow-hidden"
          >
            <div className="tw-aspect-square tw-w-full tw-overflow-hidden tw-bg-iron-900">
              <TokenThumbnail
                metadata={metadata}
                decimalId={token.decimalId}
                isLoading={isLoadingMetadata}
                hasError={hasMetadataError}
              />
            </div>
            <div className="tw-flex tw-flex-col tw-p-3 tw-gap-3">
              <div className="tw-flex tw-items-center tw-justify-between tw-text-xs tw-text-iron-400">
                <span className="tw-truncate">{collectionName ?? "Collection"}</span>
                <span className="tw-font-mono">#{token.decimalId}</span>
              </div>

              <div className="tw-flex tw-items-center tw-justify-between tw-gap-2">
                <div className="tw-font-medium tw-text-white tw-truncate">
                  {metadata?.name ?? `Token #${token.decimalId}`}
                </div>
                <div className="tw-flex tw-gap-1 tw-text-xs tw-shrink-0">
                  <span className="tw-text-iron-400">TDH</span>
                  <span className="tw-text-white">4,756</span>
                </div>
              </div>
            </div>

            {renderTokenExtra?.(token.tokenId, metadata)}
            {action ? (
              <div className="tw-p-3 tw-pt-0">
                <button
                  type="button"
                  className="tw-w-full tw-rounded tw-border tw-border-iron-700 tw-bg-transparent tw-px-2 tw-py-1.5 tw-text-xs tw-text-iron-200 hover:tw-border-primary-500 hover:tw-text-white"
                  onClick={() => action.onClick(token.tokenId, metadata)}
                  aria-label={action.getAriaLabel?.(`#${token.decimalId}`) ?? action.label}
                >
                  {action.label}
                </button>
              </div>
            ) : null}
          </div>
        );
      })}
    </li>
  );
}

type TokenThumbnailProps = Readonly<{
  metadata?: TokenMetadata;
  decimalId: string;
  isLoading: boolean;
  hasError: boolean;
}>;

function TokenThumbnail({ metadata, decimalId, isLoading, hasError }: Readonly<TokenThumbnailProps>) {
  let content: ReactNode;

  if (metadata?.imageUrl) {
    content = (
      <Image
        src={metadata.imageUrl}
        alt={metadata.name ?? decimalId}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        className="tw-h-full tw-w-full tw-object-cover"
      />
    );
  } else if (isLoading) {
    content = (
      <div
        aria-label="Loading thumbnail"
        aria-live="polite"
        className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center"
      >
        <Spinner />
      </div>
    );
  } else if (hasError) {
    content = (
      <div
        aria-label="Failed to load thumbnail"
        className="tw-flex tw-h-full tw-w-full tw-flex-col tw-items-center tw-justify-center tw-text-[10px] tw-font-medium tw-leading-tight tw-text-red-300"
      >
        <span>Load</span>
        <span>Error</span>
      </div>
    );
  } else {
    content = (
      <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-text-xs tw-text-iron-400">
        #{decimalId}
      </div>
    );
  }

  return (
    <div className="tw-relative tw-h-full tw-w-full tw-overflow-hidden tw-rounded-md tw-bg-iron-800">
      {content}
    </div>
  );
}
