import { useMemo, RefObject, useCallback, memo } from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";

import WaveDetailedDrop, {
  DropLocation,
} from "../../waves/detailed/drops/WaveDetailedDrop";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { ActiveDropState } from "../../waves/detailed/chat/WaveChat";

type DropActionHandler = ({
  drop,
  partId,
}: {
  drop: ApiDrop;
  partId: number;
}) => void;

interface DropsListProps {
  readonly drops: ExtendedDrop[];
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly isFetchingNextPage: boolean;
  readonly onReply: DropActionHandler;
  readonly onQuote: DropActionHandler;
  readonly onReplyClick: (serialNo: number) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly serialNo: number | null;
  readonly targetDropRef: RefObject<HTMLDivElement> | null;
  readonly dropViewDropId: string | null;
  readonly parentContainerRef?: React.RefObject<HTMLElement>;
}

const MemoizedWaveDetailedDrop = memo(WaveDetailedDrop);

const DropsList = memo(function DropsList({
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
  onDropClick,
  dropViewDropId,
}: DropsListProps) {
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
          /*  style={{
            contentVisibility: "auto",
            containIntrinsicSize: "auto",
          }} */
        >
          <MemoizedWaveDetailedDrop
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
            onDropClick={onDropClick}
          />
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

  return (
    <div className="tw-flex tw-flex-col">
      {isFetchingNextPage && (
        <div className="tw-w-full tw-h-0.5 tw-bg-iron-800 tw-overflow-hidden">
          <div className="tw-w-full tw-h-full tw-bg-indigo-400 tw-animate-loading-bar"></div>
        </div>
      )}
      {memoizedDrops}
    </div>
  );
});

export default DropsList;
