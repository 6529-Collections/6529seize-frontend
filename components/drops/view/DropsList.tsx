"use client";

import { DropLocation } from "@/components/waves/drops/Drop";
import VirtualScrollWrapper from "@/components/waves/drops/VirtualScrollWrapper";
import { WaveDropMobileMenuProvider } from "@/components/waves/drops/WaveDropMobileMenuContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type {
  Drop as DropType,
  ExtendedDrop,
} from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { RefObject } from "react";
import { memo, useCallback, useMemo, useState } from "react";
import HighlightDropWrapper from "./HighlightDropWrapper";
import { getDropSignatureGroups } from "@/components/waves/drops/signature/dropSignatureGroups";
import UnreadDivider from "./UnreadDivider";
import { WaveHistoryGap } from "@/components/waves/drops/WaveHistoryGap";
import type { WaveHistoryGap as HistoryGap } from "@/contexts/wave/hooks/types";
import {
  DEFAULT_BOOSTED_DROPS_DISPLAY_PREFERENCE,
  type BoostedDropsDisplayPreference,
} from "@/types/boosted-drops.types";
import {
  findHistoryGapBefore,
  getBoostCardKey,
  renderBoostCardElement,
  renderDropsListDropContent,
  useBoostCardIndex,
  useDropsListItemData,
  type DropActionHandler,
  type DropsListItemData,
} from "./dropsListShared";

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
    const dropContent = renderDropsListDropContent({
      drop,
      previousDrop,
      nextDrop,
      itemData,
      location,
      moderationPresentation,
      signatureGroup,
    });

    return (
      <HighlightDropWrapper
        id={`drop-${drop.serial_no}`}
        serialNo={drop.serial_no}
        waveDropId={drop.type === DropSize.FULL ? drop.stableHash : undefined}
        ref={isTarget ? itemData.targetDropRef : null}
        active={isTarget}
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
    const getItemData = useDropsListItemData({
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
    });

    // Boosted cards appear BEFORE fixed anchor drops: they scroll away with new
    // drops, but stay anchored when loading history.
    const shouldInsertBoostCards = boostedDropsDisplayPreference !== "hidden";
    const boostCardAtIndex = useBoostCardIndex({
      orderedDrops,
      boostedDrops,
      shouldInsertBoostCards,
      onBoostedDropClick,
    });

    const renderBoostCard = useCallback(
      (index: number): React.ReactNode => {
        if (!boostedDrops || !onBoostedDropClick) return null;
        const boostedIndex = boostCardAtIndex.get(index);
        if (boostedIndex === undefined) return null;
        const boostedDrop = boostedDrops[boostedIndex];
        if (!boostedDrop) return null;
        return renderBoostCardElement({
          key: getBoostCardKey(
            boostedIndex,
            boostedDrop,
            boostedDropsDisplayPreference
          ),
          boostedDrop,
          boostedIndex,
          displayPreference: boostedDropsDisplayPreference,
          onBoostedDropClick,
        });
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

        const gap = findHistoryGapBefore(historyGaps, drop, previousDrop);
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
