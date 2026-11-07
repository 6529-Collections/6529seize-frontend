"use client";

import {
  renderBoostCardElement,
  useBoostCardIndex,
  useDropsListItemData,
  type DropActionHandler,
} from "@/components/drops/view/dropsListShared";
import UnreadDivider from "@/components/drops/view/UnreadDivider";
import { getDropSignatureGroups } from "@/components/waves/drops/signature/dropSignatureGroups";
import { WaveHistoryGap } from "@/components/waves/drops/WaveHistoryGap";
import type { WaveHistoryGap as HistoryGap } from "@/contexts/wave/hooks/types";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import {
  WAVE_DROPS_END_ANCHORED_SCROLL_CONTAINER,
  WAVE_DROPS_SCROLL_CONTAINER_ATTRIBUTE,
} from "@/helpers/waves/wave-visible-serial.helpers";
import type { Drop, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import type { BoostedDropsDisplayPreference } from "@/types/boosted-drops.types";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import { defaultRangeExtractor, useVirtualizer } from "@tanstack/react-virtual";
import type { Range, Virtualizer } from "@tanstack/react-virtual";
import type { Ref, RefObject } from "react";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  buildChatItems,
  estimateChatItemSize,
  getPinnedChatItemIndices,
  mergePinnedIndices,
  type ChatItem,
} from "./chatItems";
import type { ChatListHandle } from "./chatScrollBehavior";
import {
  WaveChatVirtualRow,
  type GetVideoPlaybackMemory,
} from "./WaveChatVirtualRow";
import {
  CHAT_END_THRESHOLD_PX,
  useChatAnnouncements,
  useFocusedChatItemKey,
  useWindowedChatEnd,
} from "./useWindowedChat";
import { useChatResidentCap } from "./useChatResidentCap";

// Rows rendered beyond each edge of the viewport. With typical rows this
// keeps about 50 rows mounted on a desktop viewport.
const OVERSCAN = 15;
// Load older history once the rendered range reaches this close to the top.
const TOP_PREFETCH_ITEMS = 10;

interface WaveChatVirtualListProps {
  /** Newest first, as the wave store keeps them. */
  readonly drops: Drop[];
  readonly historyGaps?: readonly HistoryGap[] | undefined;
  readonly waveId?: string | undefined;
  readonly scrollContainerRef: RefObject<HTMLDivElement | null>;
  readonly scrollContainerCallbackRef?: Ref<HTMLDivElement> | undefined;
  readonly bottomAnchorRef: Ref<HTMLDivElement>;
  readonly ref?: Ref<ChatListHandle> | undefined;
  readonly isFetchingOlder: boolean;
  readonly showOlderLoader: boolean;
  readonly onTopIntersection: () => void;
  readonly bottomPaddingClassName?: string | undefined;
  readonly onReply: DropActionHandler;
  readonly onReplyClick: (serialNo: number) => void;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly activeDrop: ActiveDropState | null;
  readonly serialNo: number | null;
  readonly targetDropRef: RefObject<HTMLDivElement | null>;
  readonly dropViewDropId: string | null;
  readonly unreadDividerSerialNo?: number | null | undefined;
  readonly boostedDrops?: ApiDrop[] | undefined;
  readonly boostedDropsDisplayPreference: BoostedDropsDisplayPreference;
  readonly onBoostedDropClick?: ((serialNo: number) => void) | undefined;
  readonly suspendLightDropHydration: boolean;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly isVotingClosed: boolean;
  readonly isVotingControlsLocked: boolean;
}

const assignRef = <T,>(ref: Ref<T> | undefined, value: T | null) => {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref) {
    ref.current = value;
  }
};

/**
 * The wave chat with only the rows near the viewport mounted (WAVES-PLAN
 * 0.11, behind NEXT_PUBLIC_FEATURE_CHAT_WINDOWING).
 *
 * - Normal order, oldest at the top, anchored to the end: the list follows
 *   new messages only while the reader is at the live end, and keeps the
 *   reader's row in place when older history loads above it.
 * - Rows are keyed by the drop's stable key and measured as they render.
 * - The jump target, unread divider, history gaps and the focused row stay
 *   mounted wherever they are.
 * - The history loader sits outside the rows, so the list never anchors on it.
 */
export function WaveChatVirtualList({
  drops,
  historyGaps,
  waveId,
  scrollContainerRef,
  scrollContainerCallbackRef,
  bottomAnchorRef,
  ref,
  isFetchingOlder,
  showOlderLoader,
  onTopIntersection,
  bottomPaddingClassName,
  onReply,
  onReplyClick,
  onQuoteClick,
  onDropContentClick,
  activeDrop,
  serialNo,
  targetDropRef,
  dropViewDropId,
  unreadDividerSerialNo,
  boostedDrops,
  boostedDropsDisplayPreference,
  onBoostedDropClick,
  suspendLightDropHydration,
  winningThreshold,
  winningThresholdMinDurationMs,
  isVotingClosed,
  isVotingControlsLocked,
}: WaveChatVirtualListProps) {
  const locale = useBrowserLocale();
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(
    null
  );
  const handleScrollElement = useCallback(
    (node: HTMLDivElement | null) => {
      setScrollElement((current) => (current === node ? current : node));
      assignRef(scrollContainerCallbackRef ?? scrollContainerRef, node);
    },
    [scrollContainerCallbackRef, scrollContainerRef]
  );

  const orderedDrops = useMemo(() => [...drops].reverse(), [drops]);
  const newestKey = orderedDrops.at(-1)?.stableKey ?? null;
  const signatureGroups = useMemo(
    () => getDropSignatureGroups(orderedDrops),
    [orderedDrops]
  );
  const handleReply = useCallback<DropActionHandler>(
    ({ drop, partId }) => onReply({ drop, partId }),
    [onReply]
  );
  const handleReplyClick = useCallback(
    (dropSerialNo: number) => onReplyClick(dropSerialNo),
    [onReplyClick]
  );
  const itemData = useDropsListItemData({
    showWaveInfo: false,
    activeDrop,
    handleReply,
    showReplyAndQuote: true,
    serialNo,
    targetDropRef,
    handleReplyClick,
    onQuoteClick,
    parentContainerRef: scrollContainerRef,
    dropViewDropId,
    onDropContentClick,
    scrollContainerRef,
    winningThreshold,
    winningThresholdMinDurationMs,
    isVotingClosed,
    isVotingControlsLocked,
  });

  const boostCardAtIndex = useBoostCardIndex({
    orderedDrops,
    boostedDrops,
    shouldInsertBoostCards: boostedDropsDisplayPreference !== "hidden",
    onBoostedDropClick,
  });

  const items = useMemo(
    () =>
      buildChatItems({
        orderedDrops,
        historyGaps,
        includeHistoryGaps: waveId !== undefined,
        boostCardAtIndex,
        boostedDrops,
        boostedDropsDisplayPreference,
        unreadDividerSerialNo,
      }),
    [
      orderedDrops,
      historyGaps,
      waveId,
      boostCardAtIndex,
      boostedDrops,
      boostedDropsDisplayPreference,
      unreadDividerSerialNo,
    ]
  );

  // Keyboard focus pins its row, so tabbing never loses focus to an unmount.
  const focusedKey = useFocusedChatItemKey(scrollElement);

  // Drops that stay loaded whatever the cap: the jump target, the unread
  // divider's row and the focused row.
  const pinnedSerials = useMemo(() => {
    const serials = new Set<number>();
    if (serialNo !== null) serials.add(serialNo);
    if (unreadDividerSerialNo !== null && unreadDividerSerialNo !== undefined) {
      serials.add(unreadDividerSerialNo);
    }
    const focused = items.find((item) => item.key === focusedKey);
    if (focused?.kind === "drop") serials.add(focused.drop.serial_no);
    return serials;
  }, [items, focusedKey, serialNo, unreadDividerSerialNo]);
  const handleResidentCap = useChatResidentCap({
    waveId,
    orderedDrops,
    items,
    pinnedSerials,
  });

  const pinnedIndices = useMemo(
    () =>
      getPinnedChatItemIndices(items, {
        targetSerialNo: serialNo,
        unreadDividerSerialNo,
        focusedKey,
      }),
    [items, serialNo, unreadDividerSerialNo, focusedKey]
  );
  const itemCount = items.length;
  const rangeExtractor = useCallback(
    (range: Range) =>
      mergePinnedIndices(
        defaultRangeExtractor(range),
        pinnedIndices,
        itemCount
      ),
    [pinnedIndices, itemCount]
  );
  const getItemKey = useCallback(
    (index: number) => items[index]?.key ?? index,
    [items]
  );
  const estimateSize = useCallback(
    (index: number) => estimateChatItemSize(items[index]),
    [items]
  );
  const getScrollElement = useCallback(
    () => scrollContainerRef.current,
    [scrollContainerRef]
  );

  // Older history loads as the rendered range nears the top: once per list
  // length and loader, like the reversed list's top sentinel.
  const topTriggerRef = useRef<{
    readonly count: number;
    readonly load: () => void;
  } | null>(null);
  const handleRangeChange = useCallback(
    (instance: Virtualizer<HTMLDivElement, HTMLDivElement>) => {
      const startIndex = instance.range?.startIndex;
      if (startIndex === undefined || startIndex > TOP_PREFETCH_ITEMS) {
        topTriggerRef.current = null;
        return;
      }
      const count = instance.options.count;
      const last = topTriggerRef.current;
      if (last?.count === count && last.load === onTopIntersection) {
        return;
      }
      topTriggerRef.current = { count, load: onTopIntersection };
      onTopIntersection();
    },
    [onTopIntersection]
  );

  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer<HTMLDivElement, HTMLDivElement>({
    count: itemCount,
    getScrollElement,
    estimateSize,
    getItemKey,
    rangeExtractor,
    overscan: OVERSCAN,
    anchorTo: "end",
    // Follow appended messages only at the live end, and never while a jump
    // owns the scroll position (see also the follow below).
    followOnAppend: serialNo === null ? "auto" : false,
    scrollEndThreshold: CHAT_END_THRESHOLD_PX,
    // Start at the newest messages.
    initialOffset: () => Number.MAX_SAFE_INTEGER,
    // Scroll-only updates move rows without a React render.
    directDomUpdates: true,
    directDomUpdatesMode: "position",
    onChange: (instance) => {
      handleRangeChange(instance);
      handleResidentCap(instance);
    },
  });

  useWindowedChatEnd({
    virtualizer,
    scrollElement,
    itemCount,
    newestKey,
    serialNo,
    ref,
  });

  // One polite live region: missed-history progress and new messages.
  const { message: announcement, announce } = useChatAnnouncements({
    orderedDrops,
    newestKey,
    waveId,
    locale,
  });

  // Video position and sound settings per row outlive the row's unmount.
  const [videoPlaybackMemories] = useState(
    () => new Map<string, ReturnType<GetVideoPlaybackMemory>>()
  );
  const getVideoPlaybackMemory = useCallback<GetVideoPlaybackMemory>(
    (rowKey) => {
      let memory = videoPlaybackMemories.get(rowKey);
      if (!memory) {
        memory = new Map();
        videoPlaybackMemories.set(rowKey, memory);
      }
      return memory;
    },
    [videoPlaybackMemories]
  );

  const renderItem = (item: ChatItem) => {
    switch (item.kind) {
      case "drop": {
        const { drop, dropIndex } = item;
        return (
          <WaveChatVirtualRow
            drop={drop}
            previousDrop={orderedDrops[dropIndex - 1] ?? null}
            nextDrop={orderedDrops[dropIndex + 1] ?? null}
            itemData={itemData}
            signatureGroup={signatureGroups.get(drop.id)}
            suspendLightDropHydration={suspendLightDropHydration}
            getVideoPlaybackMemory={getVideoPlaybackMemory}
          />
        );
      }
      case "gap":
        return waveId ? (
          <WaveHistoryGap
            waveId={waveId}
            gap={item.gap}
            scrollContainerRef={scrollContainerRef}
            onAnnounce={announce}
          />
        ) : null;
      case "boost":
        return onBoostedDropClick
          ? renderBoostCardElement({
              key: item.key,
              boostedDrop: item.boostedDrop,
              boostedIndex: item.boostedIndex,
              displayPreference: boostedDropsDisplayPreference,
              onBoostedDropClick,
            })
          : null;
      case "unread":
        return <UnreadDivider />;
    }
  };

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <>
      <div
        ref={handleScrollElement}
        data-mobile-bottom-nav-scroll-target="true"
        {...{
          [WAVE_DROPS_SCROLL_CONTAINER_ATTRIBUTE]:
            WAVE_DROPS_END_ANCHORED_SCROLL_CONTAINER,
        }}
        role="region"
        aria-label={t(locale, "waves.chat.messagesRegion")}
        // A keyboard user can scroll history with the arrow keys; rows that
        // come into view become reachable with Tab.
        tabIndex={0}
        className={`tw-min-h-0 tw-flex-1 ${
          bottomPaddingClassName ?? "tw-pb-6"
        } tw-no-scrollbar lg:tw-[scrollbar-gutter:stable] tw-[overflow-anchor:none] tw-flex tw-flex-col tw-overflow-y-auto tw-overflow-x-hidden tw-overscroll-y-contain tw-bg-iron-950 tw-transition-[padding-bottom] tw-duration-300 tw-ease-out tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 hover:tw-scrollbar-thumb-iron-300 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:-tw-outline-offset-2 focus-visible:tw-outline-primary-400 motion-reduce:tw-transition-none lg:tw-pr-2 lg:tw-scrollbar-thin`}
      >
        {showOlderLoader && isFetchingOlder && (
          // Zero height, so loading never moves the rows.
          <div className="tw-sticky tw-top-0 tw-z-10 tw-h-0">
            <div className="tw-h-0.5 tw-w-full tw-overflow-hidden tw-bg-iron-800">
              <div className="tw-h-full tw-w-full tw-animate-loading-bar tw-bg-indigo-400"></div>
            </div>
          </div>
        )}
        <div
          ref={virtualizer.containerRef}
          // Short chats sit at the bottom, above the composer.
          className="tw-relative tw-mt-auto tw-w-full tw-flex-shrink-0"
        >
          {virtualItems.map((virtualItem) => {
            const item = items[virtualItem.index];
            if (!item) {
              return null;
            }
            return (
              <div
                key={virtualItem.key}
                ref={virtualizer.measureElement}
                data-index={virtualItem.index}
                data-chat-item-key={item.key}
                className="tw-absolute tw-left-0 tw-w-full"
              >
                {renderItem(item)}
              </div>
            );
          })}
        </div>
        <div ref={bottomAnchorRef} style={{ height: "1px" }} />
      </div>
      <span className="tw-sr-only" role="status" aria-live="polite">
        {announcement}
      </span>
    </>
  );
}
