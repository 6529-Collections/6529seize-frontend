import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import WaveDropsEmptyPlaceholder from "@/components/waves/drops/WaveDropsEmptyPlaceholder";
import { useUnreadDivider } from "@/contexts/wave/UnreadDividerContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { useVirtualizedWaveDrops } from "@/hooks/useVirtualizedWaveDrops";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { RefObject, Ref } from "react";
import { WaveDropsMessageListSection } from "./WaveDropsMessageListSection";
import { WaveDropsTypingIndicator } from "./WaveDropsTypingIndicator";

type WaveMessagesResult = ReturnType<
  typeof useVirtualizedWaveDrops
>["waveMessages"];

interface WaveDropsContentProps {
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
  readonly typingMessage: string | null;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly pendingCount: number;
  readonly onRevealPending: () => void;
  readonly bottomPaddingClassName?: string | undefined;
  readonly boostedDrops?: ApiDrop[] | undefined;
  readonly onBoostedDropClick?: ((serialNo: number) => void) | undefined;
  readonly onScrollToUnread?: ((serialNo: number) => void) | undefined;
  readonly unreadCount?: number | undefined;
  readonly autoCollapseSerials?: ReadonlySet<number> | undefined;
}

export const WaveDropsContent: React.FC<WaveDropsContentProps> = ({
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
  typingMessage,
  onDropContentClick,
  pendingCount,
  onRevealPending,
  bottomPaddingClassName,
  boostedDrops,
  onBoostedDropClick,
  onScrollToUnread,
  unreadCount,
  autoCollapseSerials,
}) => {
  const { unreadDividerSerialNo, setUnreadDividerSerialNo } =
    useUnreadDivider();

  const handleDismissUnread = () => {
    setUnreadDividerSerialNo(null);
  };
  const dropsCount = waveMessages?.drops.length ?? 0;
  const isInitialLoading =
    !!waveMessages?.isLoading &&
    !waveMessages.isLoadingNextPage &&
    dropsCount === 0;
  const isHydrating = !waveMessages;

  if (isHydrating || isInitialLoading) {
    // When the hook is still hydrating, keep showing the loader instead of the empty state.
    return (
      <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-10">
        <CircleLoader size={CircleLoaderSize.XXLARGE} />
      </div>
    );
  }

  if (dropsCount === 0) {
    return <WaveDropsEmptyPlaceholder dropId={dropId} />;
  }

  return (
    <>
      <WaveDropsMessageListSection
        waveMessages={waveMessages}
        dropId={dropId}
        scrollContainerRef={scrollContainerRef}
        scrollContainerCallbackRef={scrollContainerCallbackRef}
        bottomAnchorRef={bottomAnchorRef}
        bottomAnchorCallbackRef={bottomAnchorCallbackRef}
        onTopIntersection={onTopIntersection}
        onScroll={onScroll}
        onReply={onReply}
        onQuote={onQuote}
        queueSerialTarget={queueSerialTarget}
        activeDrop={activeDrop}
        serialTarget={serialTarget}
        targetDropRef={targetDropRef}
        onQuoteClick={onQuoteClick}
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
        onDropContentClick={onDropContentClick}
        pendingCount={pendingCount}
        onRevealPending={onRevealPending}
        bottomPaddingClassName={bottomPaddingClassName}
        unreadDividerSerialNo={unreadDividerSerialNo}
        unreadCount={unreadCount}
        boostedDrops={boostedDrops}
        onBoostedDropClick={onBoostedDropClick}
        onScrollToUnread={onScrollToUnread}
        onDismissUnread={handleDismissUnread}
        autoCollapseSerials={autoCollapseSerials}
      />
      <WaveDropsTypingIndicator typingMessage={typingMessage} />
    </>
  );
};
