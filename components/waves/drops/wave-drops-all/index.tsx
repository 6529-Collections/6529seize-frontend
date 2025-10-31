"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

const getDropKey = (drop: Drop) =>
  drop.stableKey ?? drop.stableHash ?? drop.id ?? String(drop.serial_no);

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

  const {
    scrollContainerRef,
    bottomAnchorRef,
    isAtBottom,
    shouldPinToBottom,
    scrollToVisualBottom,
  } = useScrollBehavior();

  const [pendingDrops, setPendingDrops] = useState<Drop[]>([]);
  const lastDropCountRef = useRef<number>(0);
  const lastWaveIdRef = useRef<string | null>(null);
  const pendingDropsRef = useRef<Drop[]>([]);

  const updatePendingDrops = useCallback(
    (updater: (prev: Drop[]) => Drop[])
  ) => {
    setPendingDrops((prev) => {
      const next = updater(prev);
      pendingDropsRef.current = next;
      return next;
    });
  }, []);

  const flushPendingDrops = useCallback(() => {
    if (pendingDropsRef.current.length === 0) return;
    pendingDropsRef.current = [];
    setPendingDrops([]);
  }, []);

  useEffect(() => {
    if (!waveMessages) {
      lastDropCountRef.current = 0;
      lastWaveIdRef.current = null;
      flushPendingDrops();
      return;
    }

    const drops = waveMessages.drops;
    const total = drops.length;
    const currentWaveId = waveMessages.id ?? null;

    if (lastWaveIdRef.current !== currentWaveId) {
      lastWaveIdRef.current = currentWaveId;
      lastDropCountRef.current = 0;
      flushPendingDrops();
    }

    const previousTotal = lastDropCountRef.current;

    lastDropCountRef.current = total;

    if (shouldPinToBottom) {
      if (pendingDropsRef.current.length > 0) {
        flushPendingDrops();
      }
      return;
    }

    if (total > previousTotal) {
      if (previousTotal === 0) {
        return;
      }
      const appended = drops.slice(previousTotal);
      const stableAppended = appended.filter(
        (drop) => !drop.id?.startsWith("temp-")
      );
      if (stableAppended.length > 0) {
        updatePendingDrops((prev) => {
          const existing = new Set(prev.map(getDropKey));
          const merged = [...prev];
          stableAppended.forEach((drop) => {
            const key = getDropKey(drop);
            if (!existing.has(key)) {
              existing.add(key);
              merged.push(drop);
            }
          });
          return merged;
        });
      }
    } else if (total < previousTotal && pendingDropsRef.current.length > 0) {
      const validKeys = new Set(
        drops.map((drop) => getDropKey(drop))
      );
      updatePendingDrops((prev) =>
        prev.filter((drop) => validKeys.has(getDropKey(drop)))
      );
    }
  }, [waveMessages, shouldPinToBottom, flushPendingDrops, updatePendingDrops]);

  const pendingCount = pendingDrops.length;

  const visibleDrops = useMemo(() => {
    if (!waveMessages) return EMPTY_DROPS;
    if (pendingCount === 0) return waveMessages.drops;
    const limit = Math.max(waveMessages.drops.length - pendingCount, 0);
    return waveMessages.drops.slice(0, limit);
  }, [waveMessages, pendingCount]);

  const handleRevealPending = useCallback(() => {
    flushPendingDrops();
    scrollToVisualBottom();
  }, [flushPendingDrops, scrollToVisualBottom]);

  const typingMessage = useWaveIsTyping(
    waveId,
    connectedProfile?.handle ?? null
  );

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
    scrollContainerRef,
    shouldPinToBottom,
    scrollToVisualBottom,
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

  useEffect(() => {
    if (!serialTarget || pendingCount === 0 || !waveMessages) return;
    const hasPendingTarget = pendingDropsRef.current.some(
      (drop) => drop.serial_no === serialTarget
    );
    if (hasPendingTarget) {
      handleRevealPending();
    }
  }, [serialTarget, pendingCount, waveMessages, handleRevealPending]);

  return (
    <div
      ref={containerRef}
      className="tw-flex tw-flex-col tw-h-full tw-justify-end tw-relative tw-overflow-y-auto tw-bg-iron-950">
      <WaveDropsContent
        waveMessages={waveMessages}
        visibleDrops={visibleDrops}
        pendingCount={pendingCount}
        onRevealPending={handleRevealPending}
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
      />
      <WaveDropsScrollingOverlay isVisible={isScrolling} />
    </div>
  );
};

export default WaveDropsAll;
