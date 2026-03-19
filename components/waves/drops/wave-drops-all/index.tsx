"use client";

import { useAuth } from "@/components/auth/Auth";
import { useNotificationsContext } from "@/components/notifications/NotificationsContext";
import WaveDropsScrollingOverlay from "@/components/waves/drops/WaveDropsScrollingOverlay";
import {
  UnreadDividerProvider,
  useUnreadDivider,
} from "@/contexts/wave/UnreadDividerContext";
import { useWaveChatScrollOptional } from "@/contexts/wave/WaveChatScrollContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import type { Drop, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { isWaveDirectMessage } from "@/helpers/waves/wave.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useScrollBehavior } from "@/hooks/useScrollBehavior";
import { useVirtualizedWaveDrops } from "@/hooks/useVirtualizedWaveDrops";
import { useWaveBoostedDrops } from "@/hooks/useWaveBoostedDrops";
import { useWaveIsTyping } from "@/hooks/useWaveIsTyping";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  TweetPreviewModeProvider,
  type TweetPreviewMode,
} from "@/components/tweets/TweetPreviewModeContext";
import { useWaveDropsClipboard } from "./hooks/useWaveDropsClipboard";
import { useDeferredNewestDrops } from "./hooks/useDeferredNewestDrops";
import { useWaveDropsNotificationRead } from "./hooks/useWaveDropsNotificationRead";
import { useWaveDropsSerialScroll } from "./hooks/useWaveDropsSerialScroll";
import { WaveDropsContent } from "./subcomponents/WaveDropsContent";

const EMPTY_DROPS: Drop[] = [];

interface WaveDropsAllProps {
  readonly waveId: string;
  readonly dropId: string | null;
  readonly onReply: ({
    drop,
    partId,
  }: {
    drop: ApiDrop;
    partId: number;
  }) => void;
  readonly activeDrop: ActiveDropState | null;
  readonly initialDrop: number | null;
  readonly dividerSerialNo?: number | null | undefined;
  readonly unreadCount?: number | undefined;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly bottomPaddingClassName?: string | undefined;
  readonly isMuted?: boolean | undefined;
}

const WaveDropsAllInner: React.FC<WaveDropsAllProps> = ({
  waveId,
  dropId,
  onReply,
  activeDrop,
  initialDrop,
  dividerSerialNo,
  unreadCount,
  onDropContentClick,
  bottomPaddingClassName,
  isMuted = false,
}) => {
  const router = useRouter();
  const { removeWaveDeliveredNotifications } = useNotificationsContext();
  const { connectedProfile } = useAuth();
  const { isAppleMobile } = useDeviceInfo();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { waveMessages, fetchNextPage, waitAndRevealDrop } =
    useVirtualizedWaveDrops(waveId, dropId);

  const { setUnreadDividerSerialNo } = useUnreadDivider();

  const typingMessage = useWaveIsTyping(
    waveId,
    connectedProfile?.handle ?? null,
    isMuted
  );

  const { data: boostedDrops } = useWaveBoostedDrops({ waveId });

  const scrollBehavior = useScrollBehavior();
  const {
    scrollContainerRef,
    scrollContainerCallbackRef,
    bottomAnchorRef,
    bottomAnchorCallbackRef,
    isAtBottom,
    shouldPinToBottom,
    scrollToVisualBottom,
    forcePinToBottom,
  } = scrollBehavior;

  useWaveDropsNotificationRead({
    waveId,
    removeWaveDeliveredNotifications,
  });

  const dropsForClipboard = useMemo(
    () => waveMessages?.drops ?? EMPTY_DROPS,
    [waveMessages?.drops]
  );

  useWaveDropsClipboard({
    containerRef,
    drops: dropsForClipboard,
  });

  const initializedWaveRef = useRef<string | null>(null);

  useEffect(() => {
    if (initializedWaveRef.current === waveId) {
      return;
    }
    initializedWaveRef.current = waveId;
    setUnreadDividerSerialNo(dividerSerialNo ?? null);
  }, [waveId, dividerSerialNo, setUnreadDividerSerialNo]);

  const {
    renderedWaveMessages,
    pendingDropsCount,
    revealPendingDrops: revealDeferredPendingDrops,
  } = useDeferredNewestDrops({
    waveId,
    isAppleMobile,
    waveMessages,
    shouldPinToBottom,
  });

  const {
    serialTarget,
    queueSerialTarget,
    targetDropRef,
    isScrolling,
    scrollBaselineSerials,
    frozenAutoCollapseSerials,
  } = useWaveDropsSerialScroll({
    waveId,
    dropId,
    initialDrop,
    waveMessages,
    renderedWaveMessages,
    fetchNextPage,
    waitAndRevealDrop,
    scrollContainerRef,
    shouldPinToBottom,
    scrollToVisualBottom,
  });

  const autoCollapseSerials = useMemo(() => {
    if (!isScrolling || !scrollBaselineSerials) {
      return frozenAutoCollapseSerials;
    }

    const drops = renderedWaveMessages?.drops;
    if (!drops || drops.length === 0) {
      return frozenAutoCollapseSerials;
    }

    const next = new Set(frozenAutoCollapseSerials);
    for (const drop of drops) {
      const serialNo = drop.serial_no;
      if (typeof serialNo !== "number") {
        continue;
      }
      if (!scrollBaselineSerials.has(serialNo) && !next.has(serialNo)) {
        next.add(serialNo);
      }
    }

    return next;
  }, [
    isScrolling,
    scrollBaselineSerials,
    renderedWaveMessages?.drops,
    frozenAutoCollapseSerials,
  ]);

  const waveChatScroll = useWaveChatScrollOptional();
  useEffect(() => {
    if (!waveChatScroll) return;
    return waveChatScroll.registerScrollHandler({
      waveId,
      handler: queueSerialTarget,
    });
  }, [waveChatScroll, waveId, queueSerialTarget]);

  const revealPendingDrops = useCallback(() => {
    if (!waveMessages?.drops?.length) {
      return;
    }

    revealDeferredPendingDrops();
    forcePinToBottom();
  }, [waveMessages, revealDeferredPendingDrops, forcePinToBottom]);

  const handleTopIntersection = useCallback(async () => {
    if (
      waveMessages?.hasNextPage &&
      !waveMessages?.isLoading &&
      !waveMessages?.isLoadingNextPage
    ) {
      await fetchNextPage(
        {
          waveId,
          type: DropSize.FULL,
        },
        dropId
      );
    }
  }, [
    waveMessages?.hasNextPage,
    waveMessages?.isLoading,
    waveMessages?.isLoadingNextPage,
    fetchNextPage,
    waveId,
    dropId,
  ]);

  const handleQuoteClick = useCallback(
    (drop: ApiDrop) => {
      if (drop.wave.id === waveId) {
        queueSerialTarget(drop.serial_no);
      } else {
        const waveDetails =
          (drop.wave as unknown as {
            chat?:
              | {
                  scope?:
                    | {
                        group?:
                          | { is_direct_message?: boolean | undefined }
                          | undefined;
                      }
                    | undefined;
                }
              | undefined;
          }) ?? undefined;
        const isDirectMessage = isWaveDirectMessage(drop.wave.id, waveDetails);
        const href = getWaveRoute({
          waveId: drop.wave.id,
          serialNo: drop.serial_no,
          isDirectMessage,
          isApp: false,
        });
        router.push(href);
      }
    },
    [router, waveId, queueSerialTarget]
  );

  const tweetPreviewMode: TweetPreviewMode = "never";

  return (
    <div
      ref={containerRef}
      className="tw-relative tw-flex tw-h-full tw-flex-col tw-justify-end tw-overflow-hidden tw-bg-iron-950"
    >
      <TweetPreviewModeProvider mode={tweetPreviewMode}>
        <WaveDropsContent
          waveMessages={renderedWaveMessages}
          dropId={dropId}
          scrollContainerRef={scrollContainerRef}
          scrollContainerCallbackRef={scrollContainerCallbackRef}
          bottomAnchorRef={bottomAnchorRef}
          bottomAnchorCallbackRef={bottomAnchorCallbackRef}
          onTopIntersection={handleTopIntersection}
          onReply={onReply}
          queueSerialTarget={queueSerialTarget}
          activeDrop={activeDrop}
          serialTarget={serialTarget}
          targetDropRef={targetDropRef}
          onQuoteClick={handleQuoteClick}
          isAtBottom={isAtBottom}
          scrollToBottom={forcePinToBottom}
          typingMessage={typingMessage}
          onDropContentClick={onDropContentClick}
          pendingCount={pendingDropsCount}
          onRevealPending={revealPendingDrops}
          bottomPaddingClassName={bottomPaddingClassName}
          boostedDrops={boostedDrops}
          onBoostedDropClick={queueSerialTarget}
          onScrollToUnread={queueSerialTarget}
          unreadCount={unreadCount}
          autoCollapseSerials={autoCollapseSerials}
        />
      </TweetPreviewModeProvider>
      <WaveDropsScrollingOverlay isVisible={isScrolling} />
    </div>
  );
};

export const WaveDropsAllWithoutProvider: React.FC<WaveDropsAllProps> =
  WaveDropsAllInner;

const WaveDropsAll: React.FC<WaveDropsAllProps> = ({
  waveId,
  dropId,
  onReply,
  activeDrop,
  initialDrop,
  dividerSerialNo,
  unreadCount,
  onDropContentClick,
  bottomPaddingClassName,
  isMuted = false,
}) => {
  return (
    <UnreadDividerProvider
      initialSerialNo={dividerSerialNo ?? null}
      key={`unread-divider-${waveId}`}
    >
      <WaveDropsAllInner
        key={waveId}
        waveId={waveId}
        dropId={dropId}
        onReply={onReply}
        activeDrop={activeDrop}
        initialDrop={initialDrop}
        dividerSerialNo={dividerSerialNo}
        unreadCount={unreadCount}
        onDropContentClick={onDropContentClick}
        bottomPaddingClassName={bottomPaddingClassName}
        isMuted={isMuted}
      />
    </UnreadDividerProvider>
  );
};

export default WaveDropsAll;
