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

type VirtualizedWaveDropsResult = ReturnType<typeof useVirtualizedWaveDrops>;
type WaveMessagesResult = VirtualizedWaveDropsResult["waveMessages"];
type FetchNextPage = VirtualizedWaveDropsResult["fetchNextPage"];
type WaitAndRevealDrop = VirtualizedWaveDropsResult["waitAndRevealDrop"];

const SCROLL_OPERATION_TIMEOUT = 30000;
const TARGET_RENDER_TIMEOUT = 15000;

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
  readonly waveMessages: WaveMessagesResult;
  readonly fetchNextPage: FetchNextPage;
  readonly waitAndRevealDrop: WaitAndRevealDrop;
  readonly scrollContainerRef: RefObject<HTMLDivElement | null>;
  readonly shouldPinToBottom: boolean;
  readonly scrollToVisualBottom: () => void;
}

interface UseWaveDropsSerialScrollResult {
  readonly serialTarget: number | null;
  readonly queueSerialTarget: (serialNo: number) => void;
  readonly targetDropRef: RefObject<HTMLDivElement | null>;
  readonly isScrolling: boolean;
}

export const useWaveDropsSerialScroll = ({
  waveId,
  dropId,
  initialDrop,
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
  const scrollAnchorRef = useRef<{
    readonly target: HTMLDivElement;
    readonly isActive: () => boolean;
    readonly release: () => void;
  } | null>(null);

  const holdScrollTarget = useCallback(
    (container: HTMLDivElement, target: HTMLDivElement) => {
      if (scrollAnchorRef.current?.target === target)
        return scrollAnchorRef.current;
      scrollAnchorRef.current?.release();
      const controls = container.parentElement ?? container;
      let active = true;
      // Placeholder hydration and media loading can move a settled target. Keep
      // it visible until the reader interacts; never hold ordinary wave entry.
      const observer =
        typeof IntersectionObserver === "undefined"
          ? null
          : new IntersectionObserver(
              () => {
                if (!active) return;
                if (!container.contains(target)) {
                  release();
                  return;
                }
                if (!isElementVisibleInContainer({ container, target })) {
                  scrollElementIntoContainerCenter({
                    behavior: "auto",
                    container,
                    target,
                  });
                }
              },
              { root: container, threshold: [0, 1] }
            );
      function release() {
        active = false;
        observer?.disconnect();
        for (const event of ["wheel", "touchstart", "pointerdown", "keydown"]) {
          controls.removeEventListener(event, release, true);
        }
        if (scrollAnchorRef.current?.target === target)
          scrollAnchorRef.current = null;
      }
      const anchor = { target, release, isActive: () => active };
      scrollAnchorRef.current = anchor;
      observer?.observe(target);
      for (const event of ["wheel", "touchstart", "pointerdown", "keydown"]) {
        controls.addEventListener(event, release, {
          capture: true,
          passive: true,
        });
      }
      return anchor;
    },
    []
  );

  const [isScrolling, setIsScrolling] = useState(false);
  const scrollOperationAbortController = useRef<AbortController | null>(null);
  const scrollOperationLockRef = useRef(false);
  const activeScrollTargetRef = useRef<number | null>(null);

  const smallestSerialNo = useRef<number | null>(null);
  const lastScrolledToSerialRef = useRef<number | null>(null);
  const lastAutoPinnedNewestDropKeyRef = useRef<string | null>(null);
  const [init, setInit] = useState(false);

  const queueSerialTarget = useCallback((serialNo: number) => {
    setSerialTarget(serialNo);
  }, []);

  const clearSerialTargetIfCurrent = useCallback((targetSerialNo: number) => {
    setSerialTarget((current) => (current === targetSerialNo ? null : current));
    if (lastScrolledToSerialRef.current === targetSerialNo) {
      lastScrolledToSerialRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isScrolling) {
      return;
    }

    const timeoutId = setTimeout(() => {
      console.warn(
        "Scroll operation timed out after",
        SCROLL_OPERATION_TIMEOUT,
        "ms, clearing isScrolling state"
      );
      const activeScrollTarget = activeScrollTargetRef.current;
      if (activeScrollTarget !== null) {
        clearSerialTargetIfCurrent(activeScrollTarget);
        activeScrollTargetRef.current = null;
      }
      scrollOperationLockRef.current = false;
      setIsScrolling(false);
      if (scrollOperationAbortController.current) {
        scrollOperationAbortController.current.abort();
        scrollOperationAbortController.current = null;
      }
    }, SCROLL_OPERATION_TIMEOUT);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isScrolling, clearSerialTargetIfCurrent]);

  useEffect(() => {
    return () => {
      scrollAnchorRef.current?.release();
      if (scrollOperationAbortController.current) {
        scrollOperationAbortController.current.abort();
        scrollOperationAbortController.current = null;
      }
      scrollOperationLockRef.current = false;
      setIsScrolling(false);
    };
  }, []);

  useEffect(() => {
    if (waveMessages && waveMessages.drops.length > 0) {
      const minSerialNo = Math.min(
        ...waveMessages.drops.map((drop) => drop.serial_no)
      );
      smallestSerialNo.current = minSerialNo;
    } else {
      smallestSerialNo.current = null;
    }
  }, [waveMessages]);

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

  const scrollToSerialNo = useCallback(
    (behavior: ScrollBehavior, targetSerialNo?: number) => {
      const container = scrollContainerRef.current;
      const resolveTarget = (targetContainer: HTMLDivElement | null) => {
        if (targetSerialNo === undefined) {
          return targetDropRef.current;
        }

        const matchingTarget =
          targetContainer?.ownerDocument.getElementById(
            `drop-${targetSerialNo}`
          ) ?? null;
        return matchingTarget && targetContainer?.contains(matchingTarget)
          ? (matchingTarget as HTMLDivElement)
          : targetDropRef.current;
      };
      const target = resolveTarget(container);

      if (target && container) {
        const anchor = holdScrollTarget(container, target);
        scrollElementIntoContainerCenter({
          behavior,
          container,
          target,
        });

        setTimeout(() => {
          if (!anchor.isActive()) return;
          const retryContainer = scrollContainerRef.current;
          const retryTarget = resolveTarget(retryContainer);
          const isInContainer =
            retryTarget &&
            retryContainer &&
            isElementVisibleInContainer({
              container: retryContainer,
              target: retryTarget,
            });

          if (!isInContainer && retryTarget && retryContainer) {
            scrollElementIntoContainerCenter({
              behavior,
              container: retryContainer,
              target: retryTarget,
            });

            setTimeout(() => {
              if (!anchor.isActive()) return;
              const finalContainer = scrollContainerRef.current;
              const finalTarget = resolveTarget(finalContainer);
              const stillInContainer =
                finalTarget &&
                finalContainer &&
                isElementVisibleInContainer({
                  container: finalContainer,
                  target: finalTarget,
                });

              if (!stillInContainer && finalTarget && finalContainer) {
                // Some engines do not finish smooth scrolling in reverse flex
                // lists. The final attempt must actually reach the target.
                scrollElementIntoContainerCenter({
                  behavior: "auto",
                  container: finalContainer,
                  target: finalTarget,
                });
              }
            }, 300);
          }
        }, 150);
        return true;
      }
      return false;
    },
    [scrollContainerRef, holdScrollTarget]
  );

  const smoothScrollWithRetries = useCallback(
    async (
      targetSerialNo: number,
      signal: AbortSignal,
      maxWaitTimeMs: number = TARGET_RENDER_TIMEOUT,
      pollIntervalMs: number = 100
    ) => {
      const startTime = Date.now();
      while (!signal.aborted && Date.now() - startTime < maxWaitTimeMs) {
        if (scrollToSerialNo("smooth", targetSerialNo)) {
          return true;
        }

        // The local, idempotent reveal must rerun as placeholder batches shift the index.
        await waitAndRevealDrop(targetSerialNo, pollIntervalMs, pollIntervalMs);
        await delay(pollIntervalMs);
      }
      if (!signal.aborted) {
        console.warn(
          `smoothScrollWithRetries: Timed out after ${maxWaitTimeMs}ms waiting for targetDropRef to be set.`
        );
      }
      return false;
    },
    [scrollToSerialNo, waitAndRevealDrop]
  );

  const fetchAndScrollToDrop = useCallback(async () => {
    if (!serialTarget || isScrolling || scrollOperationLockRef.current) {
      return;
    }
    const activeSerialTarget = serialTarget;

    scrollOperationLockRef.current = true;
    activeScrollTargetRef.current = activeSerialTarget;
    setIsScrolling(true);

    if (scrollOperationAbortController.current) {
      scrollOperationAbortController.current.abort();
    }

    scrollOperationAbortController.current = new AbortController();
    const signal = scrollOperationAbortController.current.signal;

    let didSucceed = false;
    try {
      if (signal.aborted) {
        scrollOperationLockRef.current = false;
        setIsScrolling(false);
        return;
      }

      await fetchNextPage(
        {
          waveId,
          type: DropSize.LIGHT,
          targetSerialNo: activeSerialTarget,
        },
        dropId
      );

      if (signal.aborted) {
        scrollOperationLockRef.current = false;
        setIsScrolling(false);
        return;
      }

      // An existing page request can still be filling the cache. Give target
      // data the same readiness window as its rendered row.
      const didReveal = await waitAndRevealDrop(
        activeSerialTarget,
        TARGET_RENDER_TIMEOUT
      );

      if (signal.aborted) {
        scrollOperationLockRef.current = false;
        setIsScrolling(false);
        return;
      }

      if (!didReveal) {
        return;
      }

      const success = await smoothScrollWithRetries(activeSerialTarget, signal);
      didSucceed = success;

      if (!signal.aborted) {
        setTimeout(() => {
          if (success && !signal.aborted) {
            clearSerialTargetIfCurrent(activeSerialTarget);
          }
        }, 600);
      }
    } catch (error) {
      if (!signal.aborted) {
        console.warn("Scroll operation failed:", error);
      }
    } finally {
      if (!didSucceed && !signal.aborted) {
        clearSerialTargetIfCurrent(activeSerialTarget);
      }
      if (
        (!didSucceed || signal.aborted) &&
        lastScrolledToSerialRef.current === activeSerialTarget
      ) {
        lastScrolledToSerialRef.current = null;
      }
      if (activeScrollTargetRef.current === activeSerialTarget) {
        activeScrollTargetRef.current = null;
      }
      scrollOperationLockRef.current = false;
      setIsScrolling(false);
    }
  }, [
    serialTarget,
    isScrolling,
    fetchNextPage,
    waveId,
    dropId,
    waitAndRevealDrop,
    smoothScrollWithRetries,
    clearSerialTargetIfCurrent,
  ]);

  useEffect(() => {
    let settleTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let settleTargetSerialNo: number | null = null;

    if (!init || !serialTarget || isScrolling) return;
    if (lastScrolledToSerialRef.current === serialTarget) return;
    const currentSmallestSerial = smallestSerialNo.current;
    if (currentSmallestSerial && currentSmallestSerial <= serialTarget) {
      lastScrolledToSerialRef.current = serialTarget;
      const success = scrollToSerialNo("smooth");
      if (success) {
        const targetSerialNo = serialTarget;
        settleTargetSerialNo = targetSerialNo;
        settleTimeoutId = setTimeout(() => {
          setSerialTarget((current) =>
            current === targetSerialNo ? null : current
          );
          if (lastScrolledToSerialRef.current === targetSerialNo) {
            lastScrolledToSerialRef.current = null;
          }
        }, 600);
      } else {
        lastScrolledToSerialRef.current = null;
        fetchAndScrollToDrop();
      }
    } else {
      lastScrolledToSerialRef.current = serialTarget;
      fetchAndScrollToDrop();
    }

    return () => {
      if (settleTimeoutId !== null) {
        clearTimeout(settleTimeoutId);
      }
      if (
        settleTargetSerialNo !== null &&
        lastScrolledToSerialRef.current === settleTargetSerialNo
      ) {
        lastScrolledToSerialRef.current = null;
      }
    };
  }, [init, serialTarget, fetchAndScrollToDrop, scrollToSerialNo, isScrolling]);

  return {
    serialTarget,
    queueSerialTarget,
    targetDropRef,
    isScrolling,
  };
};
