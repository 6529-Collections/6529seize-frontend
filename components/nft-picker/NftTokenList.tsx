"use client";

import Image from "next/image";
import { useMemo, useRef } from "react";
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
import { useVirtualizedWaves } from "@/hooks/useVirtualizedWaves";

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

function getTotalCount(ranges: TokenRange[]): number {
  let total = 0;
  for (const range of ranges) {
    const size = Number(range.end - range.start + 1n);
    if (!Number.isFinite(size)) {
      return Number.MAX_SAFE_INTEGER;
    }
    total += size;
    if (total >= Number.MAX_SAFE_INTEGER) {
      return Number.MAX_SAFE_INTEGER;
    }
  }
  return total;
}

function resolveTokenIdAtIndex(ranges: TokenRange[], index: number): bigint | null {
  let cursor = 0n;
  const target = BigInt(index);
  for (const range of ranges) {
    const size = range.end - range.start + 1n;
    const rangeEnd = cursor + size;
    if (target < rangeEnd) {
      const offset = target - cursor;
      return range.start + offset;
    }
    cursor = rangeEnd;
  }
  return null;
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
  const listContainerRef = useRef<HTMLDivElement>(null);

  const indexes = useMemo(() => {
    return Array.from({ length: totalCount }, (_, index) => index);
  }, [totalCount]);

  const virtualization = useVirtualizedWaves<number>(
    indexes,
    "nft-picker-token-list",
    scrollContainerRef,
    listContainerRef,
    ROW_HEIGHT,
    overscan
  );

  const visibleRange = useMemo(() => {
    const visibleItems = virtualization.virtualItems.filter(
      (item) => item.index < totalCount
    );
    if (visibleItems.length === 0) {
      return { start: 0, count: 0 };
    }
    const start = Math.max(
      visibleItems.reduce((min, item) => Math.min(min, item.index), totalCount),
      0
    );
    const end = visibleItems.reduce(
      (max, item) => Math.max(max, item.index),
      start
    );
    return { start, count: end - start + 1 };
  }, [virtualization.virtualItems, totalCount]);

  const windowTokenIds = useMemo(() => {
    if (visibleRange.count <= 0) {
      return [] as bigint[];
    }
    return expandRangesWindow(ranges, visibleRange.start, visibleRange.count);
  }, [ranges, visibleRange]);

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
    <div
      ref={scrollContainerRef}
      className="tw-max-h-80 tw-overflow-y-auto tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-900"
      role="grid"
      aria-label="Selected tokens"
    >
      <div
        ref={listContainerRef}
        style={{ height: virtualization.totalHeight, position: "relative" }}
      >
        {virtualization.virtualItems.map((virtualItem) => {
          if (virtualItem.index >= totalCount) {
            return (
              <div
                key="token-sentinel"
                ref={virtualization.sentinelRef}
                style={{
                  position: "absolute",
                  top: virtualItem.start,
                  height: virtualItem.size,
                  width: "100%",
                }}
              />
            );
          }
          const tokenId = resolveTokenIdAtIndex(ranges, virtualItem.index);
          if (tokenId === null) {
            return null;
          }
          const decimalId = toDecimalString(tokenId);
          const metadata = metadataMap.get(decimalId);
          return (
            <div
              key={decimalId}
              className="tw-absolute tw-flex tw-w-full tw-items-center tw-gap-3 tw-px-3 tw-py-2"
              style={{ top: virtualItem.start, height: virtualItem.size }}
              role="row"
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
      <div className="tw-border-t tw-border-iron-700 tw-px-3 tw-py-2 tw-text-xs tw-text-iron-400">
        {formatCanonical(ranges)}
      </div>
    </div>
  );
}
