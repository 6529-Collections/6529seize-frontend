"use client";

import clsx from "clsx";
import Image from "next/image";
import { useRef } from "react";

import DistributionPlanVerifiedIcon from "../distribution-plan-tool/common/DistributionPlanVerifiedIcon";
import type { Suggestion } from "./NftPicker.types";
import { useVirtualizedWaves } from "@/hooks/useVirtualizedWaves";

interface NftSuggestListProps {
  readonly items: Suggestion[];
  readonly activeIndex: number;
  readonly isOpen: boolean;
  readonly hiddenCount: number;
  readonly hideSpam: boolean;
  readonly onToggleSpam: () => void;
  readonly onHover: (index: number) => void;
  readonly onSelect: (item: Suggestion) => void;
}

const ROW_HEIGHT = 64;
const OVERSCAN = 6;

function shortenAddress(address: `0x${string}`): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function formatFloor(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return "—";
  }
  if (value >= 1) {
    return value.toFixed(2);
  }
  return value.toFixed(3);
}

export function NftSuggestList({
  items,
  activeIndex,
  isOpen,
  hiddenCount,
  hideSpam,
  onToggleSpam,
  onHover,
  onSelect,
}: NftSuggestListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  const virtualization = useVirtualizedWaves<Suggestion>(
    items,
    "nft-picker-suggestions",
    scrollContainerRef,
    listContainerRef,
    ROW_HEIGHT,
    OVERSCAN
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={scrollContainerRef}
      id="nft-picker-suggest-list"
      role="listbox"
      aria-label="NFT collections suggestions"
      className="tw-absolute tw-left-0 tw-right-0 tw-top-full tw-z-20 tw-mt-2 tw-max-h-80 tw-overflow-y-auto tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-900"
    >
      <div
        ref={listContainerRef}
        style={{ height: virtualization.totalHeight, position: "relative" }}
      >
        {virtualization.virtualItems.map((virtual) => {
          if (virtual.index >= items.length) {
            return (
              <div
                key="suggestions-sentinel"
                ref={virtualization.sentinelRef}
                style={{
                  position: "absolute",
                  top: virtual.start,
                  height: virtual.size,
                  width: "100%",
                }}
              />
            );
          }
          const suggestion = items[virtual.index];
          const isActive = virtual.index === activeIndex;
          return (
            <div
              key={suggestion.address}
              role="option"
              aria-selected={isActive}
              id={`nft-suggestion-${virtual.index}`}
              onMouseEnter={() => onHover(virtual.index)}
              onClick={() => onSelect(suggestion)}
              className={clsx(
                "tw-absolute tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-gap-3 tw-px-3 tw-py-2",
                isActive
                  ? "tw-bg-primary-500/20 tw-text-white"
                  : "tw-text-iron-200 hover:tw-bg-iron-800"
              )}
              style={{ top: virtual.start, height: virtual.size }}
            >
              <div className="tw-relative tw-h-10 tw-w-10">
                <div className="tw-h-full tw-w-full tw-overflow-hidden tw-rounded-md tw-bg-iron-800">
                  {suggestion.imageUrl ? (
                    <Image
                      src={suggestion.imageUrl}
                      alt={suggestion.name ?? suggestion.address}
                      fill
                      sizes="40px"
                      className="tw-h-full tw-w-full tw-object-cover"
                    />
                  ) : (
                    <div className="tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center tw-text-xs tw-text-iron-400">
                      NFT
                    </div>
                  )}
                </div>
                {suggestion.safelist === "verified" && (
                  <div className="tw-absolute tw-right-[-6px] tw-top-[-6px] tw-rounded-full tw-bg-iron-900 tw-p-0.5 tw-shadow-lg">
                    <DistributionPlanVerifiedIcon />
                  </div>
                )}
              </div>
              <div className="tw-flex tw-flex-1 tw-flex-col tw-gap-1">
                <span className="tw-text-sm tw-font-medium tw-text-white">
                  {suggestion.name ?? shortenAddress(suggestion.address)}
                </span>
                <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-text-xs tw-text-iron-400">
                  <span>{shortenAddress(suggestion.address)}</span>
                  {suggestion.tokenType && (
                    <span className="tw-rounded tw-bg-iron-800 tw-px-2 tw-py-0.5">
                      {suggestion.tokenType}
                    </span>
                  )}
                  <span>Ξ{formatFloor(suggestion.floorPriceEth)}</span>
                  {suggestion.totalSupply && <span>Supply {suggestion.totalSupply}</span>}
                  {suggestion.safelist === "verified" && (
                    <span className="tw-rounded tw-bg-green-500/20 tw-px-2 tw-py-0.5 tw-text-green-300">
                      Verified
                    </span>
                  )}
                  {suggestion.isSpam && (
                    <span className="tw-rounded tw-bg-amber-500/20 tw-px-2 tw-py-0.5 tw-text-amber-300">
                      Suspected spam
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {hideSpam && hiddenCount > 0 && (
        <div className="tw-border-t tw-border-iron-700 tw-px-3 tw-py-2 tw-text-xs tw-text-amber-300">
          Filtered suspected spam collections ({hiddenCount}).
          <button
            type="button"
            className="tw-ml-2 tw-text-primary-400 hover:tw-underline"
            onClick={onToggleSpam}
          >
            Show anyway
          </button>
        </div>
      )}
    </div>
  );
}
