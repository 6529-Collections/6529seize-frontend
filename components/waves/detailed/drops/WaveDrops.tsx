import { useCallback, useContext, useEffect, useRef, useState } from "react";
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
  readonly initialDrop: number | null;
}

export default function WaveDrops({
  wave,
  onReply,
  onQuote,
  activeDrop,
  onActiveDropClick,
  initialDrop,
}: WaveDropsProps) {
  const { connectedProfile, setTitle } = useContext(AuthContext);
  const [scrollBehavior, setScrollBehavior] = useState<ScrollBehavior>(
    initialDrop ? "auto" : "smooth"
  );
  const [serialNo, setSerialNo] = useState<number | null>(initialDrop);
  const {
    drops,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetching,
    isFetchingNextPage,
    isFetchingPreviousPage,
    haveNewDrops,
    resetQuery,
  } = useWaveDrops(wave, connectedProfile?.profile?.handle, serialNo);

  const {
    scrollContainerRef,
    isAtBottom,
    shouldScrollDownAfterNewPosts,
    scrollToBottom,
    handleScroll,
  } = useScrollBehavior();

  const targetDropRef = useRef<HTMLDivElement | null>(null);

  const scrollToSerialNo = useCallback(
    (behavior: ScrollBehavior) => {
      if (serialNo && targetDropRef.current) {
        targetDropRef.current.scrollIntoView({
          behavior: behavior,
          block: "center",
        });
        return true;
      }
      return false;
    },
    [serialNo, targetDropRef.current]
  );

  const [newItemsCount, setNewItemsCount] = useState(0);

  useEffect(() => {
    if (drops.length > 0) {
      setNewItemsCount((prevCount) => drops.length - prevCount);
    }
  }, [drops]);

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

  const [init, setInit] = useState(false);

  useEffect(() => {
    if (init) {
      return;
    }
    setInit(true);
    if (serialNo) {
      return;
    }
    scrollToBottom();
    const timeoutId = setTimeout(() => handleScroll(), 100);
    return () => clearTimeout(timeoutId);
  }, [scrollToBottom, handleScroll, serialNo, init]);

  useEffect(() => {
    console.log(drops.length);
    if (drops.length > 0 && serialNo) {
      const timeoutId = setTimeout(() => {
        const success = scrollToSerialNo(scrollBehavior);
        if (success) {
          setSerialNo(null);
          setScrollBehavior("smooth");
        } else {
          setScrollBehavior("auto");
          resetQuery();
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [drops, serialNo, scrollToSerialNo]);

  return (
    <div className="tw-flex tw-flex-col tw-h-[calc(100vh-15rem)] lg:tw-h-[calc(100vh-12.5rem)] tw-relative">
      <WaveDropsScrollContainer
        ref={scrollContainerRef}
        onScroll={handleScroll}
        newItemsCount={newItemsCount}
        onTopIntersection={() => {
          if (hasNextPage && !isFetching && !isFetchingNextPage) {
            console.log("fetching next page - scrolling up");
            fetchNextPage();
          }
        }}
        onBottomIntersection={() => {
          if (hasPreviousPage && !isFetching && !isFetchingPreviousPage) {
            console.log("fetching previous page - scrolling down");
            fetchPreviousPage();
          }
        }}
      >
        <div className="tw-divide-y-2 tw-divide-iron-700 tw-divide-solid tw-divide-x-0">
          <DropsList
            onReplyClick={setSerialNo}
            onActiveDropClick={onActiveDropClick}
            drops={drops}
            showWaveInfo={false}
            isFetchingNextPage={isFetchingNextPage}
            isFetchingPreviousPage={isFetchingPreviousPage}
            onReply={onReply}
            onQuote={onQuote}
            showReplyAndQuote={true}
            activeDrop={activeDrop}
            serialNo={serialNo}
            targetDropRef={targetDropRef}
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
