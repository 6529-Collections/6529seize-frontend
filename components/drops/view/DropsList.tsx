import { useMemo, RefObject, useCallback, memo } from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { ActiveDropState } from "../../../types/dropInteractionTypes";
import Drop, { DropLocation } from "../../waves/drops/Drop";
import VirtualScrollWrapper from "../../waves/drops/VirtualScrollWrapper";

type DropActionHandler = ({
  drop,
  partId,
}: {
  drop: ApiDrop;
  partId: number;
}) => void;

interface DropsListProps {
  readonly scrollContainerRef: React.RefObject<HTMLDivElement>;
  readonly drops: ExtendedDrop[];
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly isFetchingNextPage: boolean;
  readonly onReply: DropActionHandler;
  readonly onQuote: DropActionHandler;
  readonly onReplyClick: (serialNo: number) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
  readonly serialNo: number | null;
  readonly targetDropRef: RefObject<HTMLDivElement> | null;
  readonly dropViewDropId: string | null;
  readonly parentContainerRef?: React.RefObject<HTMLElement>;
}

const MemoizedDrop = memo(Drop);

const DropsList = memo(function DropsList({
  scrollContainerRef,
  drops,
  showWaveInfo,
  activeDrop,
  showReplyAndQuote,
  isFetchingNextPage,
  onReply,
  onQuote,
  onReplyClick,
  serialNo,
  targetDropRef,
  parentContainerRef,
  onQuoteClick,
  onDropContentClick,
  dropViewDropId,
}: DropsListProps) {
  console.log("dropslist")
  const handleReply = useCallback<DropActionHandler>(
    ({ drop, partId }) => onReply({ drop, partId }),
    [onReply]
  );

  const handleQuote = useCallback<DropActionHandler>(
    ({ drop, partId }) => onQuote({ drop, partId }),
    [onQuote]
  );

  const handleReplyClick = useCallback(
    (dropSerialNo: number) => onReplyClick(dropSerialNo),
    [onReplyClick]
  );

  const memoizedDrops = useMemo(
    () =>
      drops.map((drop, i) => (
        <div
          key={drop.stableKey}
          id={`drop-${drop.serial_no}`}
          ref={serialNo === drop.serial_no ? targetDropRef : null}
          className={serialNo === drop.serial_no ? "tw-scroll-mt-20" : ""}
        >
          <VirtualScrollWrapper
            scrollContainerRef={scrollContainerRef}
            drop={drop}
          >
            <MemoizedDrop
              dropViewDropId={dropViewDropId}
              onReplyClick={handleReplyClick}
              drop={drop}
              previousDrop={drops[i - 1] ?? null}
              nextDrop={drops[i + 1] ?? null}
              showWaveInfo={showWaveInfo}
              activeDrop={activeDrop}
              onReply={handleReply}
              onQuote={handleQuote}
              location={DropLocation.WAVE}
              showReplyAndQuote={showReplyAndQuote}
              onQuoteClick={onQuoteClick}
              parentContainerRef={parentContainerRef}
              onDropContentClick={onDropContentClick}
            />
          </VirtualScrollWrapper>
        </div>
      )),
    [
      drops,
      showWaveInfo,
      activeDrop,
      handleReply,
      handleQuote,
      showReplyAndQuote,
      serialNo,
      targetDropRef,
      handleReplyClick,
    ]
  );

  return ( memoizedDrops);
});

export default DropsList;
