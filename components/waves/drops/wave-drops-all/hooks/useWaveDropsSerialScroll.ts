import type { ExpandedReplyThreadsStore } from "@/components/waves/drops/reply-threads/WaveReplyThreadsContext";
import type { DropReplyThreadTarget } from "@/services/api/drop-reply-thread-target-api";
import { DropSize } from "@/helpers/waves/drop.helpers";
import type { useVirtualizedWaveDrops } from "@/hooks/useVirtualizedWaveDrops";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { delay } from "../utils/delay";
import {
  observeSerialScrollTarget,
  type SerialScrollAnchor,
} from "../utils/observeSerialScrollTarget";

type VirtualizedWaveDropsResult = ReturnType<typeof useVirtualizedWaveDrops>;
type WaveMessagesResult = VirtualizedWaveDropsResult["waveMessages"];
type FetchNextPage = VirtualizedWaveDropsResult["fetchNextPage"];
type WaitAndRevealDrop = VirtualizedWaveDropsResult["waitAndRevealDrop"];

const SCROLL_OPERATION_TIMEOUT = 30000;
const TARGET_RENDER_TIMEOUT = 15000;
const TARGET_RENDER_POLL_MS = 100;
const INSTANT_SCROLL_RETRY_MS = 450;
const CACHED_JUMP_OVERLAY_DELAY_MS = 250;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const getContainerScrollBounds = (
  container: HTMLDivElement
): { readonly max: number; readonly min: number } => {
  const scrollRange = Math.max(
    0,
    container.scrollHeight - container.clientHeight
  );
  const flexDirection =
    container.style.flexDirection ||
    globalThis.getComputedStyle?.(container).flexDirection;

  if (flexDirection === "column-reverse") {
    return { min: -scrollRange, max: 0 };
  }

  return { min: 0, max: scrollRange };
};

const scrollElementIntoContainerCenter = ({
  behavior,
  container,
  target,
}: {
  readonly behavior: ScrollBehavior;
  readonly container: HTMLDivElement;
  readonly target: HTMLDivElement;
}) => {
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const containerCenter = containerRect.top + containerRect.height / 2;
  const targetCenter = targetRect.top + targetRect.height / 2;
  const bounds = getContainerScrollBounds(container);
  const top = clamp(
    container.scrollTop + targetCenter - containerCenter,
    bounds.min,
    bounds.max
  );

  if (typeof container.scrollTo === "function") {
    container.scrollTo({ behavior, top });
    return;
  }

  container.scrollTop = top;
};

const isElementVisibleInContainer = ({
  container,
  target,
}: {
  readonly container: HTMLDivElement;
  readonly target: HTMLDivElement;
}): boolean => {
  const containerRect = container.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();

  if (targetRect.height <= 0 || containerRect.height <= 0) return false;

  if (targetRect.height > containerRect.height) {
    return (
      targetRect.top <= containerRect.bottom &&
      targetRect.bottom >= containerRect.top
    );
  }

  return (
    targetRect.top >= containerRect.top &&
    targetRect.bottom <= containerRect.bottom
  );
};

interface UseWaveDropsSerialScrollParams {
  readonly waveId: string;
  readonly dropId: string | null;
  readonly initialDrop: number | null;
  readonly replyThreadStore?: ExpandedReplyThreadsStore | undefined;
  readonly waveMessages: WaveMessagesResult;
  readonly fetchNextPage: FetchNextPage;
  readonly waitAndRevealDrop: WaitAndRevealDrop;
  readonly scrollContainerRef: RefObject<HTMLDivElement | null>;
  readonly shouldPinToBottom: boolean;
  readonly scrollToVisualBottom: () => void;
}

interface UseWaveDropsSerialScrollResult {
  readonly cancelSerialScroll: () => void;
  readonly serialTarget: number | null;
  readonly queueSerialTarget: (serialNo: number) => void;
  readonly targetDropRef: RefObject<HTMLDivElement | null>;
  readonly isScrolling: boolean;
}

export const useWaveDropsSerialScroll = ({
  waveId,
  dropId,
  initialDrop,
  replyThreadStore,
  waveMessages,
  fetchNextPage,
  waitAndRevealDrop,
  scrollContainerRef,
  shouldPinToBottom,
  scrollToVisualBottom,
}: UseWaveDropsSerialScrollParams): UseWaveDropsSerialScrollResult => {
  const [serialTarget, setSerialTarget] = useState<number | null>(initialDrop);
  const [previousInitialDrop, setPreviousInitialDrop] = useState(initialDrop);

  if (previousInitialDrop !== initialDrop) {
    setPreviousInitialDrop(initialDrop);
    // A new same-wave link is a new request; URL cleanup must not cancel it.
    if (initialDrop !== null) {
      setSerialTarget(initialDrop);
    }
  }

  const targetDropRef = useRef<HTMLDivElement | null>(null);
  const scrollAnchorRef = useRef<SerialScrollAnchor | null>(null);
  const revealedLinkedReplyRef = useRef<DropReplyThreadTarget | null>(null);

  const holdScrollTarget = useCallback(
    (container: HTMLDivElement, target: HTMLDivElement) => {
      if (scrollAnchorRef.current?.target === target)
        return scrollAnchorRef.current;
      scrollAnchorRef.current?.release();
      // Placeholder hydration and media loading can move a settled target. Keep
      // it visible until the reader interacts; never hold ordinary wave entry.
      const anchor = observeSerialScrollTarget({
        container,
        target,
        onTarget: (currentTarget) => {
          if (
            !isElementVisibleInContainer({ container, target: currentTarget })
          ) {
            scrollElementIntoContainerCenter({
              behavior: "auto",
              container,
              target: currentTarget,
            });
          }
        },
        onRelease: () => {
          if (scrollAnchorRef.current === anchor) {
            scrollAnchorRef.current = null;
          }
        },
      });
      scrollAnchorRef.current = anchor;
      return anchor;
    },
    []
  );

  const [isScrolling, setIsScrolling] = useState(false);
  const pendingScrollRef = useRef<{
    readonly serialNo: number;
    readonly controller: AbortController;
  } | null>(null);
  const lastAutoPinnedNewestDropKeyRef = useRef<string | null>(null);
  const [init, setInit] = useState(false);

  const cancelSerialScroll = useCallback(() => {
    scrollAnchorRef.current?.release();
    pendingScrollRef.current?.controller.abort();
    pendingScrollRef.current = null;
    setSerialTarget(null);
    setIsScrolling(false);
  }, []);

  const queueSerialTarget = useCallback((serialNo: number) => {
    setSerialTarget(serialNo);
  }, []);

  useEffect(() => {
    return () => {
      scrollAnchorRef.current?.release();
      pendingScrollRef.current?.controller.abort();
      pendingScrollRef.current = null;
    };
  }, []);

  useEffect(() => {
    const currentMessages = waveMessages;
    if (currentMessages && currentMessages.drops.length > 0) {
      const newestDrop = currentMessages.drops[0];
      const newestDropKey = newestDrop
        ? `${newestDrop.id}:${newestDrop.serial_no}`
        : null;
      const previousNewestDropKey = lastAutoPinnedNewestDropKeyRef.current;

      if (!init) {
        setInit(true);
      }

      const shouldAutoPinNewestDrop =
        shouldPinToBottom &&
        serialTarget === null &&
        scrollAnchorRef.current === null &&
        !isScrolling &&
        newestDropKey !== null &&
        newestDropKey !== previousNewestDropKey &&
        (init ||
          previousNewestDropKey !== null ||
          newestDrop?.id.startsWith("temp-"));

      if (shouldAutoPinNewestDrop) {
        // A cancelled timer must leave this key eligible for the next render.
        const timeoutId = setTimeout(() => {
          lastAutoPinnedNewestDropKeyRef.current = newestDropKey;
          scrollToVisualBottom();
        }, 100);
        return () => clearTimeout(timeoutId);
      }
      lastAutoPinnedNewestDropKeyRef.current = newestDropKey;
    }
    return undefined;
  }, [
    waveMessages,
    shouldPinToBottom,
    scrollToVisualBottom,
    init,
    serialTarget,
    isScrolling,
  ]);

  const getReadyScrollTarget = useCallback(
    (container: HTMLDivElement, serialNo: number) => {
      const linkedReply = replyThreadStore?.getLinkedReply();
      if (linkedReply?.parentSerialNo === serialNo) {
        const reply = replyThreadStore?.getLinkedReplyElement(serialNo);
        return reply && container.contains(reply) ? reply : null;
      }

      const ref = targetDropRef.current;
      const row =
        ref?.id === `drop-${serialNo}`
          ? ref
          : container.ownerDocument.getElementById(`drop-${serialNo}`);
      if (
        !(row instanceof HTMLDivElement) ||
        !container.contains(row) ||
        !row.querySelector("[data-wave-drop-content]")
      ) {
        return null;
      }
      return row;
    },
    [replyThreadStore]
  );

  useEffect(() => {
    if (!replyThreadStore) return;

    const revealMountedReply = () => {
      const linkedReply = replyThreadStore.getLinkedReply();
      if (!linkedReply || revealedLinkedReplyRef.current === linkedReply)
        return;

      const container = scrollContainerRef.current;
      if (!container) return;
      const reply = getReadyScrollTarget(container, linkedReply.parentSerialNo);
      if (!reply) return;

      // The reply may mount after the parent was already revealed.
      revealedLinkedReplyRef.current = linkedReply;
      holdScrollTarget(container, reply);
      scrollElementIntoContainerCenter({
        behavior: "auto",
        container,
        target: reply,
      });
    };

    const unsubscribe = replyThreadStore.subscribe(revealMountedReply);
    revealMountedReply();
    return unsubscribe;
  }, [
    replyThreadStore,
    scrollContainerRef,
    getReadyScrollTarget,
    holdScrollTarget,
  ]);

  const waitForVisibleDrop = useCallback(
    async (serialNo: number, signal: AbortSignal) => {
      const deadline = Date.now() + TARGET_RENDER_TIMEOUT;
      let scrolledTarget: HTMLDivElement | null = null;
      let anchor: SerialScrollAnchor | null = null;
      let scrollStartedAt = 0;
      let retriedInstantly = false;
      while (!signal.aborted && Date.now() < deadline) {
        const container = scrollContainerRef.current;
        const target = container && getReadyScrollTarget(container, serialNo);
        if (container && target) {
          if (target !== scrolledTarget) {
            scrolledTarget = target;
            scrollStartedAt = Date.now();
            retriedInstantly = false;
            anchor = holdScrollTarget(container, target);
            scrollElementIntoContainerCenter({
              behavior: "smooth",
              container,
              target,
            });
          }
          // Reader input releases the anchor and cancels any remaining retries.
          if (!anchor?.isActive()) return;
          if (isElementVisibleInContainer({ container, target })) return;

          const elapsed = Date.now() - scrollStartedAt;
          if (elapsed >= INSTANT_SCROLL_RETRY_MS && !retriedInstantly) {
            // Some engines do not finish smooth scrolling in reverse flex lists.
            retriedInstantly = true;
            scrollElementIntoContainerCenter({
              behavior: "instant",
              container,
              target,
            });
          }
        } else {
          // The local reveal is idempotent as new batches shift the target's index.
          await waitAndRevealDrop(
            serialNo,
            TARGET_RENDER_POLL_MS,
            TARGET_RENDER_POLL_MS
          );
        }
        await delay(TARGET_RENDER_POLL_MS);
      }
      if (!signal.aborted) {
        console.warn(
          `Timed out waiting for wave drop ${serialNo} to become visible.`
        );
      }
    },
    [
      getReadyScrollTarget,
      holdScrollTarget,
      scrollContainerRef,
      waitAndRevealDrop,
    ]
  );

  useEffect(() => {
    if (
      !init ||
      serialTarget === null ||
      pendingScrollRef.current?.serialNo === serialTarget
    ) {
      return;
    }

    pendingScrollRef.current?.controller.abort();
    scrollAnchorRef.current?.release();
    const requestedScroll = {
      serialNo: serialTarget,
      controller: new AbortController(),
    };
    pendingScrollRef.current = requestedScroll;
    const { signal } = requestedScroll.controller;
    const needsHistory = !waveMessages?.drops.some(
      (drop) => drop.serial_no === serialTarget && drop.type === DropSize.FULL
    );
    setIsScrolling(needsHistory);
    const overlayTimeoutId = needsHistory
      ? undefined
      : globalThis.setTimeout(() => {
          if (!signal.aborted) setIsScrolling(true);
        }, CACHED_JUMP_OVERLAY_DELAY_MS);

    const clearTimers = () => {
      globalThis.clearTimeout(timeoutId);
      globalThis.clearTimeout(overlayTimeoutId);
    };
    const finish = () => {
      clearTimers();
      if (pendingScrollRef.current !== requestedScroll) return;
      pendingScrollRef.current = null;
      setSerialTarget((current) => (current === serialTarget ? null : current));
      setIsScrolling(false);
    };
    const timeoutId = globalThis.setTimeout(() => {
      if (signal.aborted) return;
      console.warn(`Timed out jumping to wave drop ${serialTarget}.`);
      requestedScroll.controller.abort();
      finish();
    }, SCROLL_OPERATION_TIMEOUT);

    const scroll = async () => {
      try {
        if (needsHistory) {
          await fetchNextPage(
            { waveId, type: DropSize.LIGHT, targetSerialNo: serialTarget },
            dropId
          );
          if (
            signal.aborted ||
            !(await waitAndRevealDrop(serialTarget, TARGET_RENDER_TIMEOUT))
          ) {
            return;
          }
        }
        if (!signal.aborted) {
          await waitForVisibleDrop(serialTarget, signal);
        }
      } catch (error) {
        if (!signal.aborted) console.warn("Scroll operation failed:", error);
      } finally {
        finish();
      }
    };
    signal.addEventListener("abort", clearTimers, { once: true });
    void scroll();
  }, [
    init,
    serialTarget,
    waveMessages,
    fetchNextPage,
    waveId,
    dropId,
    waitForVisibleDrop,
    waitAndRevealDrop,
  ]);

  return {
    cancelSerialScroll,
    serialTarget,
    queueSerialTarget,
    targetDropRef,
    isScrolling,
  };
};
