"use client"

import { useMemo, RefObject, useCallback, memo } from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { DropSize, ExtendedDrop, Drop as DropType } from "../../../helpers/waves/drop.helpers";
import { ActiveDropState } from "../../../types/dropInteractionTypes";
import Drop, { DropLocation } from "../../waves/drops/Drop";
import VirtualScrollWrapper from "../../waves/drops/VirtualScrollWrapper";
import LightDrop from "../../waves/drops/LightDrop";
type DropActionHandler = ({
  drop,
  partId,
}: {
  drop: ApiDrop;
  partId: number;
}) => void;

interface DropsListProps {
  readonly scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  readonly drops: DropType[];
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly onReply: DropActionHandler;
  readonly onQuote: DropActionHandler;
  readonly onReplyClick: (serialNo: number) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
  readonly serialNo: number | null;
  readonly targetDropRef: RefObject<HTMLDivElement | null> | null;
  readonly dropViewDropId: string | null;
  readonly parentContainerRef?: React.RefObject<HTMLElement | null>;
  readonly location?: DropLocation;
}

const MemoizedDrop = memo(Drop);
const MemoizedLightDrop = memo(LightDrop);
const DropsList = memo(function DropsList({
  scrollContainerRef,
  drops,
  showWaveInfo,
  activeDrop,
  showReplyAndQuote,
  onReply,
  onQuote,
  onReplyClick,
  serialNo,
  targetDropRef,
  parentContainerRef,
  onQuoteClick,
  onDropContentClick,
  dropViewDropId,
  location = DropLocation.WAVE,
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

  // Memoize the props passed to each MemoizedDrop to prevent unnecessary renders
  const getItemData = useMemo(() => {
    return {
      drops,
      showWaveInfo,
      activeDrop,
      handleReply,
      handleQuote,
      showReplyAndQuote,
      serialNo,
      targetDropRef,
      handleReplyClick,
      onQuoteClick,
      parentContainerRef,
      dropViewDropId,
      onDropContentClick,
      scrollContainerRef,
    };
  }, [
    drops,
    showWaveInfo,
    activeDrop,
    handleReply,
    handleQuote,
    showReplyAndQuote,
    serialNo,
    targetDropRef,
    handleReplyClick,
    onQuoteClick,
    parentContainerRef,
    dropViewDropId,
    onDropContentClick,
    scrollContainerRef,
  ]);

  const memoizedDrops = useMemo(
    () =>
      drops.map((drop, i) => {
        const previousDrop = drops[i + 1] ?? null;
        const nextDrop = drops[i - 1] ?? null;

        return (
          <div
            key={drop.stableKey}
            id={`drop-${drop.serial_no}`}
            ref={
              getItemData.serialNo === drop.serial_no
                ? getItemData.targetDropRef
                : null
            }
            className={
              getItemData.serialNo === drop.serial_no ? "tw-scroll-mt-20" : ""
            }
          >
            <VirtualScrollWrapper
              scrollContainerRef={getItemData.scrollContainerRef}
              dropSerialNo={drop.serial_no}
              waveId={drop.type === DropSize.FULL ? drop.wave.id : drop.waveId}
              type={drop.type}
            >
              {drop.type === DropSize.FULL ? (
                <MemoizedDrop
                  dropViewDropId={getItemData.dropViewDropId}
                  onReplyClick={getItemData.handleReplyClick}
                  drop={drop}
                  previousDrop={previousDrop}
                  nextDrop={nextDrop}
                  showWaveInfo={getItemData.showWaveInfo}
                  activeDrop={getItemData.activeDrop}
                  onReply={getItemData.handleReply}
                  onQuote={getItemData.handleQuote}
                  location={location}
                  showReplyAndQuote={getItemData.showReplyAndQuote}
                  onQuoteClick={getItemData.onQuoteClick}
                  parentContainerRef={getItemData.parentContainerRef}
                  onDropContentClick={getItemData.onDropContentClick}
                />
              ) : (
                <MemoizedLightDrop drop={drop} />
              )}
            </VirtualScrollWrapper>
          </div>
        );
      }),
    [drops, getItemData] // Only depends on drops array and the memoized item data
  );

  return memoizedDrops;
});

export default DropsList;
