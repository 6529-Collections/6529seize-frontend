"use client";

import BoostedDropCardHome from "@/components/home/boosted/BoostedDropCardHome";
import BoostedDropCompactChatItem from "@/components/home/boosted/BoostedDropCompactChatItem";
import ContentModerationDropGate from "@/components/content-moderation/ContentModerationDropGate";
import Drop, { type DropLocation } from "@/components/waves/drops/Drop";
import LightDrop from "@/components/waves/drops/LightDrop";
import type { WaveHistoryGap as HistoryGap } from "@/contexts/wave/hooks/types";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type {
  Drop as DropType,
  ExtendedDrop,
} from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import type { BoostedDropsDisplayPreference } from "@/types/boosted-drops.types";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { ReactNode, RefObject } from "react";
import { memo, useMemo, useState } from "react";

/**
 * Pieces shared by the chat lists: `DropsList` (every loaded row in the DOM)
 * and the windowed `WaveChatVirtualList`. Both render a row's drop, its boost
 * cards and its history gaps the same way.
 */

// Logarithmic positions for boost cards (visual positions, 1-indexed)
const BOOST_CARD_POSITIONS = [5, 10, 20, 40, 80, 160];

export type DropActionHandler = ({
  drop,
  partId,
}: {
  drop: ApiDrop;
  partId: number;
}) => void;

export interface DropsListItemData {
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly handleReply: DropActionHandler;
  readonly showReplyAndQuote: boolean;
  readonly serialNo: number | null;
  readonly targetDropRef: RefObject<HTMLDivElement | null> | null;
  readonly handleReplyClick: (serialNo: number) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly parentContainerRef?: React.RefObject<HTMLElement | null> | undefined;
  readonly dropViewDropId: string | null;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly isVotingClosed: boolean;
  readonly isVotingControlsLocked: boolean;
}

/** One object per change of its fields, so memoized rows skip re-renders. */
export function useDropsListItemData({
  showWaveInfo,
  activeDrop,
  handleReply,
  showReplyAndQuote,
  serialNo,
  targetDropRef,
  handleReplyClick,
  onQuoteClick,
  parentContainerRef,
  dropViewDropId,
  onDropContentClick,
  scrollContainerRef,
  winningThreshold,
  winningThresholdMinDurationMs,
  isVotingClosed,
  isVotingControlsLocked,
}: DropsListItemData): DropsListItemData {
  return useMemo(
    (): DropsListItemData => ({
      showWaveInfo,
      activeDrop,
      handleReply,
      showReplyAndQuote,
      serialNo,
      targetDropRef,
      handleReplyClick,
      onQuoteClick,
      parentContainerRef,
      dropViewDropId,
      onDropContentClick,
      scrollContainerRef,
      winningThreshold,
      winningThresholdMinDurationMs,
      isVotingClosed,
      isVotingControlsLocked,
    }),
    [
      showWaveInfo,
      activeDrop,
      handleReply,
      showReplyAndQuote,
      serialNo,
      targetDropRef,
      handleReplyClick,
      onQuoteClick,
      parentContainerRef,
      dropViewDropId,
      onDropContentClick,
      scrollContainerRef,
      winningThreshold,
      winningThresholdMinDurationMs,
      isVotingClosed,
      isVotingControlsLocked,
    ]
  );
}

const MemoizedDrop = memo(Drop);
const MemoizedLightDrop = memo(LightDrop);

/** A row's drop: the full drop, or the light placeholder until it hydrates. */
export function renderDropsListDropContent({
  drop,
  previousDrop,
  nextDrop,
  itemData,
  location,
  moderationPresentation,
  signatureGroup,
}: {
  readonly drop: DropType;
  readonly previousDrop: DropType | null;
  readonly nextDrop: DropType | null;
  readonly itemData: DropsListItemData;
  readonly location: DropLocation;
  readonly moderationPresentation: "default" | "profile-activity";
  readonly signatureGroup: readonly ExtendedDrop[] | undefined;
}): ReactNode {
  if (drop.type !== DropSize.FULL) {
    return <MemoizedLightDrop drop={drop} />;
  }
  return (
    <MemoizedDrop
      dropViewDropId={itemData.dropViewDropId}
      onReplyClick={itemData.handleReplyClick}
      drop={drop}
      previousDrop={previousDrop}
      nextDrop={nextDrop}
      showWaveInfo={itemData.showWaveInfo}
      activeDrop={
        itemData.activeDrop?.drop.id === drop.id ? itemData.activeDrop : null
      }
      onReply={itemData.handleReply}
      location={location}
      showReplyAndQuote={itemData.showReplyAndQuote}
      onQuoteClick={itemData.onQuoteClick}
      parentContainerRef={itemData.parentContainerRef}
      onDropContentClick={itemData.onDropContentClick}
      winningThreshold={itemData.winningThreshold}
      winningThresholdMinDurationMs={itemData.winningThresholdMinDurationMs}
      isVotingClosed={itemData.isVotingClosed}
      isVotingControlsLocked={itemData.isVotingControlsLocked}
      moderationPresentation={moderationPresentation}
      signatureGroup={signatureGroup}
    />
  );
}

/**
 * Where boosted cards go: list index (oldest first) to boosted drop index.
 * The anchors are the drops at fixed distances from the newest when boosted
 * drops first arrive; they then stay fixed, so the cards scroll away with new
 * drops and keep their place while history loads.
 */
export function useBoostCardIndex({
  orderedDrops,
  boostedDrops,
  shouldInsertBoostCards,
  onBoostedDropClick,
}: {
  readonly orderedDrops: readonly DropType[];
  readonly boostedDrops: readonly ApiDrop[] | undefined;
  readonly shouldInsertBoostCards: boolean;
  readonly onBoostedDropClick: ((serialNo: number) => void) | undefined;
}): ReadonlyMap<number, number> {
  const [boostAnchors, setBoostAnchors] = useState<number[] | null>(null);

  // Adjust state during render (React-recommended pattern for derived state)
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (
    boostAnchors === null &&
    shouldInsertBoostCards &&
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

  // orderedDrops[0] = oldest (top), orderedDrops[last] = newest (bottom)
  return useMemo(() => {
    const map = new Map<number, number>();
    if (
      !shouldInsertBoostCards ||
      !boostedDrops ||
      boostedDrops.length === 0 ||
      !onBoostedDropClick ||
      !boostAnchors
    ) {
      return map;
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
  }, [
    boostedDrops,
    onBoostedDropClick,
    boostAnchors,
    orderedDrops,
    shouldInsertBoostCards,
  ]);
}

/** The boosted card shown inline before its anchor drop. */
export function renderBoostCardElement({
  key,
  boostedDrop,
  boostedIndex,
  displayPreference,
  onBoostedDropClick,
}: {
  readonly key: string;
  readonly boostedDrop: ApiDrop;
  readonly boostedIndex: number;
  readonly displayPreference: BoostedDropsDisplayPreference;
  readonly onBoostedDropClick: (serialNo: number) => void;
}): ReactNode {
  const onClick = () => onBoostedDropClick(boostedDrop.serial_no);
  const isCompact = displayPreference === "compact";
  return (
    <div
      key={key}
      className={
        isCompact ? "tw-px-3 tw-py-1.5 sm:tw-px-4" : "tw-px-3 tw-py-3 sm:tw-px-4"
      }
    >
      <ContentModerationDropGate drop={boostedDrop} compact>
        {isCompact ? (
          <BoostedDropCompactChatItem drop={boostedDrop} onClick={onClick} />
        ) : (
          <BoostedDropCardHome
            drop={boostedDrop}
            variant="chat"
            rank={boostedIndex + 1}
            onClick={onClick}
          />
        )}
      </ContentModerationDropGate>
    </div>
  );
}

export const getBoostCardKey = (
  boostedIndex: number,
  boostedDrop: ApiDrop,
  displayPreference: BoostedDropsDisplayPreference
): string =>
  `boost-card-${boostedIndex}-${boostedDrop.id}-${displayPreference}`;

/** The history gap that ends at `drop`, shown just above it. */
export const findHistoryGapBefore = (
  historyGaps: readonly HistoryGap[] | undefined,
  drop: DropType,
  previousDrop: DropType | null
): HistoryGap | undefined =>
  historyGaps?.find(
    (item) =>
      drop.serial_no >= item.olderThan &&
      (!previousDrop || previousDrop.serial_no < item.olderThan)
  );
