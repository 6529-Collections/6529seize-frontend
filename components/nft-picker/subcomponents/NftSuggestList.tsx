import { useRef, useEffect } from "react";

import type { Suggestion } from "../types";
import { useVirtualizedWaves } from "@/hooks/useVirtualizedWaves";
import { NftSuggestHiddenSelect } from "./NftSuggestHiddenSelect";
import { NftSuggestVirtualList } from "./NftSuggestVirtualList";
import { NftSuggestFooter } from "./NftSuggestFooter";

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
    OVERSCAN,
    isOpen
  );

  useEffect(() => {
    if (activeIndex >= 0 && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const itemTop = activeIndex * ROW_HEIGHT;
      const itemBottom = itemTop + ROW_HEIGHT;
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.clientHeight;

      if (itemTop < containerTop) {
        container.scrollTop = itemTop;
      } else if (itemBottom > containerBottom) {
        container.scrollTop = itemBottom - container.clientHeight;
      }
    }
  }, [activeIndex]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={scrollContainerRef}
      className="tw-absolute tw-left-0 tw-right-0 tw-top-full tw-z-20 tw-mt-2 tw-max-h-80 tw-overflow-y-auto tw-rounded-xl tw-border tw-border-solid tw-border-iron-900 tw-bg-iron-950 tw-py-2 tw-shadow-2xl tw-ring-1 tw-ring-black/50 tw-scrollbar-thin tw-scrollbar-thumb-iron-700 tw-scrollbar-track-iron-900 desktop-hover:hover:tw-scrollbar-thumb-iron-600"
    >
      {/* 
        We render two lists:
        1. NftSuggestHiddenSelect: A hidden native <select> for accessibility (screen readers).
        2. NftSuggestVirtualList: The visible, virtualized list for sighted users.
      */}
      <NftSuggestHiddenSelect items={items} onSelect={onSelect} />

      <NftSuggestVirtualList
        items={items}
        virtualization={virtualization}
        activeIndex={activeIndex}
        listContainerRef={listContainerRef}
        onHover={onHover}
        onSelect={onSelect}
      />

      {hideSpam && (
        <NftSuggestFooter hiddenCount={hiddenCount} onToggleSpam={onToggleSpam} />
      )}
    </div>
  );
}
