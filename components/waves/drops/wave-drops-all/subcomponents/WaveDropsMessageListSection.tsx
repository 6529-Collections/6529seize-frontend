import DropsList from "@/components/drops/view/DropsList";
import { WaveDropsReverseContainer } from "@/components/waves/drops/WaveDropsReverseContainer";
import { WaveDropsScrollControls } from "@/components/waves/drops/WaveDropsScrollControls";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { useVirtualizedWaveDrops } from "@/hooks/useVirtualizedWaveDrops";
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
  readonly bottomAnchorRef: RefObject<HTMLDivElement | null>;
  readonly bottomAnchorCallbackRef?: Ref<HTMLDivElement> | undefined;
  readonly onTopIntersection: () => void;
  readonly onScroll?: (() => void) | undefined;
  readonly onReply: ({
    drop,
    partId,
  }: {
    drop: ApiDrop;
    partId: number;
  }) => void;
  readonly onQuote: ({
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
  readonly onBoostedDropClick?: ((serialNo: number) => void) | undefined;
  readonly onScrollToUnread?: ((serialNo: number) => void) | undefined;
  readonly onDismissUnread: () => void;
  readonly autoCollapseSerials?: ReadonlySet<number> | undefined;
}

const MIN_DROPS_FOR_PAGINATION = 25;

export const WaveDropsMessageListSection: React.FC<
  WaveDropsMessageListSectionProps
> = ({
  waveMessages,
  dropId,
  scrollContainerRef,
  scrollContainerCallbackRef,
  bottomAnchorRef,
  bottomAnchorCallbackRef,
  onTopIntersection,
  onScroll,
  onReply,
  onQuote,
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
  onBoostedDropClick,
  onScrollToUnread,
  onDismissUnread,
  autoCollapseSerials,
}) => {
  const hasNextPage =
    !!waveMessages?.hasNextPage &&
    waveMessages.drops.length >= MIN_DROPS_FOR_PAGINATION;

  const containerRef = scrollContainerCallbackRef ?? scrollContainerRef;
  const anchorRef = bottomAnchorCallbackRef ?? bottomAnchorRef;

  return (
    <>
      <WaveDropsReverseContainer
        ref={containerRef}
        isFetchingNextPage={!!waveMessages?.isLoadingNextPage}
        hasNextPage={hasNextPage}
        onTopIntersection={onTopIntersection}
        bottomPaddingClassName={bottomPaddingClassName}
        onScroll={onScroll}
      >
        <DropsList
          scrollContainerRef={scrollContainerRef}
          onReplyClick={queueSerialTarget}
          drops={waveMessages?.drops ?? []}
          showWaveInfo={false}
          onReply={onReply}
          onQuote={onQuote}
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
          onBoostedDropClick={onBoostedDropClick}
          autoCollapseSerials={autoCollapseSerials}
          key="drops-list"
        />
        <div ref={anchorRef} style={{ height: "1px" }} />
      </WaveDropsReverseContainer>
      {onScrollToUnread && (
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
      )}
    </>
  );
};
