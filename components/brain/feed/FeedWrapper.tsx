"use client";

import { useRef } from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { TypedFeedItem } from "@/types/feed.types";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { DropInteractionParams } from "@/components/waves/drops/Drop";
import FeedItems from "./FeedItems";
import { FeedScrollContainer } from "./FeedScrollContainer";
import { useLayout } from "../my-stream/layout/LayoutContext";

interface FeedWrapperProps {
  readonly items: TypedFeedItem[];
  readonly loading: boolean;
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly onBottomIntersection: (state: boolean) => void;
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
}

export default function FeedWrapper({
  items,
  loading,
  showWaveInfo,
  activeDrop,
  onBottomIntersection,
  onReply,
  onQuote,
  onDropContentClick,
}: FeedWrapperProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { myStreamFeedStyle } = useLayout();

  const handleScrollUpNearTop = () => {
    onBottomIntersection(true);
  };

  return (
    <div
      className="tw-relative tw-flex tw-flex-col tw-rounded-t-xl"
      style={myStreamFeedStyle}
    >
      <FeedScrollContainer
        ref={scrollRef}
        onScrollUpNearTop={handleScrollUpNearTop}
        isFetchingNextPage={loading}
        className="tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0 lg:tw-pr-2"
      >
        <FeedItems
          items={items}
          showWaveInfo={showWaveInfo}
          activeDrop={activeDrop}
          onReply={onReply}
          onQuote={onQuote}
          onDropContentClick={onDropContentClick}
        />
      </FeedScrollContainer>
    </div>
  );
}
