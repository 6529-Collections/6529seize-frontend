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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useWaveDropsClipboard } from "./hooks/useWaveDropsClipboard";
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
  readonly onQuote: ({
    drop,
    partId,
  }: {
    drop: ApiDrop;
    partId: number;
  }) => void;
  readonly activeDrop: ActiveDropState | null;
  readonly initialDrop: number | null;
  readonly dividerSerialNo?: number | null | undefined;
  readonly onDropContentClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly bottomPaddingClassName?: string | undefined;
  readonly isMuted?: boolean | undefined;
}

const WaveDropsAllInner: React.FC<WaveDropsAllProps> = ({
  waveId,
  dropId,
  onReply,
  onQuote,
  activeDrop,
  initialDrop,
  dividerSerialNo,
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
    bottomAnchorRef,
    isAtBottom,
    shouldPinToBottom,
    scrollToVisualBottom,
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

  const [visibleLatestSerial, setVisibleLatestSerial] = useState<number | null>(
    null
  );

  const prevLatestSerialNoRef = useRef<number | null>(null);

  useEffect(() => {
    setVisibleLatestSerial(null);
    prevLatestSerialNoRef.current = null;
    setUnreadDividerSerialNo(dividerSerialNo ?? null);
  }, [waveId, dividerSerialNo, setUnreadDividerSerialNo]);

  const latestSerialNo = waveMessages?.drops[0]?.serial_no ?? null;

  useEffect(() => {
    if (latestSerialNo === null) {
      return;
    }

    const prevSerial = prevLatestSerialNoRef.current;
    prevLatestSerialNoRef.current = latestSerialNo;

    if (prevSerial !== null && latestSerialNo > prevSerial && !isAtBottom) {
      setUnreadDividerSerialNo((current) => {
        if (current === null) {
          return prevSerial + 1;
        }
        return current;
      });
    }
  }, [latestSerialNo, isAtBottom, setUnreadDividerSerialNo]);

  useEffect(() => {
    if (latestSerialNo === null) {
      return;
    }

    setVisibleLatestSerial((current) => {
      if (current === null) {
        return latestSerialNo;
      }

      if (!isAppleMobile) {
        return latestSerialNo;
      }

      if (shouldPinToBottom) {
        return latestSerialNo;
      }

      return current;
    });
  }, [latestSerialNo, isAppleMobile, shouldPinToBottom]);

  const renderedWaveMessages = useMemo(() => {
    if (!waveMessages) {
      return waveMessages;
    }

    if (!isAppleMobile || visibleLatestSerial === null) {
      return waveMessages;
    }

    const filteredDrops = waveMessages.drops.filter((drop) => {
      if (typeof drop.serial_no !== "number") {
        return true;
      }
      return drop.serial_no <= visibleLatestSerial;
    });

    if (filteredDrops.length === waveMessages.drops.length) {
      return waveMessages;
    }

    return {
      ...waveMessages,
      drops: filteredDrops,
    };
  }, [waveMessages, isAppleMobile, visibleLatestSerial]);

  const pendingDropsCount = useMemo(() => {
    if (
      !isAppleMobile ||
      !waveMessages?.drops?.length ||
      visibleLatestSerial === null
    ) {
      return 0;
    }

    return waveMessages.drops.reduce((count, drop) => {
      if (typeof drop.serial_no !== "number") {
        return count;
      }
      return drop.serial_no > visibleLatestSerial ? count + 1 : count;
    }, 0);
  }, [isAppleMobile, waveMessages?.drops, visibleLatestSerial]);

  const { serialTarget, queueSerialTarget, targetDropRef, isScrolling } =
    useWaveDropsSerialScroll({
      waveId,
      dropId,
      initialDrop,
      waveMessages,
      fetchNextPage,
      waitAndRevealDrop,
      scrollContainerRef,
      shouldPinToBottom,
      scrollToVisualBottom,
    });

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

    const newestSerial = waveMessages.drops[0]?.serial_no;
    setVisibleLatestSerial(newestSerial!);
    scrollToVisualBottom();
  }, [waveMessages?.drops, scrollToVisualBottom]);

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

  return (
    <div
      ref={containerRef}
      className="tw-relative tw-flex tw-h-full tw-flex-col tw-justify-end tw-overflow-hidden tw-bg-iron-950"
    >
      <WaveDropsContent
        waveMessages={renderedWaveMessages}
        dropId={dropId}
        scrollContainerRef={scrollContainerRef}
        bottomAnchorRef={bottomAnchorRef}
        onTopIntersection={handleTopIntersection}
        onReply={onReply}
        onQuote={onQuote}
        queueSerialTarget={queueSerialTarget}
        activeDrop={activeDrop}
        serialTarget={serialTarget}
        targetDropRef={targetDropRef}
        onQuoteClick={handleQuoteClick}
        isAtBottom={isAtBottom}
        scrollToBottom={scrollToVisualBottom}
        typingMessage={typingMessage}
        onDropContentClick={onDropContentClick}
        pendingCount={pendingDropsCount}
        onRevealPending={revealPendingDrops}
        bottomPaddingClassName={bottomPaddingClassName}
        boostedDrops={boostedDrops}
        onBoostedDropClick={queueSerialTarget}
      />
      <WaveDropsScrollingOverlay isVisible={isScrolling} />
    </div>
  );
};

const WaveDropsAll: React.FC<WaveDropsAllProps> = ({
  waveId,
  dropId,
  onReply,
  onQuote,
  activeDrop,
  initialDrop,
  dividerSerialNo,
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
        waveId={waveId}
        dropId={dropId}
        onReply={onReply}
        onQuote={onQuote}
        activeDrop={activeDrop}
        initialDrop={initialDrop}
        dividerSerialNo={dividerSerialNo}
        onDropContentClick={onDropContentClick}
        bottomPaddingClassName={bottomPaddingClassName}
        isMuted={isMuted}
      />
    </UnreadDividerProvider>
  );
};

export default WaveDropsAll;
