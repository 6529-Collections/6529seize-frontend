import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";
import WaveDropsEmptyPlaceholder from "@/components/waves/drops/WaveDropsEmptyPlaceholder";
import { useUnreadDivider } from "@/contexts/wave/UnreadDividerContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { useVirtualizedWaveDrops } from "@/hooks/useVirtualizedWaveDrops";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { MutableRefObject } from "react";
import { WaveDropsMessageListSection } from "./WaveDropsMessageListSection";
import { WaveDropsTypingIndicator } from "./WaveDropsTypingIndicator";

type WaveMessagesResult = ReturnType<
  typeof useVirtualizedWaveDrops
>["waveMessages"];

interface WaveDropsContentProps {
  readonly waveMessages: WaveMessagesResult;
  readonly dropId: string | null;
  readonly scrollContainerRef: MutableRefObject<HTMLDivElement | null>;
  readonly bottomAnchorRef: MutableRefObject<HTMLDivElement | null>;
  readonly onTopIntersection: () => void;
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
  readonly targetDropRef: MutableRefObject<HTMLDivElement | null>;
  readonly onQuoteClick: (drop: ApiDrop) => void;
  readonly isAtBottom: boolean;
  readonly scrollToBottom: () => void;
  readonly typingMessage: string | null;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly pendingCount: number;
  readonly onRevealPending: () => void;
  readonly bottomPaddingClassName?: string | undefined;
}

export const WaveDropsContent: React.FC<WaveDropsContentProps> = ({
  waveMessages,
  dropId,
  scrollContainerRef,
  bottomAnchorRef,
  onTopIntersection,
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
}) => {
  const { unreadDividerSerialNo } = useUnreadDivider();
  const dropsCount = waveMessages?.drops?.length ?? 0;
  const isInitialLoading =
    !!waveMessages?.isLoading &&
    !waveMessages?.isLoadingNextPage &&
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
        bottomAnchorRef={bottomAnchorRef}
        onTopIntersection={onTopIntersection}
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
      />
      <WaveDropsTypingIndicator typingMessage={typingMessage} />
    </>
  );
};
