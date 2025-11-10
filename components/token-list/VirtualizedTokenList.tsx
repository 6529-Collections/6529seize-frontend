"use client";

import Image from "next/image";
import clsx from "clsx";
import type { CSSProperties, ReactNode, RefObject } from "react";
import { useEffect, useEffectEvent, useMemo, useRef } from "react";
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
  readonly chain: SupportedChain;
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
  overscan = DEFAULT_OVERSCAN,
  renderTokenExtra,
  action,
  className = "tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-900",
  scrollContainerClassName = "tw-max-h-80 tw-overflow-y-auto",
  rowClassName,
  footerContent,
  footerClassName = "tw-border-t tw-border-iron-700 tw-px-3 tw-py-2 tw-text-xs tw-text-iron-400",
  emptyState = <div className="tw-text-sm tw-text-iron-300">No tokens available.</div>,
}: Readonly<VirtualizedTokenListProps>) {
  if (!ranges.length) {
    return emptyState;
  }

  const totalCount = useMemo(() => getTotalCount(ranges), [ranges]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const initialOffset = usePersistentScrollOffset(scrollKey, scrollContainerRef);

  const virtualizer = useVirtualizer({
    count: totalCount,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan,
    initialOffset,
  });

  const virtualItems = virtualizer.getVirtualItems();
  const { firstVisibleIndex, lastVisibleIndex } = getVisibleWindowBounds(virtualItems);
  const windowTokens = useVisibleTokenWindow(ranges, firstVisibleIndex, lastVisibleIndex);
  const { metadataMap, metadataQuery } = useTokenMetadataWindow({
    contractAddress,
    chain,
    windowTokens,
  });

  return (
    <div className={className}>
      <div ref={scrollContainerRef} className={scrollContainerClassName}>
        <ul
          aria-label="Selected tokens"
          className="tw-relative tw-m-0 tw-list-none tw-p-0"
          style={{ height: virtualizer.getTotalSize(), position: "relative" }}
        >
          {virtualItems.map((virtualItem) => {
            const windowIndex = virtualItem.index - firstVisibleIndex;
            const token = windowTokens[windowIndex];
            if (!token) {
              return null;
            }

            const metadata = metadataMap.get(token.decimalId);
            const isLoadingMetadata = metadataQuery.isFetching && !metadata;

            return (
              <TokenRow
                key={token.decimalId}
                token={token}
                metadata={metadata}
                rowClassName={rowClassName}
                renderTokenExtra={renderTokenExtra}
                action={action}
                isMetadataLoading={isLoadingMetadata}
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
  scrollContainerRef: RefObject<HTMLDivElement>
): number {
  const { getPosition, setPosition } = useScrollPositionContext();
  const initialOffsetRef = useRef<number | null>(null);

  if (initialOffsetRef.current === null) {
    initialOffsetRef.current = getPosition(scrollKey);
  }

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

  return initialOffsetRef.current ?? 0;
}

function getVisibleWindowBounds(virtualItems: Array<{ index: number }>) {
  if (virtualItems.length === 0) {
    return { firstVisibleIndex: 0, lastVisibleIndex: -1 };
  }

  const firstVisibleIndex = virtualItems[0].index;
  const lastVisibleIndex = virtualItems[virtualItems.length - 1].index;

  return { firstVisibleIndex, lastVisibleIndex };
}

function useVisibleTokenWindow(
  ranges: TokenRange[],
  firstVisibleIndex: number,
  lastVisibleIndex: number
): TokenWindowEntry[] {
  return useMemo(() => {
    if (lastVisibleIndex < firstVisibleIndex) {
      return [];
    }

    const windowSize = lastVisibleIndex - firstVisibleIndex + 1;
    return expandRangesWindow(ranges, firstVisibleIndex, windowSize).map((tokenId) => ({
      tokenId,
      decimalId: toDecimalString(tokenId),
    }));
  }, [ranges, firstVisibleIndex, lastVisibleIndex]);
}

type TokenMetadataWindowParams = {
  contractAddress?: `0x${string}`;
  chain: SupportedChain;
  windowTokens: TokenWindowEntry[];
};

function useTokenMetadataWindow({
  contractAddress,
  chain,
  windowTokens,
}: TokenMetadataWindowParams) {
  const decimalTokenIds = useMemo(
    () => windowTokens.map((token) => token.decimalId),
    [windowTokens]
  );

  const metadataQuery = useTokenMetadataQuery({
    address: contractAddress,
    chain,
    tokenIds: decimalTokenIds,
    enabled: Boolean(contractAddress) && decimalTokenIds.length > 0,
  });

  const metadataMap = useMemo(() => {
    const entries = metadataQuery.data ?? [];
    if (!entries.length) {
      return EMPTY_METADATA_MAP;
    }

    const map = new Map<string, TokenMetadata>();
    for (const entry of entries) {
      map.set(entry.tokenIdRaw, entry);
      map.set(entry.tokenId.toString(10), entry);
    }
    return map;
  }, [metadataQuery.data]);

  return { metadataQuery, metadataMap };
}

type TokenRowProps = {
  token: TokenWindowEntry;
  metadata?: TokenMetadata;
  rowClassName?: string;
  renderTokenExtra?: (tokenId: bigint, metadata?: TokenMetadata) => ReactNode;
  action?: TokenListAction;
  isMetadataLoading: boolean;
  positionStyle: CSSProperties;
};

function TokenRow({
  token,
  metadata,
  rowClassName,
  renderTokenExtra,
  action,
  isMetadataLoading,
  positionStyle,
}: TokenRowProps) {
  return (
    <li
      className={clsx(
        "tw-absolute tw-flex tw-w-full tw-items-center tw-gap-3 tw-px-3 tw-py-2",
        rowClassName
      )}
      style={positionStyle}
    >
      <TokenThumbnail metadata={metadata} decimalId={token.decimalId} isLoading={isMetadataLoading} />
      <div className="tw-flex tw-flex-1 tw-items-center tw-justify-between tw-gap-4">
        <div className="tw-flex tw-flex-col tw-gap-0.5">
          <span className="tw-text-sm tw-font-medium tw-text-white">#{token.decimalId}</span>
          {metadata?.name && <span className="tw-text-xs tw-text-iron-400">{metadata.name}</span>}
        </div>
        {renderTokenExtra?.(token.tokenId, metadata)}
        {action ? (
          <button
            type="button"
            className="tw-rounded tw-border tw-border-iron-700 tw-bg-transparent tw-px-2 tw-py-1 tw-text-xs tw-text-iron-200 hover:tw-border-primary-500 hover:tw-text-white"
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

type TokenThumbnailProps = {
  metadata?: TokenMetadata;
  decimalId: string;
  isLoading: boolean;
};

function TokenThumbnail({ metadata, decimalId, isLoading }: TokenThumbnailProps) {
  let content: ReactNode;

  if (metadata?.imageUrl) {
    content = (
      <Image
        src={metadata.imageUrl}
        alt={metadata.name ?? decimalId}
        fill
        sizes="40px"
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
  } else {
    content = (
      <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-text-xs tw-text-iron-400">
        #{decimalId}
      </div>
    );
  }

  return (
    <div
      className="tw-relative tw-h-10 tw-w-10 tw-overflow-hidden tw-rounded-md tw-bg-iron-800"
      aria-hidden="true"
    >
      {content}
    </div>
  );
}
