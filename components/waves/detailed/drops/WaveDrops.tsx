import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AuthContext, TitleType } from "../../../auth/Auth";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import { ActiveDropState } from "../WaveDetailedContent";
import DropsList from "../../../drops/view/DropsList";
import { WaveDropsScrollBottomButton } from "./WaveDropsScrollBottomButton";
import { WaveDropsScrollContainer } from "./WaveDropsScrollContainer";
import { useWaveDrops } from "../../../../hooks/useWaveDrops";
import { useScrollBehavior } from "../../../../hooks/useScrollBehavior";
import CircleLoader, {
  CircleLoaderSize,
} from "../../../distribution-plan-tool/common/CircleLoader";
import { useRouter } from "next/router";

interface WaveDropsProps {
  readonly wave: ApiWave;
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
}

export default function WaveDrops({
  wave,
  onReply,
  onQuote,
  activeDrop,
  initialDrop,
}: WaveDropsProps) {
  const router = useRouter();
  const { connectedProfile, setTitle } = useContext(AuthContext);

  const [serialNo, setSerialNo] = useState<number | null>(initialDrop);
  const {
    drops,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    haveNewDrops,
  } = useWaveDrops(wave, connectedProfile?.profile?.handle);

  const {
    scrollContainerRef,
    isAtBottom,
    scrollToBottom,
    scrollToTop,
    handleScroll,
  } = useScrollBehavior();

  const targetDropRef = useRef<HTMLDivElement | null>(null);

  const [isScrolling, setIsScrolling] = useState(false);

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
    [serialNo]
  );

  const [newItemsCount, setNewItemsCount] = useState(0);

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

  const smallestSerialNo = useRef<number | null>(null);
  const [init, setInit] = useState(false);

  useEffect(() => {
    if (drops.length > 0) {
      setInit(true);
      setNewItemsCount((prevCount) => {
        const newCount = drops.length - prevCount;
        return prevCount !== newCount ? newCount : prevCount;
      });
      const minSerialNo = Math.min(...drops.map((drop) => drop.serial_no));
      smallestSerialNo.current = minSerialNo;
      const lastDrop = drops[drops.length - 1];
      if (lastDrop.id.startsWith("temp-")) {
        setSerialNo(lastDrop.serial_no);
      }
    } else {
      smallestSerialNo.current = null;
    }
  }, [drops]);

  const fetchAndScrollToDrop = useCallback(async () => {
    if (!serialNo) return;
    let found = false;
    setIsScrolling(true);

    const checkAndFetchNext = async () => {
      if (found || !hasNextPage || isFetching || isFetchingNextPage) {
        setIsScrolling(false);
        return;
      }
      await fetchNextPage();

      if (smallestSerialNo.current && smallestSerialNo.current <= serialNo) {
        found = true;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        scrollToSerialNo("smooth");
        setIsScrolling(false);
        setSerialNo(null);
      } else {
        scrollToTop();
        setTimeout(checkAndFetchNext, 1000);
      }
    };

    checkAndFetchNext();
  }, [
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    scrollToSerialNo,
    serialNo,
    setSerialNo,
    scrollToTop,
  ]);

  useEffect(() => {
    if (init && serialNo) {
      const success = scrollToSerialNo("smooth");
      if (success) {
        setSerialNo(null);
      } else {
        fetchAndScrollToDrop();
      }
    }
  }, [init, serialNo]);

  const handleTopIntersection = useCallback(() => {
    if (hasNextPage && !isFetching && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetching, isFetchingNextPage, fetchNextPage]);

  const onQuoteClick = useCallback(
    (drop: ApiDrop) => {
      if (drop.wave.id !== wave.id) {
        router.push(`/waves/${drop.wave.id}?drop=${drop.serial_no}`);
      } else {
        setSerialNo(drop.serial_no);
      }
    },
    [router, wave.id, setSerialNo]
  );

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
            onReplyClick={setSerialNo}
            drops={memoizedDrops}
            showWaveInfo={false}
            isFetchingNextPage={isFetchingNextPage}
            onReply={onReply}
            onQuote={onQuote}
            showReplyAndQuote={true}
            activeDrop={activeDrop}
            serialNo={serialNo}
            targetDropRef={targetDropRef}
            onQuoteClick={onQuoteClick}
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
            <div className="tw-bg-iron-800 tw-rounded-full tw-p-4">
              <CircleLoader size={CircleLoaderSize.XXLARGE} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
