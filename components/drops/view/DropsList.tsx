import { useMemo, RefObject } from "react";
import { Drop } from "../../../generated/models/Drop";

import WaveDetailedDrop from "../../waves/detailed/drops/WaveDetailedDrop";
import { ActiveDropState } from "../../waves/detailed/WaveDetailedContent";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";

type DropActionHandler = ({
  drop,
  partId,
}: {
  drop: Drop;
  partId: number;
}) => void;

interface DropsListProps {
  readonly drops: ExtendedDrop[];
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly isFetchingNextPage: boolean;
  readonly isFetchingPreviousPage: boolean;

  readonly onReply: DropActionHandler;
  readonly onQuote: DropActionHandler;
  readonly onActiveDropClick?: () => void;
  readonly onReplyClick: (serialNo: number) => void;
  readonly serialNo: number | null;
  readonly targetDropRef: RefObject<HTMLDivElement>;
}

export default function DropsList({
  drops,
  showWaveInfo,
  activeDrop,
  showReplyAndQuote,
  isFetchingNextPage,
  isFetchingPreviousPage,
  onReply,
  onQuote,
  onActiveDropClick,
  onReplyClick,
  serialNo,
  targetDropRef,
}: DropsListProps) {
  const memoizedDrops = useMemo(
    () =>
      drops.map((drop, i) => (
        <div
          key={drop.stableKey}
          id={`drop-${drop.serial_no}`}
          ref={serialNo === drop.serial_no ? targetDropRef : null}
          className={serialNo === drop.serial_no ? "tw-scroll-mt-20" : ""}
        >
          <WaveDetailedDrop
            onReplyClick={onReplyClick}
            drop={drop}
            previousDrop={drops[i - 1] ?? null}
            nextDrop={drops[i + 1] ?? null}
            showWaveInfo={showWaveInfo}
            activeDrop={activeDrop}
            onReply={onReply}
            onQuote={onQuote}
            showReplyAndQuote={showReplyAndQuote}
            onActiveDropClick={onActiveDropClick}
          />
        </div>
      )),
    [
      drops,
      showWaveInfo,
      activeDrop,
      onReply,
      onQuote,
      showReplyAndQuote,
      onActiveDropClick,
      serialNo,
      targetDropRef,
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
      {isFetchingPreviousPage && (
        <div className="tw-w-full tw-h-0.5 tw-bg-iron-800 tw-overflow-hidden">
          <div className="tw-w-full tw-h-full tw-bg-indigo-400 tw-animate-loading-bar"></div>
        </div>
      )}
    </div>
  );
}
