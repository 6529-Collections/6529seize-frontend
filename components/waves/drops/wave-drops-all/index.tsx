"use client";

import { useAuth } from "@/components/auth/Auth";
import { useNotificationsContext } from "@/components/notifications/NotificationsContext";
import { useWaveReplyThreads } from "@/components/waves/drops/reply-threads/WaveReplyThreadsContext";
import {
  fetchDropReplyThreadTarget,
  type DropReplyThreadTarget,
} from "@/services/api/drop-reply-thread-target-api";
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
import { useBoostedDropsDisplayPreference } from "@/hooks/useBoostedDropsDisplayPreference";
import { useWaveBoostedDrops } from "@/hooks/useWaveBoostedDrops";
import { useWaveIsTyping } from "@/hooks/useWaveIsTyping";
import type { ActiveDropState } from "@/types/dropInteractionTypes";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useWaveDropsClipboard } from "./hooks/useWaveDropsClipboard";
import { useDeferredNewestDrops } from "./hooks/useDeferredNewestDrops";
import { useFirstVisibleDropsPainted } from "./hooks/useFirstVisibleDropsPainted";
import { useWaveDropsNotificationRead } from "./hooks/useWaveDropsNotificationRead";
import { useWaveDropsSerialScroll } from "./hooks/useWaveDropsSerialScroll";
import { WaveDropsContent } from "./subcomponents/WaveDropsContent";

const EMPTY_DROPS: Drop[] = [];

type WaveMin = ReturnType<typeof toApiWaveMin>;

// A row's drop keeps its object while neither the stored drop nor the wave
// changed, so memoized rows skip a re-render when another message arrives.
const withFullWaveCache = new WeakMap<
  ExtendedDrop,
  { readonly wave: WaveMin; readonly drop: ExtendedDrop }
>();

const withFullWave = (drop: ExtendedDrop, wave: WaveMin): ExtendedDrop => {
  const cached = withFullWaveCache.get(drop);
  if (cached?.wave === wave) {
    return cached.drop;
  }
  const next = { ...drop, wave };
  withFullWaveCache.set(drop, { wave, drop: next });
  return next;
};
const DEFAULT_VIRTUALIZED_DROPS_PAGE_SIZE = 50;
const MOBILE_ALL_DROPS_VIRTUALIZED_PAGE_SIZE = 25;
const DIRECT_MESSAGE_VIRTUAL_SCROLL_ROOT_MARGIN = "1200px 0px";

const getLatestSerialNo = (drops: readonly Drop[]): number | null => {
  let latest: number | null = null;
  for (const drop of drops) {
    if (
      Number.isFinite(drop.serial_no) &&
      (latest === null || drop.serial_no > latest)
    ) {
      latest = drop.serial_no;
    }
  }
  return latest;
};

const getVirtualizedDropsPageSize = (isMobileAllDropsView: boolean): number =>
  isMobileAllDropsView
    ? MOBILE_ALL_DROPS_VIRTUALIZED_PAGE_SIZE
    : DEFAULT_VIRTUALIZED_DROPS_PAGE_SIZE;

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
  readonly initialThreadReply?: DropReplyThreadTarget | null | undefined;
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
  initialThreadReply,
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
  const [virtualizedDropsPageSize] = useState(() =>
    getVirtualizedDropsPageSize(isMobileDevice && dropId === null)
  );

  const { waveMessages, fetchNextPage, waitAndRevealDrop } =
    useVirtualizedWaveDrops(waveId, dropId, wave, virtualizedDropsPageSize);

  const { setUnreadDividerSerialNo } = useUnreadDivider();

  const [boostedDropsDisplayPreference] = useBoostedDropsDisplayPreference();
  const shouldRenderInsertedBoostedDrops =
    boostedDropsDisplayPreference !== "hidden";
  const virtualScrollRootMargin = isWaveDirectMessage(waveId, wave)
    ? DIRECT_MESSAGE_VIRTUAL_SCROLL_ROOT_MARGIN
    : undefined;

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

  const dropsForClipboard = useMemo(
    () => waveMessages?.drops ?? EMPTY_DROPS,
    [waveMessages?.drops]
  );
  const latestSerialNo = useMemo(
    () => getLatestSerialNo(dropsForClipboard),
    [dropsForClipboard]
  );

  useWaveDropsNotificationRead({
    waveId,
    enabled: Boolean(connectedProfile?.handle),
    isDirectMessage: isWaveDirectMessage(waveId, wave),
    latestSerialNo,
    removeWaveDeliveredNotifications,
  });

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

  const waveMin = useMemo(() => (wave ? toApiWaveMin(wave) : null), [wave]);
  const renderedWaveMessagesWithFullWave = useMemo(() => {
    if (!renderedWaveMessages || !waveMin) {
      return renderedWaveMessages;
    }

    return {
      ...renderedWaveMessages,
      drops: renderedWaveMessages.drops.map(
        (drop: Drop): Drop =>
          drop.type === DropSize.FULL && drop.wave.id === waveMin.id
            ? withFullWave(drop, waveMin)
            : drop
      ),
    };
  }, [renderedWaveMessages, waveMin]);
  const hasVisibleDrops =
    (renderedWaveMessagesWithFullWave?.drops.length ?? 0) > 0;
  const firstVisibleDropsPainted = useFirstVisibleDropsPainted(hasVisibleDrops);

  const typingMessage = useWaveIsTyping(
    waveId,
    connectedProfile?.handle ?? null,
    isMuted,
    { enabled: firstVisibleDropsPainted }
  );

  const { data: boostedDrops } = useWaveBoostedDrops({
    waveId,
    wave,
    enabled: shouldRenderInsertedBoostedDrops && firstVisibleDropsPainted,
  });
  const visibleBoostedDrops =
    shouldRenderInsertedBoostedDrops && firstVisibleDropsPainted
      ? boostedDrops
      : undefined;

  const replyThreads = useWaveReplyThreads();
  const replyThreadStore = replyThreads?.store;
  const collapseAll = replyThreads?.collapseAll;
  const replyTargetRequest = useRef<AbortController | null>(null);

  const {
    serialTarget,
    queueSerialTarget,
    targetDropRef,
    isScrolling,
    cancelSerialScroll,
  } = useWaveDropsSerialScroll({
    waveId,
    dropId,
    initialDrop: initialThreadReply?.parentSerialNo ?? initialDrop,
    replyThreadStore,
    waveMessages,
    fetchNextPage,
    waitAndRevealDrop,
    scrollContainerRef,
    shouldPinToBottom,
    scrollToVisualBottom,
  });

  useEffect(() => {
    if (!replyThreadStore) return;
    replyThreadStore.setLinkedReply(initialThreadReply ?? null);
    if (initialThreadReply) {
      replyThreadStore.setExpanded(initialThreadReply.parentDropId, true);
    }
  }, [collapseAll, initialThreadReply, replyThreadStore]);

  const scrollToBottom = useCallback(() => {
    replyTargetRequest.current?.abort();
    replyThreads?.store.setLinkedReply(null);
    cancelSerialScroll();
    // Jump before offscreen placeholders hydrate and change the scroll range.
    forcePinToBottom("auto");
  }, [cancelSerialScroll, forcePinToBottom, replyThreads]);

  const waveChatScroll = useWaveChatScrollOptional();
  // Navigation handlers are passed to every memoized message row.
  const latestDropsRef = useRef(dropsForClipboard);
  useLayoutEffect(() => {
    latestDropsRef.current = dropsForClipboard;
  }, [dropsForClipboard]);
  useEffect(
    () => () => replyTargetRequest.current?.abort(),
    [collapseAll, replyThreadStore, waveId]
  );
  useEffect(() => {
    // A new link supersedes the lookup. Clearing the URL after reading it does not.
    if (initialDrop !== null) replyTargetRequest.current?.abort();
  }, [initialDrop]);
  const queueVisibleSerialTarget = useCallback(
    (serialNo: number) => {
      replyTargetRequest.current?.abort();
      if (
        !replyThreads ||
        dropId !== null ||
        latestDropsRef.current.some((drop) => drop.serial_no === serialNo)
      ) {
        replyThreads?.store.setLinkedReply(null);
        queueSerialTarget(serialNo);
        return;
      }

      const controller = new AbortController();
      replyTargetRequest.current = controller;
      void fetchDropReplyThreadTarget({
        waveId,
        serialNo,
        collapseAll: replyThreads.collapseAll,
        signal: controller.signal,
      })
        .catch(() => null)
        .then((thread) => {
          if (controller.signal.aborted) return;
          replyThreads.store.setLinkedReply(thread);
          if (thread) replyThreads.store.setExpanded(thread.parentDropId, true);
          queueSerialTarget(thread?.parentSerialNo ?? serialNo);
        });
    },
    [dropId, queueSerialTarget, replyThreads, waveId]
  );
  useEffect(() => {
    if (!waveChatScroll) return;
    return waveChatScroll.registerScrollHandler({
      waveId,
      handler: queueVisibleSerialTarget,
    });
  }, [waveChatScroll, waveId, queueVisibleSerialTarget]);

  const revealPendingDrops = useCallback(() => {
    if ((waveMessages?.drops.length ?? 0) === 0) {
      return;
    }

    revealDeferredPendingDrops();
    scrollToBottom();
  }, [waveMessages, revealDeferredPendingDrops, scrollToBottom]);

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
        queueVisibleSerialTarget(drop.serial_no);
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
    [router, waveId, queueVisibleSerialTarget]
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
        queueSerialTarget={queueVisibleSerialTarget}
        activeDrop={activeDrop}
        serialTarget={serialTarget}
        targetDropRef={targetDropRef}
        onQuoteClick={handleQuoteClick}
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToBottom}
        typingMessage={typingMessage}
        onDropContentClick={onDropContentClick}
        pendingCount={pendingDropsCount}
        onRevealPending={revealPendingDrops}
        bottomPaddingClassName={bottomPaddingClassName}
        boostedDrops={visibleBoostedDrops}
        boostedDropsDisplayPreference={boostedDropsDisplayPreference}
        onBoostedDropClick={queueVisibleSerialTarget}
        onScrollToUnread={queueVisibleSerialTarget}
        unreadCount={unreadCount}
        suspendLightDropHydration={isScrolling || serialTarget !== null}
        virtualScrollRootMargin={virtualScrollRootMargin}
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
        key={`${waveId}:${dropId ?? ""}`}
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
