"use client";

import type { DropInteractionParams } from "@/components/waves/drops/Drop";
import { useSetStreamHasNewItems } from "@/contexts/TitleContext";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { TypedFeedItem } from "@/types/feed.types";
import { useMemo } from "react";
import SpinnerLoader from "../../common/SpinnerLoader";
import FeedWrapper from "../feed/FeedWrapper";
import { useLayout } from "./layout/LayoutContext";

interface MyStreamProps {
  readonly onReply: (param: DropInteractionParams) => void;
  readonly onQuote: (param: DropInteractionParams) => void;
  readonly activeDrop: ActiveDropState | null;
  readonly items: TypedFeedItem[];
  readonly isFetching: boolean;
  readonly onBottomIntersection: (state: boolean) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly haveNewItems?: boolean | undefined;
  readonly status?: string | undefined;
  readonly isInitialQueryDone?: boolean | undefined;
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
  const hasNewItems = useMemo(
    () => status !== "pending" && isInitialQueryDone && haveNewItems,
    [status, isInitialQueryDone, haveNewItems]
  );

  // Update stream new items status in title context
  useSetStreamHasNewItems(hasNewItems);
  const showLoader = (!isInitialQueryDone || isFetching) && items.length === 0;

  return (
    <div className="tw-h-full">
      {showLoader ? (
        <div
          className="tw-relative tw-flex tw-flex-col tw-rounded-t-xl"
          style={myStreamFeedStyle}
        >
          <SpinnerLoader text="Loading My Stream..." />
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
