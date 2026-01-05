import type { RefObject } from "react";
import type { Suggestion } from "../types";
import { NftSuggestItem } from "./NftSuggestItem";
import { NftSuggestSentinel } from "./NftSuggestSentinel";

interface VirtualItem {
  index: number;
  start: number;
  size: number;
}

interface VirtualizationResult {
  virtualItems: VirtualItem[];
  totalHeight: number;
  sentinelRef: RefObject<HTMLDivElement | null>;
}

interface NftSuggestVirtualListProps {
  readonly items: Suggestion[];
  readonly virtualization: VirtualizationResult;
  readonly activeIndex: number;
  readonly listContainerRef: RefObject<HTMLDivElement | null>;
  readonly onHover: (index: number) => void;
  readonly onSelect: (item: Suggestion) => void;
}

export function NftSuggestVirtualList({
  items,
  virtualization,
  activeIndex,
  listContainerRef,
  onHover,
  onSelect,
}: NftSuggestVirtualListProps) {
  const hasSuggestions = items.length > 0;

  return (
    <div
      ref={listContainerRef}
      style={{ height: virtualization.totalHeight, position: "relative" }}
    >
      <ul
        aria-hidden="true"
        className="tw-relative tw-m-0 tw-list-none tw-p-0"
        style={{ height: "100%" }}
      >
        {virtualization.virtualItems.map((virtual) => {
          if (virtual.index >= items.length) {
            return (
              <NftSuggestSentinel
                key="suggestions-sentinel"
                top={virtual.start}
                height={virtual.size}
                sentinelRef={virtualization.sentinelRef}
                hasSuggestions={hasSuggestions}
              />
            );
          }
          const suggestion = items[virtual.index];
          const isActive = virtual.index === activeIndex;
          const isDisabled = suggestion?.tokenType !== "ERC721";
          if (!suggestion) return null;
          return (
            <NftSuggestItem
              key={suggestion?.address}
              suggestion={suggestion}
              isActive={isActive}
              index={virtual.index}
              style={{ top: virtual.start, height: virtual.size }}
              onHover={onHover}
              onSelect={onSelect}
              disabled={isDisabled}
            />
          );
        })}
      </ul>
    </div>
  );
}
