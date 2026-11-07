import { ChatVideoPlaybackProvider } from "@/components/drops/view/item/content/media/ChatVideoPlayback";
import DropsList from "@/components/drops/view/DropsList";
import { WaveDropsReverseContainer } from "@/components/waves/drops/WaveDropsReverseContainer";
import { WaveDropsScrollControls } from "@/components/waves/drops/WaveDropsScrollControls";
import type { ChatListHandle } from "@/components/waves/drops/chat-window/chatScrollBehavior";
import { isChatWindowingEnabled } from "@/components/waves/drops/chat-window/chatWindowingFlag";
import { WaveChatVirtualList } from "@/components/waves/drops/chat-window/WaveChatVirtualList";
import { WaveDropContentExpansionProvider } from "@/components/waves/drops/WaveDropContentExpansionContext";
import { WaveDropMobileMenuProvider } from "@/components/waves/drops/WaveDropMobileMenuContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { useVirtualizedWaveDrops } from "@/hooks/useVirtualizedWaveDrops";
import {
  DEFAULT_BOOSTED_DROPS_DISPLAY_PREFERENCE,
  type BoostedDropsDisplayPreference,
} from "@/types/boosted-drops.types";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { RefObject, Ref } from "react";

type WaveMessagesResult = ReturnType<
  typeof useVirtualizedWaveDrops
>["waveMessages"];

interface WaveDropsMessageListSectionProps {
  readonly waveMessages: WaveMessagesResult;
  readonly dropId: string | null;
  readonly scrollContainerRef: RefObject<HTMLDivElement | null>;
  readonly scrollContainerCallbackRef?: Ref<HTMLDivElement> | undefined;
  readonly chatListRef?: Ref<ChatListHandle> | undefined;
  readonly bottomAnchorRef: RefObject<HTMLDivElement | null>;
  readonly bottomAnchorCallbackRef?: Ref<HTMLDivElement> | undefined;
  readonly paginationThreshold: number;
  readonly onTopIntersection: () => void;
  readonly onReply: ({
    drop,
    partId,
  }: {
    drop: ApiDrop;
    partId: number;
  }) => void;
  readonly queueSerialTarget: (serialNo: number) => void;
  readonly activeDrop: ActiveDropState | null;
  readonly serialTarget: number | null;
  readonly targetDropRef: RefObject<HTMLDivElement | null>;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly isAtBottom: boolean;
  readonly scrollToBottom: () => void;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly pendingCount: number;
  readonly onRevealPending: () => void;
  readonly bottomPaddingClassName?: string | undefined;
  readonly unreadDividerSerialNo?: number | null | undefined;
  readonly unreadCount?: number | undefined;
  readonly boostedDrops?: ApiDrop[] | undefined;
  readonly boostedDropsDisplayPreference?:
    | BoostedDropsDisplayPreference
    | undefined;
  readonly onBoostedDropClick?: ((serialNo: number) => void) | undefined;
  readonly onScrollToUnread?: ((serialNo: number) => void) | undefined;
  readonly onDismissUnread: () => void;
  readonly suspendLightDropHydration?: boolean | undefined;
  readonly virtualScrollRootMargin?: string | undefined;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
}

export const WaveDropsMessageListSection: React.FC<
  WaveDropsMessageListSectionProps
> = ({
  waveMessages,
  dropId,
  scrollContainerRef,
  scrollContainerCallbackRef,
  chatListRef,
  bottomAnchorRef,
  bottomAnchorCallbackRef,
  paginationThreshold,
  onTopIntersection,
  onReply,
  queueSerialTarget,
  activeDrop,
  serialTarget,
  targetDropRef,
  onQuoteClick,
  isAtBottom,
  scrollToBottom,
  onDropContentClick,
  pendingCount,
  onRevealPending,
  bottomPaddingClassName,
  unreadDividerSerialNo,
  unreadCount,
  boostedDrops,
  boostedDropsDisplayPreference,
  onBoostedDropClick,
  onScrollToUnread,
  onDismissUnread,
  suspendLightDropHydration = false,
  virtualScrollRootMargin,
  winningThreshold,
  winningThresholdMinDurationMs,
  isVotingClosed = false,
  isVotingControlsLocked = false,
}) => {
  const hasNextPage =
    !!waveMessages?.hasNextPage &&
    waveMessages.drops.length >= paginationThreshold;

  const containerRef = scrollContainerCallbackRef ?? scrollContainerRef;
  const anchorRef = bottomAnchorCallbackRef ?? bottomAnchorRef;

  const scrollControls = onScrollToUnread && (
    <WaveDropsScrollControls
      unreadDividerSerialNo={unreadDividerSerialNo ?? null}
      unreadCount={unreadCount}
      scrollContainerRef={scrollContainerRef}
      onScrollToUnread={onScrollToUnread}
      onDismissUnread={onDismissUnread}
      isAtBottom={isAtBottom}
      scrollToBottom={scrollToBottom}
      newMessagesCount={pendingCount}
      onRevealNewMessages={onRevealPending}
    />
  );

  if (isChatWindowingEnabled()) {
    // The providers sit above the list: the virtualizer re-renders the list
    // as rows are measured and scrolled, and the providers need not follow.
    // The expansion state also outlives a long drop's unmount.
    return (
      <ChatVideoPlaybackProvider>
        <WaveDropMobileMenuProvider>
          <WaveDropContentExpansionProvider
            enabled={dropId === null}
            scrollContainerRef={scrollContainerRef}
          >
            <WaveChatVirtualList
              drops={waveMessages?.drops ?? []}
              historyGaps={waveMessages?.historyGaps}
              waveId={waveMessages?.id}
              scrollContainerRef={scrollContainerRef}
              scrollContainerCallbackRef={scrollContainerCallbackRef}
              bottomAnchorRef={anchorRef}
              ref={chatListRef}
              isFetchingOlder={!!waveMessages?.isLoadingNextPage}
              showOlderLoader={hasNextPage}
              onTopIntersection={onTopIntersection}
              bottomPaddingClassName={bottomPaddingClassName}
              onReply={onReply}
              onReplyClick={queueSerialTarget}
              onQuoteClick={onQuoteClick}
              onDropContentClick={onDropContentClick}
              activeDrop={activeDrop}
              serialNo={serialTarget}
              targetDropRef={targetDropRef}
              dropViewDropId={dropId}
              unreadDividerSerialNo={unreadDividerSerialNo}
              boostedDrops={boostedDrops}
              boostedDropsDisplayPreference={
                boostedDropsDisplayPreference ??
                DEFAULT_BOOSTED_DROPS_DISPLAY_PREFERENCE
              }
              onBoostedDropClick={onBoostedDropClick}
              suspendLightDropHydration={suspendLightDropHydration}
              winningThreshold={winningThreshold}
              winningThresholdMinDurationMs={winningThresholdMinDurationMs}
              isVotingClosed={isVotingClosed}
              isVotingControlsLocked={isVotingControlsLocked}
            />
          </WaveDropContentExpansionProvider>
        </WaveDropMobileMenuProvider>
        {scrollControls}
      </ChatVideoPlaybackProvider>
    );
  }

  return (
    <>
      <WaveDropsReverseContainer
        ref={containerRef}
        isFetchingNextPage={!!waveMessages?.isLoadingNextPage}
        hasNextPage={hasNextPage}
        onTopIntersection={onTopIntersection}
        bottomPaddingClassName={bottomPaddingClassName}
      >
        <ChatVideoPlaybackProvider>
          <DropsList
            scrollContainerRef={scrollContainerRef}
            onReplyClick={queueSerialTarget}
            drops={waveMessages?.drops ?? []}
            historyGaps={waveMessages?.historyGaps}
            waveId={waveMessages?.id}
            showWaveInfo={false}
            onReply={onReply}
            showReplyAndQuote={true}
            activeDrop={activeDrop}
            serialNo={serialTarget}
            targetDropRef={targetDropRef}
            onQuoteClick={onQuoteClick}
            parentContainerRef={scrollContainerRef}
            dropViewDropId={dropId}
            onDropContentClick={onDropContentClick}
            unreadDividerSerialNo={unreadDividerSerialNo}
            boostedDrops={boostedDrops}
            boostedDropsDisplayPreference={boostedDropsDisplayPreference}
            onBoostedDropClick={onBoostedDropClick}
            suspendLightDropHydration={suspendLightDropHydration}
            virtualScrollRootMargin={virtualScrollRootMargin}
            winningThreshold={winningThreshold}
            winningThresholdMinDurationMs={winningThresholdMinDurationMs}
            isVotingClosed={isVotingClosed}
            isVotingControlsLocked={isVotingControlsLocked}
            key="drops-list"
          />
        </ChatVideoPlaybackProvider>
        <div ref={anchorRef} style={{ height: "1px" }} />
      </WaveDropsReverseContainer>
      {scrollControls}
    </>
  );
};
