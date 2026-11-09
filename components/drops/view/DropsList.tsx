"use client";

import { useWaveReplyThreads } from "@/components/waves/drops/reply-threads/WaveReplyThreadsContext";
import Drop, { DropLocation } from "@/components/waves/drops/Drop";
import LightDrop from "@/components/waves/drops/LightDrop";
import VirtualScrollWrapper from "@/components/waves/drops/VirtualScrollWrapper";
import { WaveDropMobileMenuProvider } from "@/components/waves/drops/WaveDropMobileMenuContext";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type {
  Drop as DropType,
  ExtendedDrop,
} from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { RefObject } from "react";
import { memo, useCallback, useMemo, useState } from "react";
import BoostedDropCardHome from "@/components/home/boosted/BoostedDropCardHome";
import BoostedDropCompactChatItem from "@/components/home/boosted/BoostedDropCompactChatItem";
import ContentModerationDropGate from "@/components/content-moderation/ContentModerationDropGate";
import HighlightDropWrapper from "./HighlightDropWrapper";
import { getDropSignatureGroups } from "@/components/waves/drops/signature/dropSignatureGroups";
import UnreadDivider from "./UnreadDivider";
import { WaveHistoryGap } from "@/components/waves/drops/WaveHistoryGap";
import type { WaveHistoryGap as HistoryGap } from "@/contexts/wave/hooks/types";
import {
  DEFAULT_BOOSTED_DROPS_DISPLAY_PREFERENCE,
  type BoostedDropsDisplayPreference,
} from "@/types/boosted-drops.types";

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
  readonly historyGaps?: readonly HistoryGap[] | undefined;
  readonly waveId?: string | undefined;
  readonly scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  readonly drops: DropType[];
  readonly showWaveInfo: boolean;
  readonly activeDrop: ActiveDropState | null;
  readonly showReplyAndQuote: boolean;
  readonly onReply: DropActionHandler;
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
  readonly boostedDropsDisplayPreference?:
    | BoostedDropsDisplayPreference
    | undefined;
  readonly onBoostedDropClick?: ((serialNo: number) => void) | undefined;
  readonly suspendLightDropHydration?: boolean | undefined;
  readonly virtualScrollRootMargin?: string | undefined;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
  readonly moderationPresentation?: "default" | "profile-activity" | undefined;
}

const NO_SIGNATURE_GROUPS: ReturnType<typeof getDropSignatureGroups> =
  new Map();

const MemoizedDrop = memo(Drop);
const MemoizedLightDrop = memo(LightDrop);

interface DropsListItemData {
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

interface DropsListRowProps {
  readonly drop: DropType;
  readonly previousDrop: DropType | null;
  readonly nextDrop: DropType | null;
  readonly itemData: DropsListItemData;
  readonly location: DropLocation;
  readonly moderationPresentation: "default" | "profile-activity";
  readonly signatureGroup: readonly ExtendedDrop[] | undefined;
  readonly suspendLightDropHydration: boolean;
  readonly virtualScrollRootMargin: string | undefined;
}

/**
 * One chat row. Memoized as a whole: a new message re-renders only the rows
 * whose drop, neighbours or group changed, not every row in the list.
 */
const DropsListRow = memo(
  ({
    drop,
    previousDrop,
    nextDrop,
    itemData,
    location,
    moderationPresentation,
    signatureGroup,
    suspendLightDropHydration,
    virtualScrollRootMargin,
  }: DropsListRowProps) => {
    const isTarget = itemData.serialNo === drop.serial_no;
    const replyThreads = useWaveReplyThreads();
    const highlightMessageOnly =
      location === DropLocation.WAVE &&
      itemData.dropViewDropId === null &&
      drop.type === DropSize.FULL &&
      drop.drop_type === ApiDropType.Chat &&
      !drop.reply_to &&
      replyThreads !== null;
    const dropContent =
      drop.type === DropSize.FULL ? (
        <MemoizedDrop
          dropViewDropId={itemData.dropViewDropId}
          onReplyClick={itemData.handleReplyClick}
          drop={drop}
          previousDrop={previousDrop}
          nextDrop={nextDrop}
          showWaveInfo={itemData.showWaveInfo}
          activeDrop={
            itemData.activeDrop?.drop.id === drop.id
              ? itemData.activeDrop
              : null
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
          messageHighlight={
            highlightMessageOnly
              ? {
                  active: isTarget,
                  scrollContainer: itemData.scrollContainerRef.current,
                }
              : undefined
          }
        />
      ) : (
        <MemoizedLightDrop drop={drop} />
      );

    return (
      <HighlightDropWrapper
        id={`drop-${drop.serial_no}`}
        serialNo={drop.serial_no}
        waveDropId={drop.type === DropSize.FULL ? drop.stableHash : undefined}
        ref={isTarget ? itemData.targetDropRef : null}
        active={isTarget && !highlightMessageOnly}
        // Read when the row renders; the active row re-renders when it becomes
        // active, which is when the highlight observer uses this root.
        scrollContainer={itemData.scrollContainerRef.current ?? null}
        className={isTarget ? "tw-scroll-mt-20" : ""}
      >
        <VirtualScrollWrapper
          scrollContainerRef={itemData.scrollContainerRef}
          dropId={drop.id}
          dropSerialNo={drop.serial_no}
          waveId={drop.type === DropSize.FULL ? drop.wave.id : drop.waveId}
          type={drop.type}
          suspendLightDropHydration={suspendLightDropHydration}
          rootMargin={virtualScrollRootMargin}
          enableLongContentCollapse={
            location === DropLocation.WAVE && itemData.dropViewDropId === null
          }
        >
          {dropContent}
        </VirtualScrollWrapper>
      </HighlightDropWrapper>
    );
  }
);
DropsListRow.displayName = "DropsListRow";

const DropsList = memo(
  ({
    scrollContainerRef,
    drops,
    showWaveInfo,
    activeDrop,
    showReplyAndQuote,
    onReply,
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
    boostedDropsDisplayPreference = DEFAULT_BOOSTED_DROPS_DISPLAY_PREFERENCE,
    onBoostedDropClick,
    suspendLightDropHydration = false,
    virtualScrollRootMargin,
    winningThreshold,
    winningThresholdMinDurationMs,
    isVotingClosed = false,
    isVotingControlsLocked = false,
    moderationPresentation = "default",
    historyGaps,
    waveId,
  }: DropsListProps) => {
    const handleReply = useCallback<DropActionHandler>(
      ({ drop, partId }) => onReply({ drop, partId }),
      [onReply]
    );
    const [historyAnnouncement, setHistoryAnnouncement] = useState<{
      waveId: string | undefined;
      message: string;
    } | null>(null);
    const announceHistory = useCallback(
      (message: string) => {
        setHistoryAnnouncement({ waveId, message });
      },
      [waveId]
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

    // Chat headers seal their whole group of consecutive posts. Profile views
    // show a header on every post, so each keeps its own seal there.
    const signatureGroups = useMemo(
      () =>
        location === DropLocation.PROFILE
          ? NO_SIGNATURE_GROUPS
          : getDropSignatureGroups(orderedDrops),
      [location, orderedDrops]
    );

    // Memoize the props passed to each MemoizedDrop to prevent unnecessary renders
    const getItemData = useMemo((): DropsListItemData => {
      return {
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
      };
    }, [
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
    ]);

    // Store the serial_no of drops that boosted cards should appear BEFORE
    // Set once when boosted drops first arrive, then stays fixed
    // This makes boosted cards scroll away with new drops, but stay anchored when loading history
    const [boostAnchors, setBoostAnchors] = useState<number[] | null>(null);
    const shouldInsertBoostCards = boostedDropsDisplayPreference !== "hidden";

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

    // Pre-compute boost card positions by finding anchor drops
    // orderedDrops[0] = oldest (top), orderedDrops[last] = newest (bottom)
    const boostCardAtIndex = useMemo(() => {
      const map = new Map<number, number>();
      if (
        !shouldInsertBoostCards ||
        !boostedDrops ||
        boostedDrops.length === 0 ||
        !onBoostedDropClick
      ) {
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
    }, [
      boostedDrops,
      onBoostedDropClick,
      boostAnchors,
      orderedDrops,
      shouldInsertBoostCards,
    ]);

    const renderBoostCard = useCallback(
      (index: number): React.ReactNode => {
        if (!boostedDrops || !onBoostedDropClick) return null;
        const boostedIndex = boostCardAtIndex.get(index);
        if (boostedIndex === undefined) return null;
        const boostedDrop = boostedDrops[boostedIndex];
        if (!boostedDrop) return null;
        const onClick = () => onBoostedDropClick(boostedDrop.serial_no);
        const isCompact = boostedDropsDisplayPreference === "compact";
        return (
          <div
            key={`boost-card-${boostedIndex}-${boostedDrop.id}-${boostedDropsDisplayPreference}`}
            className={
              isCompact
                ? "tw-px-3 tw-py-1.5 sm:tw-px-4"
                : "tw-px-3 tw-py-3 sm:tw-px-4"
            }
          >
            <ContentModerationDropGate drop={boostedDrop} compact>
              {isCompact ? (
                <BoostedDropCompactChatItem
                  drop={boostedDrop}
                  onClick={onClick}
                />
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
      },
      [
        boostCardAtIndex,
        boostedDrops,
        boostedDropsDisplayPreference,
        onBoostedDropClick,
      ]
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

    const renderedDrops = useMemo(() => {
      return orderedDrops.flatMap((drop, i) => {
        const previousDrop = orderedDrops[i - 1] ?? null;
        const nextDrop = orderedDrops[i + 1] ?? null;

        const boostCard = renderBoostCard(i);
        const unreadDivider = renderUnreadDivider(drop.serial_no);

        const dropElement = (
          <DropsListRow
            key={drop.stableKey}
            drop={drop}
            previousDrop={previousDrop}
            nextDrop={nextDrop}
            itemData={getItemData}
            location={location}
            moderationPresentation={moderationPresentation}
            signatureGroup={signatureGroups.get(drop.id)}
            suspendLightDropHydration={suspendLightDropHydration}
            virtualScrollRootMargin={virtualScrollRootMargin}
          />
        );

        const gap = historyGaps?.find(
          (item) =>
            drop.serial_no >= item.olderThan &&
            (!previousDrop || previousDrop.serial_no < item.olderThan)
        );
        const historyGap =
          gap && waveId ? (
            <WaveHistoryGap
              key={`gap-${gap.newerThan}`}
              waveId={waveId}
              gap={gap}
              scrollContainerRef={scrollContainerRef}
              onAnnounce={announceHistory}
            />
          ) : null;
        return [historyGap, boostCard, unreadDivider, dropElement].filter(
          Boolean
        );
      });
    }, [
      orderedDrops,
      getItemData,
      location,
      renderBoostCard,
      renderUnreadDivider,
      suspendLightDropHydration,
      virtualScrollRootMargin,
      moderationPresentation,
      signatureGroups,
      historyGaps,
      waveId,
      scrollContainerRef,
      announceHistory,
    ]);

    return (
      <WaveDropMobileMenuProvider>
        <span className="tw-sr-only" role="status" aria-live="polite">
          {historyAnnouncement?.waveId === waveId
            ? historyAnnouncement?.message
            : ""}
        </span>
        {renderedDrops}
      </WaveDropMobileMenuProvider>
    );
  }
);

DropsList.displayName = "DropsList";

export default DropsList;
