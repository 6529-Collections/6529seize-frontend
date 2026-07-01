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
import type { ApiWave } from "@/generated/models/ApiWave";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import type { Drop, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import {
  isWaveDirectMessage,
  toApiWaveMin,
} from "@/helpers/waves/wave.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useScrollBehavior } from "@/hooks/useScrollBehavior";
import { useVirtualizedWaveDrops } from "@/hooks/useVirtualizedWaveDrops";
import { useWaveBoostedDrops } from "@/hooks/useWaveBoostedDrops";
import { useWaveIsTyping } from "@/hooks/useWaveIsTyping";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useWaveDropsClipboard } from "./hooks/useWaveDropsClipboard";
import { useDeferredNewestDrops } from "./hooks/useDeferredNewestDrops";
import { useWaveDropsNotificationRead } from "./hooks/useWaveDropsNotificationRead";
import { useWaveDropsSerialScroll } from "./hooks/useWaveDropsSerialScroll";
import { WaveDropsContent } from "./subcomponents/WaveDropsContent";

const EMPTY_DROPS: Drop[] = [];
const DEFAULT_VIRTUALIZED_DROPS_PAGE_SIZE = 50;
const MOBILE_ALL_DROPS_VIRTUALIZED_PAGE_SIZE = 25;

interface WaveDropsAllProps {
  readonly waveId: string;
  readonly wave?: ApiWave | undefined;
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
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
}

const WaveDropsAllInner: React.FC<WaveDropsAllProps> = ({
  waveId,
  wave,
  dropId,
  onReply,
  activeDrop,
  initialDrop,
  dividerSerialNo,
  unreadCount,
  onDropContentClick,
  bottomPaddingClassName,
  isMuted = false,
  winningThreshold,
  winningThresholdMinDurationMs,
  isVotingClosed = false,
  isVotingControlsLocked = false,
}) => {
  const router = useRouter();
  const { removeWaveDeliveredNotifications } = useNotificationsContext();
  const { connectedProfile } = useAuth();
  const { isAppleMobile, isMobileDevice } = useDeviceInfo();
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Render-window reduction applies to all mobile webviews; isAppleMobile below
  // only gates the iOS-specific newest-drop deferral behavior.
  const virtualizedDropsPageSize =
    isMobileDevice && dropId === null
      ? MOBILE_ALL_DROPS_VIRTUALIZED_PAGE_SIZE
      : DEFAULT_VIRTUALIZED_DROPS_PAGE_SIZE;

  const { waveMessages, fetchNextPage, waitAndRevealDrop } =
    useVirtualizedWaveDrops(waveId, dropId, wave, virtualizedDropsPageSize);

  const { setUnreadDividerSerialNo } = useUnreadDivider();

  const typingMessage = useWaveIsTyping(
    waveId,
    connectedProfile?.handle ?? null,
    isMuted
  );

  const { data: boostedDrops } = useWaveBoostedDrops({ waveId, wave });

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
    enabled: Boolean(connectedProfile?.handle),
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

  const renderedWaveMessagesWithFullWave = useMemo(() => {
    if (!renderedWaveMessages || !wave) {
      return renderedWaveMessages;
    }

    const waveMin = toApiWaveMin(wave);
    return {
      ...renderedWaveMessages,
      drops: renderedWaveMessages.drops.map(
        (drop: Drop): Drop =>
          drop.type === DropSize.FULL && drop.wave.id === wave.id
            ? { ...drop, wave: waveMin }
            : drop
      ),
    };
  }, [renderedWaveMessages, wave]);

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
    if ((waveMessages?.drops.length ?? 0) === 0) {
      return;
    }

    revealDeferredPendingDrops();
    forcePinToBottom();
  }, [waveMessages, revealDeferredPendingDrops, forcePinToBottom]);

  const canFetchMoreDrops =
    !!waveMessages &&
    (waveMessages.hasMoreLocal || waveMessages.hasNextPage) &&
    !waveMessages.isLoading &&
    !waveMessages.isLoadingNextPage;

  const handleTopIntersection = useCallback(() => {
    if (!canFetchMoreDrops) {
      return;
    }

    void fetchNextPage(
      {
        waveId,
        type: DropSize.FULL,
      },
      dropId
    ).catch(() => undefined);
  }, [canFetchMoreDrops, fetchNextPage, waveId, dropId]);

  const handleQuoteClick = useCallback(
    (drop: ApiDrop) => {
      if (drop.wave.id === waveId) {
        queueSerialTarget(drop.serial_no);
      } else {
        const waveDetails = drop.wave as unknown as {
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
        };
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

  return (
    <div
      ref={containerRef}
      className="tw-relative tw-flex tw-h-full tw-flex-col tw-justify-end tw-overflow-hidden tw-bg-iron-950"
    >
      <WaveDropsContent
        waveMessages={renderedWaveMessagesWithFullWave}
        dropId={dropId}
        scrollContainerRef={scrollContainerRef}
        scrollContainerCallbackRef={scrollContainerCallbackRef}
        bottomAnchorRef={bottomAnchorRef}
        bottomAnchorCallbackRef={bottomAnchorCallbackRef}
        paginationThreshold={virtualizedDropsPageSize}
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
        suspendLightDropHydration={isScrolling || serialTarget !== null}
        winningThreshold={winningThreshold}
        winningThresholdMinDurationMs={winningThresholdMinDurationMs}
        isVotingClosed={isVotingClosed}
        isVotingControlsLocked={isVotingControlsLocked}
      />
      <WaveDropsScrollingOverlay isVisible={isScrolling} />
    </div>
  );
};

export const WaveDropsAllWithoutProvider: React.FC<WaveDropsAllProps> =
  WaveDropsAllInner;

const WaveDropsAll: React.FC<WaveDropsAllProps> = ({
  waveId,
  wave,
  dropId,
  onReply,
  activeDrop,
  initialDrop,
  dividerSerialNo,
  unreadCount,
  onDropContentClick,
  bottomPaddingClassName,
  isMuted = false,
  winningThreshold,
  winningThresholdMinDurationMs,
  isVotingClosed = false,
  isVotingControlsLocked = false,
}) => {
  return (
    <UnreadDividerProvider
      initialSerialNo={dividerSerialNo ?? null}
      key={`unread-divider-${waveId}`}
    >
      <WaveDropsAllInner
        key={waveId}
        waveId={waveId}
        wave={wave}
        dropId={dropId}
        onReply={onReply}
        activeDrop={activeDrop}
        initialDrop={initialDrop}
        dividerSerialNo={dividerSerialNo}
        unreadCount={unreadCount}
        onDropContentClick={onDropContentClick}
        bottomPaddingClassName={bottomPaddingClassName}
        isMuted={isMuted}
        winningThreshold={winningThreshold}
        winningThresholdMinDurationMs={winningThresholdMinDurationMs}
        isVotingClosed={isVotingClosed}
        isVotingControlsLocked={isVotingControlsLocked}
      />
    </UnreadDividerProvider>
  );
};

export default WaveDropsAll;
