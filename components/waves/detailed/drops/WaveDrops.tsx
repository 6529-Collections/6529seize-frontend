import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { AuthContext, TitleType } from "../../../auth/Auth";
import { Wave } from "../../../../generated/models/Wave";
import { Drop } from "../../../../generated/models/Drop";
import { ActiveDropState } from "../WaveDetailedContent";
import DropsList from "../../../drops/view/DropsList";
import { WaveDropsNewDropsAvailable } from "./WaveDropsNewDropsAvailable";
import { WaveDropsScrollBottomButton } from "./WaveDropsScrollBottomButton";
import WaveDropsThreadHeader from "./WaveDropsThread";
import { WaveDropsScrollContainer } from "./WaveDropsScrollContainer";
import { useWaveDrops } from "../../../../hooks/useWaveDrops";
import { useScrollBehavior } from "../../../../hooks/useScrollBehavior";


interface WaveDropsProps {
  readonly wave: Wave;
  readonly onReply: ({ drop, partId }: { drop: Drop; partId: number }) => void;
  readonly onQuote: ({ drop, partId }: { drop: Drop; partId: number }) => void;
  readonly activeDrop: ActiveDropState | null;
  readonly rootDropId: string | null;
  readonly onBackToList?: () => void;
}

export default function WaveDrops({
  wave,
  onReply,
  onQuote,
  activeDrop,
  rootDropId,
  onBackToList,
}: WaveDropsProps) {
  const { connectedProfile, setTitle } = useContext(AuthContext);
  const {
    drops,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    refetch,
    haveNewDrops,
  } = useWaveDrops(wave, rootDropId, connectedProfile?.profile?.handle);

  const {
    scrollContainerRef,
    isAtBottom,
    shouldScrollDownAfterNewPosts,
    scrollToBottom,
    handleScroll,
  } = useScrollBehavior();

  useEffect(() => {
    setTitle({
      title: haveNewDrops ? "New Drops Available | 6529 SEIZE" : null,
      type: TitleType.WAVE,
    });

    return () => {
      setTitle({
        title: null,
        type: TitleType.WAVE,
      });
    };
  }, [haveNewDrops]);

  useEffect(() => {
    if (shouldScrollDownAfterNewPosts) {
      scrollToBottom();
    }
  }, [drops, shouldScrollDownAfterNewPosts, scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
    const timeoutId = setTimeout(() => handleScroll(), 100);
    return () => clearTimeout(timeoutId);
  }, [scrollToBottom, handleScroll]);

  return (
    <div className="tw-flex tw-flex-col tw-h-[calc(100vh-16rem)] md:tw-h-[calc(100vh-13rem)] tw-relative">
      <WaveDropsNewDropsAvailable
        haveNewDrops={haveNewDrops}
        loading={isFetching}
        onRefresh={refetch}
      />
      <WaveDropsThreadHeader
        rootDropId={rootDropId}
        wave={wave}
        onBackToList={onBackToList}
      />
      <WaveDropsScrollContainer
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        <DropsList
          drops={drops}
          showWaveInfo={false}
          onIntersection={(state) => {
            if (state && hasNextPage && !isFetching && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onReply={onReply}
          onQuote={onQuote}
          showReplyAndQuote={true}
          activeDrop={activeDrop}
          rootDropId={rootDropId}
        />
      </WaveDropsScrollContainer>

      <WaveDropsScrollBottomButton
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
      />
    </div>
  );
}
