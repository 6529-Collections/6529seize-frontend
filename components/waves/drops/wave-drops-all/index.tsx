"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/Auth";
import { useNotificationsContext } from "@/components/notifications/NotificationsContext";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { Drop, DropSize, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { isWaveDirectMessage } from "@/helpers/waves/wave.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useScrollBehavior } from "@/hooks/useScrollBehavior";
import { useVirtualizedWaveDrops } from "@/hooks/useVirtualizedWaveDrops";
import { useWaveIsTyping } from "@/hooks/useWaveIsTyping";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { ActiveDropState } from "@/types/dropInteractionTypes";
import WaveDropsScrollingOverlay from "@/components/waves/drops/WaveDropsScrollingOverlay";
import { useWaveDropsNotificationRead } from "./hooks/useWaveDropsNotificationRead";
import { useWaveDropsSerialScroll } from "./hooks/useWaveDropsSerialScroll";
import { useWaveDropsClipboard } from "./hooks/useWaveDropsClipboard";
import { WaveDropsContent } from "./subcomponents/WaveDropsContent";
import { useWaveChatScrollOptional } from "@/contexts/wave/WaveChatScrollContext";

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
  readonly onDropContentClick?: (drop: ExtendedDrop) => void;
}

const WaveDropsAll: React.FC<WaveDropsAllProps> = ({
  waveId,
  dropId,
  onReply,
  onQuote,
  activeDrop,
  initialDrop,
  onDropContentClick,
}) => {

  const router = useRouter();
  const { removeWaveDeliveredNotifications } = useNotificationsContext();
  const { connectedProfile } = useAuth();
  const { isAppleMobile } = useDeviceInfo();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { waveMessages, fetchNextPage, waitAndRevealDrop } =
    useVirtualizedWaveDrops(waveId, dropId);

  const typingMessage = useWaveIsTyping(
    waveId,
    connectedProfile?.handle ?? null
  );

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

  useEffect(() => {
    setVisibleLatestSerial(null);
  }, [waveId]);

  const latestSerialNo = waveMessages?.drops?.[0]?.serial_no ?? null;

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

  const {
    serialTarget,
    queueSerialTarget,
    targetDropRef,
    isScrolling,
  } = useWaveDropsSerialScroll({
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

    const newestSerial = waveMessages.drops[0].serial_no;
    setVisibleLatestSerial(newestSerial);
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
      if (drop.wave.id !== waveId) {
        const waveDetails =
          (drop.wave as unknown as {
            chat?: { scope?: { group?: { is_direct_message?: boolean } } };
          }) ?? undefined;
        const isDirectMessage = isWaveDirectMessage(
          drop.wave.id,
          waveDetails
        );
        const href = getWaveRoute({
          waveId: drop.wave.id,
          serialNo: drop.serial_no,
          isDirectMessage,
          isApp: false,
        });
        router.push(href);
      } else {
        queueSerialTarget(drop.serial_no);
      }
    },
    [router, waveId, queueSerialTarget]
  );

  return (
    <div
      ref={containerRef}
      className="tw-flex tw-flex-col tw-h-full tw-justify-end tw-relative tw-overflow-y-auto tw-bg-iron-950">
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
      />
      <WaveDropsScrollingOverlay isVisible={isScrolling} />
    </div>
  );
};

export default WaveDropsAll;
