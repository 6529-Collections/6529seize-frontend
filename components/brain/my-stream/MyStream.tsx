"use client"

import FeedWrapper from "../feed/FeedWrapper";
import { TypedFeedItem } from "../../../types/feed.types";
import { ActiveDropState } from "../../../types/dropInteractionTypes";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { DropInteractionParams } from "../../waves/drops/Drop";
import { useSetStreamHasNewItems } from "../../../contexts/TitleContext";
import { useMemo } from "react";
import SpinnerLoader from "../../common/SpinnerLoader";
import { useLayout } from "./layout/LayoutContext";

interface MyStreamProps {
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly activeDrop: ActiveDropState | null;
  readonly items: TypedFeedItem[];
  readonly isFetching: boolean;
  readonly onBottomIntersection: (state: boolean) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
  readonly haveNewItems?: boolean;
  readonly status?: string;
  readonly isInitialQueryDone?: boolean;
}

export default function MyStream({
  onReply,
  onQuote,
  activeDrop,
  items,
  isFetching,
  onBottomIntersection,
  onDropContentClick,
  haveNewItems = false,
  status = "success",
  isInitialQueryDone = true,
}: MyStreamProps) {
  const { myStreamFeedStyle } = useLayout();
  // Compute whether stream has new items
  const hasNewItems = useMemo(() => 
    status !== "pending" && isInitialQueryDone && haveNewItems,
    [status, isInitialQueryDone, haveNewItems]
  );
  
  // Update stream new items status in title context
  useSetStreamHasNewItems(hasNewItems);
  const showLoader = !isInitialQueryDone && items.length === 0;

  return (
    <div className="tw-h-full">
      {showLoader ? (
        <div
          className="tw-relative tw-flex tw-flex-col tw-rounded-t-xl"
          style={myStreamFeedStyle}
        >
          <SpinnerLoader text="Loading My Feed..." />
        </div>
      ) : (
        <FeedWrapper
          items={items}
          loading={isFetching}
          showWaveInfo={true}
          activeDrop={activeDrop}
          onBottomIntersection={onBottomIntersection}
          onReply={onReply}
          onQuote={onQuote}
          onDropContentClick={onDropContentClick}
        />
      )}
    </div>
  );
}
