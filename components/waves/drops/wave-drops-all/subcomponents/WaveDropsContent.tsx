import { usePublicWaveFeedReady } from "@/components/waves/PublicWaveFeedReady";
import WaveChatLoading from "@/components/waves/WaveChatLoading";
import WaveDropsEmptyPlaceholder from "@/components/waves/drops/WaveDropsEmptyPlaceholder";
import { useUnreadDivider } from "@/contexts/wave/UnreadDividerContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import type { useVirtualizedWaveDrops } from "@/hooks/useVirtualizedWaveDrops";
import type { BoostedDropsDisplayPreference } from "@/types/boosted-drops.types";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import type { RefObject, Ref } from "react";
import { WaveDropsMessageListSection } from "./WaveDropsMessageListSection";
import { WaveDropsTypingIndicator } from "./WaveDropsTypingIndicator";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

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
  readonly typingMessage: string | null;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly pendingCount: number;
  readonly onRevealPending: () => void;
  readonly bottomPaddingClassName?: string | undefined;
  readonly boostedDrops?: ApiDrop[] | undefined;
  readonly boostedDropsDisplayPreference?:
    | BoostedDropsDisplayPreference
    | undefined;
  readonly onBoostedDropClick?: ((serialNo: number) => void) | undefined;
  readonly onScrollToUnread?: ((serialNo: number) => void) | undefined;
  readonly unreadCount?: number | undefined;
  readonly suspendLightDropHydration?: boolean | undefined;
  readonly virtualScrollRootMargin?: string | undefined;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
}

export const WaveDropsContent: React.FC<WaveDropsContentProps> = ({
  waveMessages,
  dropId,
  scrollContainerRef,
  scrollContainerCallbackRef,
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
  typingMessage,
  onDropContentClick,
  pendingCount,
  onRevealPending,
  bottomPaddingClassName,
  boostedDrops,
  boostedDropsDisplayPreference,
  onBoostedDropClick,
  onScrollToUnread,
  unreadCount,
  suspendLightDropHydration = false,
  virtualScrollRootMargin,
  winningThreshold,
  winningThresholdMinDurationMs,
  isVotingClosed = false,
  isVotingControlsLocked = false,
}) => {
  const locale = useBrowserLocale();
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
  const hasDropError = !!waveMessages?.isError;
  usePublicWaveFeedReady(!isHydrating && (hasDropError || !isInitialLoading));

  if (isHydrating || (isInitialLoading && !hasDropError)) {
    // When the hook is still hydrating, keep showing the loader instead of the empty state.
    return (
      <WaveChatLoading
        showHeader={false}
        showTabs={false}
        showComposer={false}
      />
    );
  }

  const errorNotice = hasDropError ? (
    <div className="tw-flex tw-flex-col tw-items-center tw-gap-3 tw-p-4">
      <p role="alert" className="tw-m-0 tw-text-sm tw-text-iron-300">
        {t(locale, "waves.threadLoadError")}
      </p>
      {waveMessages.retryDropMessages && (
        <button
          type="button"
          disabled={waveMessages.isLoading}
          onClick={() => {
            void waveMessages.retryDropMessages?.();
          }}
          className="tw-min-h-11 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-4 tw-text-sm tw-text-iron-100 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 disabled:tw-opacity-50"
        >
          {t(locale, "waves.loadingRetry")}
        </button>
      )}
    </div>
  ) : null;

  if (dropsCount === 0) {
    return errorNotice ?? <WaveDropsEmptyPlaceholder dropId={dropId} />;
  }

  return (
    <>
      {errorNotice}
      <WaveDropsMessageListSection
        waveMessages={waveMessages}
        dropId={dropId}
        scrollContainerRef={scrollContainerRef}
        scrollContainerCallbackRef={scrollContainerCallbackRef}
        bottomAnchorRef={bottomAnchorRef}
        bottomAnchorCallbackRef={bottomAnchorCallbackRef}
        paginationThreshold={paginationThreshold}
        onTopIntersection={onTopIntersection}
        onReply={onReply}
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
        boostedDropsDisplayPreference={boostedDropsDisplayPreference}
        onBoostedDropClick={onBoostedDropClick}
        onScrollToUnread={onScrollToUnread}
        onDismissUnread={handleDismissUnread}
        suspendLightDropHydration={suspendLightDropHydration}
        virtualScrollRootMargin={virtualScrollRootMargin}
        winningThreshold={winningThreshold}
        winningThresholdMinDurationMs={winningThresholdMinDurationMs}
        isVotingClosed={isVotingClosed}
        isVotingControlsLocked={isVotingControlsLocked}
      />
      <WaveDropsTypingIndicator typingMessage={typingMessage} />
    </>
  );
};
