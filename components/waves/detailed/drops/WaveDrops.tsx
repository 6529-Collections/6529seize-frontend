import { useContext, useEffect, useState } from "react";
import { AuthContext, TitleType } from "../../../auth/Auth";
import { Wave } from "../../../../generated/models/Wave";
import { Drop } from "../../../../generated/models/Drop";
import { ActiveDropState } from "../WaveDetailedContent";
import DropsList from "../../../drops/view/DropsList";
import { WaveDropsScrollBottomButton } from "./WaveDropsScrollBottomButton";
import { WaveDropsScrollContainer } from "./WaveDropsScrollContainer";
import { useWaveDrops } from "../../../../hooks/useWaveDrops";
import { useScrollBehavior } from "../../../../hooks/useScrollBehavior";

interface WaveDropsProps {
  readonly wave: Wave;
  readonly onReply: ({ drop, partId }: { drop: Drop; partId: number }) => void;
  readonly onQuote: ({ drop, partId }: { drop: Drop; partId: number }) => void;
  readonly activeDrop: ActiveDropState | null;
  readonly onActiveDropClick?: () => void;
}

export default function WaveDrops({
  wave,
  onReply,
  onQuote,
  activeDrop,
  onActiveDropClick,
}: WaveDropsProps) {
  const { connectedProfile, setTitle } = useContext(AuthContext);
  const {
    drops,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    haveNewDrops,
  } = useWaveDrops(wave, connectedProfile?.profile?.handle);

  useEffect(() => console.log(drops.length), [drops]);

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
    <div className="tw-flex tw-flex-col tw-h-[calc(100vh-15rem)] lg:tw-h-[calc(100vh-12.5rem)] tw-relative">
      <WaveDropsScrollContainer
        ref={scrollContainerRef}
        onScroll={handleScroll}
      >
        <div className="tw-divide-y-2 tw-divide-iron-700 tw-divide-solid tw-divide-x-0">

          <DropsList
            onActiveDropClick={onActiveDropClick}
            drops={drops}
            showWaveInfo={false}
            isFetchingNextPage={isFetchingNextPage}
            onIntersection={(state) => {
              if (state && hasNextPage && !isFetching && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onReply={onReply}
            onQuote={onQuote}
            showReplyAndQuote={true}
            activeDrop={activeDrop}
          />
        </div>
      </WaveDropsScrollContainer>

      <WaveDropsScrollBottomButton
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
      />
    </div>
  );
}
