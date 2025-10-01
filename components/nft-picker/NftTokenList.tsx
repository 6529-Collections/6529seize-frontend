"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";

import type {
  SupportedChain,
  TokenMetadata,
  TokenRange,
} from "./NftPicker.types";
import {
  expandRangesWindow,
  formatCanonical,
} from "./NftPicker.utils";
import { useTokenMetadataQuery } from "./useAlchemyClient";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useScrollPositionContext } from "@/contexts/ScrollPositionContext";
import Spinner from "@/components/utils/Spinner";

interface NftTokenListProps {
  readonly contractAddress?: `0x${string}`;
  readonly chain: SupportedChain;
  readonly ranges: TokenRange[];
  readonly overscan?: number;
  readonly renderTokenExtra?: (tokenId: bigint, metadata?: TokenMetadata) => ReactNode;
  readonly onRemove: (tokenId: bigint) => void;
}

const ROW_HEIGHT = 72;
const DEFAULT_OVERSCAN = 8;
const BIGINT_ZERO = BigInt(0);
const BIGINT_ONE = BigInt(1);
const MAX_VIRTUAL_ITEM_COUNT = 100_000;
// Cap prevents virtualization container heights from becoming extreme.
const MAX_VIRTUAL_ITEM_COUNT_BIGINT = BigInt(MAX_VIRTUAL_ITEM_COUNT);
const VIRTUAL_SCROLL_KEY = "nft-picker-token-list";

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

export function NftTokenList({
  contractAddress,
  chain,
  ranges,
  overscan = DEFAULT_OVERSCAN,
  renderTokenExtra,
  onRemove,
}: NftTokenListProps) {
  const totalCount = getTotalCount(ranges);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { getPosition, setPosition } = useScrollPositionContext();
  const initialOffsetRef = useRef<number | null>(null);
  if (initialOffsetRef.current === null) {
    initialOffsetRef.current = getPosition(VIRTUAL_SCROLL_KEY);
  }

  const virtualizer = useVirtualizer({
    count: totalCount,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan,
    initialOffset: initialOffsetRef.current ?? 0,
  });

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return;
    }
    const handleScroll = () => {
      setPosition(VIRTUAL_SCROLL_KEY, container.scrollTop);
    };
    container.addEventListener("scroll", handleScroll);
    return () => {
      setPosition(VIRTUAL_SCROLL_KEY, container.scrollTop);
      container.removeEventListener("scroll", handleScroll);
    };
  }, [setPosition]);

  const virtualItems = virtualizer.getVirtualItems();
  const firstVisibleIndex = virtualItems.length > 0 ? virtualItems[0].index : 0;
  const lastVisibleIndex = virtualItems.length > 0
    ? virtualItems[virtualItems.length - 1].index
    : -1;

  const windowTokenIds = useMemo(() => {
    if (lastVisibleIndex < firstVisibleIndex) {
      return [] as bigint[];
    }
    return expandRangesWindow(
      ranges,
      firstVisibleIndex,
      lastVisibleIndex - firstVisibleIndex + 1
    );
  }, [ranges, firstVisibleIndex, lastVisibleIndex]);

  const metadataQuery = useTokenMetadataQuery({
    address: contractAddress,
    chain,
    tokenIds: windowTokenIds.map(toDecimalString),
    enabled: Boolean(contractAddress) && windowTokenIds.length > 0,
  });

  const metadataMap = useMemo(() => {
    const map = new Map<string, TokenMetadata>();
    (metadataQuery.data ?? []).forEach((entry) => {
      map.set(entry.tokenIdRaw, entry);
      map.set(entry.tokenId.toString(10), entry);
    });
    return map;
  }, [metadataQuery.data]);

  if (ranges.length === 0) {
    return (
      <div className="tw-text-sm tw-text-iron-300">No tokens selected.</div>
    );
  }

  return (
    <div className="tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-900">
      <div
        ref={scrollContainerRef}
        className="tw-max-h-80 tw-overflow-y-auto"
        role="list"
        aria-label="Selected tokens"
      >
        <div
          style={{ height: virtualizer.getTotalSize(), position: "relative" }}
          role="presentation"
        >
          {virtualItems.map((virtualItem) => {
            const windowIndex = virtualItem.index - firstVisibleIndex;
            const tokenId = windowTokenIds[windowIndex] ?? null;
            if (tokenId === null) {
              return null;
            }
            const decimalId = toDecimalString(tokenId);
            const metadata = metadataMap.get(decimalId);
            const isLoadingMetadata = metadataQuery.isFetching && !metadata;
            return (
              <div
                key={decimalId}
                className="tw-absolute tw-flex tw-w-full tw-items-center tw-gap-3 tw-px-3 tw-py-2"
                style={{
                  transform: `translateY(${virtualItem.start}px)`,
                  height: virtualItem.size,
                  width: "100%",
                }}
                role="listitem"
              >
                <div className="tw-relative tw-h-10 tw-w-10 tw-overflow-hidden tw-rounded-md tw-bg-iron-800" aria-hidden="true">
                  {metadata?.imageUrl ? (
                    <Image
                      src={metadata.imageUrl}
                      alt={metadata.name ?? decimalId}
                      fill
                      sizes="40px"
                      className="tw-h-full tw-w-full tw-object-cover"
                    />
                  ) : isLoadingMetadata ? (
                    <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center" role="status" aria-label="Loading thumbnail">
                      <Spinner />
                    </div>
                  ) : (
                    <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-text-xs tw-text-iron-400">
                      #{decimalId}
                    </div>
                  )}
                </div>
                <div className="tw-flex tw-flex-1 tw-items-center tw-justify-between tw-gap-4">
                  <div className="tw-flex tw-flex-col tw-gap-0.5">
                    <span className="tw-text-sm tw-font-medium tw-text-white">#{decimalId}</span>
                    {metadata?.name && (
                      <span className="tw-text-xs tw-text-iron-400">{metadata.name}</span>
                    )}
                  </div>
                  {renderTokenExtra?.(tokenId, metadata)}
                  <button
                    type="button"
                    className="tw-rounded tw-border tw-border-iron-700 tw-bg-transparent tw-px-2 tw-py-1 tw-text-xs tw-text-iron-200 hover:tw-border-primary-500 hover:tw-text-white"
                    onClick={() => onRemove(tokenId)}
                    aria-label={`Remove token ${decimalId}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="tw-border-t tw-border-iron-700 tw-px-3 tw-py-2 tw-text-xs tw-text-iron-400">
        {formatCanonical(ranges)}
      </div>
    </div>
  );
}
