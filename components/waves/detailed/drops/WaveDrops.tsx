import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import { AuthContext } from "../../../auth/Auth";
import { useWaveDropsLeaderboard } from "../../../../hooks/useWaveDropsLeaderboard";
import { ActiveDropState } from "../WaveDetailedContent";
import { WaveDropsScrollContainer } from "./WaveDropsScrollContainer";
import DropsList from "../../../drops/view/DropsList";
import { WaveDropsScrollBottomButton } from "./WaveDropsScrollBottomButton";
import CircleLoader, {
  CircleLoaderSize,
} from "../../../distribution-plan-tool/common/CircleLoader";
import { useScrollBehavior } from "../../../../hooks/useScrollBehavior";
import { WaveDetailedDropsSortBy } from "../WaveDetailed";

interface WaveDropsProps {
  readonly waveId: string;
  readonly onReply: ({
    drop,
    partId,
  }: {
    drop: ApiDrop;
    partId: number;
  }) => void;
  readonly onQuote: ({
    drop,
    partId,
  }: {
    drop: ApiDrop;
    partId: number;
  }) => void;
  readonly activeDrop: ActiveDropState | null;
  readonly initialDrop: number | null;
  readonly dropsSortBy: WaveDetailedDropsSortBy;
}

export default function WaveDrops({
  waveId,
  onReply,
  onQuote,
  activeDrop,
  initialDrop,
  dropsSortBy,
}: WaveDropsProps) {
  const { connectedProfile } = useContext(AuthContext);
  const {
    drops,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    haveNewDrops,
  } = useWaveDropsLeaderboard({
    waveId,
    connectedProfileHandle: connectedProfile?.profile?.handle,
    reverse: true,
    dropsSortBy,
    sortDirection: dropsSortBy === WaveDetailedDropsSortBy.RANK ? "ASC" : "DESC",
  });

  const {
    scrollContainerRef,
    isAtBottom,
    scrollToBottom,
    scrollToTop,
    handleScroll,
  } = useScrollBehavior();

  const [isScrolling, setIsScrolling] = useState(false);

  const [newItemsCount, setNewItemsCount] = useState(0);

  useEffect(() => {
    if (drops.length > 0) {
      setNewItemsCount((prevCount) => {
        const newCount = drops.length - prevCount;
        return prevCount !== newCount ? newCount : prevCount;
      });
    }
  }, [drops]);

  const handleTopIntersection = useCallback(() => {
    if (hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetching, isFetchingNextPage, fetchNextPage]);

  const memoizedDrops = useMemo(() => drops, [drops]);

  return (
    <div className="tw-flex tw-flex-col tw-relative tw-overflow-y-auto">
      <WaveDropsScrollContainer
        ref={scrollContainerRef}
        onScroll={handleScroll}
        newItemsCount={newItemsCount}
        isFetchingNextPage={isFetchingNextPage}
        onTopIntersection={handleTopIntersection}
      >
        <div className="tw-divide-y-2 tw-divide-iron-700 tw-divide-solid tw-divide-x-0">
          <DropsList
            onReplyClick={() => {}}
            drops={memoizedDrops}
            showWaveInfo={false}
            isFetchingNextPage={isFetchingNextPage}
            onReply={onReply}
            onQuote={onQuote}
            showReplyAndQuote={true}
            activeDrop={activeDrop}
            serialNo={null}
            targetDropRef={null}
            onQuoteClick={() => {}}
            parentContainerRef={scrollContainerRef}
          />
        </div>
      </WaveDropsScrollContainer>

      <WaveDropsScrollBottomButton
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
      />

      {isScrolling && (
        <>
          <div className="tw-absolute tw-inset-0 tw-bg-iron-900 tw-bg-opacity-50 tw-z-10" />
          <div className="tw-absolute tw-inset-0 tw-flex tw-flex-col tw-items-center tw-justify-center tw-z-20">
            <div className="tw-rounded-full tw-p-4">
              <CircleLoader size={CircleLoaderSize.XXLARGE} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
