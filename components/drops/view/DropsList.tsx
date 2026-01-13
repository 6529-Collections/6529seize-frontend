"use client";

import Drop, { DropLocation } from "@/components/waves/drops/Drop";
import LightDrop from "@/components/waves/drops/LightDrop";
import VirtualScrollWrapper from "@/components/waves/drops/VirtualScrollWrapper";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type {
  Drop as DropType,
  ExtendedDrop,
} from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { RefObject } from "react";
import { memo, useCallback, useMemo, useState } from "react";
import BoostedDropCard from "./BoostedDropCard";
import HighlightDropWrapper from "./HighlightDropWrapper";
import UnreadDivider from "./UnreadDivider";

// Logarithmic positions for boost cards (visual positions, 1-indexed)
const BOOST_CARD_POSITIONS = [5, 10, 20, 40, 80, 160];

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
  readonly boostedDrops?: ApiDrop[] | undefined;
  readonly onBoostedDropClick?: ((serialNo: number) => void) | undefined;
}

const MemoizedDrop = memo(Drop);
const MemoizedLightDrop = memo(LightDrop);
const DropsList = memo(
  ({
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
    boostedDrops,
    onBoostedDropClick,
  }: DropsListProps) => {
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

    // Store the serial_no of drops that boosted cards should appear BEFORE
    // Set once when boosted drops first arrive, then stays fixed
    // This makes boosted cards scroll away with new drops, but stay anchored when loading history
    const [boostAnchors, setBoostAnchors] = useState<number[] | null>(null);

    // Adjust state during render (React-recommended pattern for derived state)
    // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
    if (
      boostAnchors === null &&
      boostedDrops &&
      boostedDrops.length > 0 &&
      orderedDrops.length > 0
    ) {
      // Calculate anchor serial_nos based on current positions from bottom
      const anchors: number[] = [];
      for (
        let b = 0;
        b < boostedDrops.length && b < BOOST_CARD_POSITIONS.length;
        b++
      ) {
        const posFromBottom = BOOST_CARD_POSITIONS[b] ?? 0;
        const index = orderedDrops.length - posFromBottom;
        if (index >= 0 && index < orderedDrops.length) {
          anchors.push(orderedDrops[index]!.serial_no);
        }
      }
      setBoostAnchors(anchors);
    }

    // Pre-compute boost card positions by finding anchor drops
    // orderedDrops[0] = oldest (top), orderedDrops[last] = newest (bottom)
    const boostCardAtIndex = useMemo(() => {
      const map = new Map<number, number>();
      if (!boostedDrops || boostedDrops.length === 0 || !onBoostedDropClick) {
        return map;
      }
      if (!boostAnchors) {
        return map; // Not initialized yet
      }

      // Find each anchor's current index and map it
      for (let b = 0; b < boostAnchors.length; b++) {
        const anchorSerialNo = boostAnchors[b];
        const index = orderedDrops.findIndex(
          (d) => d.serial_no === anchorSerialNo
        );
        if (index >= 0) {
          map.set(index, b);
        }
      }
      return map;
    }, [boostedDrops, onBoostedDropClick, boostAnchors, orderedDrops]);

    const renderBoostCard = useCallback(
      (index: number): React.ReactNode => {
        if (!boostedDrops || !onBoostedDropClick) return null;
        const boostedIndex = boostCardAtIndex.get(index);
        if (boostedIndex === undefined) return null;
        const boostedDrop = boostedDrops[boostedIndex];
        if (!boostedDrop) return null;
        return (
          <BoostedDropCard
            key={`boost-card-${boostedIndex}-${boostedDrop.id}`}
            drop={boostedDrop}
            rank={boostedIndex + 1}
            onClick={() => onBoostedDropClick(boostedDrop.serial_no)}
          />
        );
      },
      [boostCardAtIndex, boostedDrops, onBoostedDropClick]
    );

    const renderUnreadDivider = useCallback(
      (dropSerialNo: number): React.ReactNode => {
        if (unreadDividerSerialNo === null) return null;
        if (dropSerialNo !== unreadDividerSerialNo) return null;
        return (
          <UnreadDivider key={`unread-divider-${unreadDividerSerialNo}`} />
        );
      },
      [unreadDividerSerialNo]
    );

    return useMemo(() => {
      return orderedDrops.flatMap((drop, i) => {
        const previousDrop = orderedDrops[i - 1] ?? null;
        const nextDrop = orderedDrops[i + 1] ?? null;

        const boostCard = renderBoostCard(i);
        const unreadDivider = renderUnreadDivider(drop.serial_no);

        const dropElement = (
          <HighlightDropWrapper
            key={drop.stableKey}
            id={`drop-${drop.serial_no}`}
            waveDropId={
              drop.type === DropSize.FULL ? drop.stableHash : undefined
            }
            ref={
              getItemData.serialNo === drop.serial_no
                ? getItemData.targetDropRef
                : null
            }
            active={getItemData.serialNo === drop.serial_no}
            scrollContainer={getItemData.scrollContainerRef.current ?? null}
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

        return [boostCard, unreadDivider, dropElement].filter(Boolean);
      });
    }, [
      orderedDrops,
      getItemData,
      location,
      renderBoostCard,
      renderUnreadDivider,
    ]);
  }
);

DropsList.displayName = "DropsList";

export default DropsList;
