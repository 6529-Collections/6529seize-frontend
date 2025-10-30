"use client";

import { useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/Auth";
import { useNotificationsContext } from "@/components/notifications/NotificationsContext";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import { Drop, DropSize, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { isWaveDirectMessage } from "@/helpers/waves/wave.helpers";
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
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { waveMessages, fetchNextPage, waitAndRevealDrop } =
    useVirtualizedWaveDrops(waveId, dropId);

  const typingMessage = useWaveIsTyping(
    waveId,
    connectedProfile?.handle ?? null
  );

  const scrollBehavior = useScrollBehavior();

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
    scrollContainerRef: scrollBehavior.scrollContainerRef,
    shouldPinToBottom: scrollBehavior.shouldPinToBottom,
    scrollToVisualBottom: scrollBehavior.scrollToVisualBottom,
  });

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
        waveMessages={waveMessages}
        dropId={dropId}
        scrollContainerRef={scrollBehavior.scrollContainerRef}
        bottomAnchorRef={scrollBehavior.bottomAnchorRef}
        onTopIntersection={handleTopIntersection}
        onReply={onReply}
        onQuote={onQuote}
        queueSerialTarget={queueSerialTarget}
        activeDrop={activeDrop}
        serialTarget={serialTarget}
        targetDropRef={targetDropRef}
        onQuoteClick={handleQuoteClick}
        isAtBottom={scrollBehavior.isAtBottom}
        scrollToBottom={scrollBehavior.scrollToVisualBottom}
        typingMessage={typingMessage}
        onDropContentClick={onDropContentClick}
      />
      <WaveDropsScrollingOverlay isVisible={isScrolling} />
    </div>
  );
};

export default WaveDropsAll;
