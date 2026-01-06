"use client";

import Drop, { DropLocation } from "@/components/waves/drops/Drop";
import LightDrop from "@/components/waves/drops/LightDrop";
import VirtualScrollWrapper from "@/components/waves/drops/VirtualScrollWrapper";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type {
  Drop as DropType,
  ExtendedDrop} from "@/helpers/waves/drop.helpers";
import {
  DropSize
} from "@/helpers/waves/drop.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { RefObject} from "react";
import { memo, useCallback, useMemo } from "react";
import HighlightDropWrapper from "./HighlightDropWrapper";
import UnreadDivider from "./UnreadDivider";

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
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly serialNo: number | null;
  readonly targetDropRef: RefObject<HTMLDivElement | null> | null;
  readonly dropViewDropId: string | null;
  readonly parentContainerRef?: React.RefObject<HTMLElement | null> | undefined;
  readonly location?: DropLocation | undefined;
  readonly unreadDividerSerialNo?: number | null | undefined;
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
  unreadDividerSerialNo,
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

  const orderedDrops = useMemo(() => {
    if (location === DropLocation.WAVE) {
      return [...drops].reverse();
    }

    return drops;
  }, [drops, location]);

  // Memoize the props passed to each MemoizedDrop to prevent unnecessary renders
  const getItemData = useMemo(() => {
    return {
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

  const memoizedDrops = useMemo(() => {
    const elements: React.ReactNode[] = [];

    for (let i = 0; i < orderedDrops.length; i++) {
      const drop = orderedDrops[i];
      const previousDrop = orderedDrops[i - 1] ?? null;
      const nextDrop = orderedDrops[i + 1] ?? null;

      if (!drop) {
        continue;
      }

      if (
        unreadDividerSerialNo !== null &&
        unreadDividerSerialNo !== undefined &&
        drop.serial_no === unreadDividerSerialNo
      ) {
        elements.push(
          <UnreadDivider key={`unread-divider-${unreadDividerSerialNo}`} />
        );
      }

      elements.push(
        <HighlightDropWrapper
          key={drop.stableKey}
          id={`drop-${drop.serial_no}`}
          waveDropId={
            drop.type === DropSize.FULL
              ? drop.stableHash ?? drop.id ?? drop.stableKey
              : undefined
          }
          ref={
            getItemData.serialNo === drop.serial_no
              ? getItemData.targetDropRef
              : null
          }
          active={getItemData.serialNo === drop.serial_no}
          scrollContainer={getItemData.scrollContainerRef?.current ?? null}
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
        </HighlightDropWrapper>
      );
    }

    return elements;
  }, [orderedDrops, getItemData, location, unreadDividerSerialNo]);

  return memoizedDrops;
});

export default DropsList;
