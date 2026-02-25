import {
  type MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { DropSize } from "@/helpers/waves/drop.helpers";
import type { useVirtualizedWaveDrops } from "@/hooks/useVirtualizedWaveDrops";

import { delay } from "../utils/delay";

type VirtualizedWaveDropsResult = ReturnType<typeof useVirtualizedWaveDrops>;
type WaveMessagesResult = VirtualizedWaveDropsResult["waveMessages"];
type FetchNextPage = VirtualizedWaveDropsResult["fetchNextPage"];
type WaitAndRevealDrop = VirtualizedWaveDropsResult["waitAndRevealDrop"];

const SCROLL_OPERATION_TIMEOUT = 10000;

interface UseWaveDropsSerialScrollParams {
  readonly waveId: string;
  readonly dropId: string | null;
  readonly initialDrop: number | null;
  readonly waveMessages: WaveMessagesResult;
  readonly renderedWaveMessages: WaveMessagesResult;
  readonly fetchNextPage: FetchNextPage;
  readonly waitAndRevealDrop: WaitAndRevealDrop;
  readonly scrollContainerRef: MutableRefObject<HTMLDivElement | null>;
  readonly shouldPinToBottom: boolean;
  readonly scrollToVisualBottom: () => void;
}

interface UseWaveDropsSerialScrollResult {
  readonly serialTarget: number | null;
  readonly queueSerialTarget: (serialNo: number) => void;
  readonly targetDropRef: MutableRefObject<HTMLDivElement | null>;
  readonly isScrolling: boolean;
  readonly scrollBaselineSerials: ReadonlySet<number> | null;
  readonly frozenAutoCollapseSerials: ReadonlySet<number>;
}

const buildSerialSet = (
  waveMessages: WaveMessagesResult | null | undefined
): ReadonlySet<number> | null => {
  const drops = waveMessages?.drops;
  if (!drops || drops.length === 0) {
    return null;
  }
  const serials = drops
    .map((drop) => drop.serial_no)
    .filter((serialNo): serialNo is number => typeof serialNo === "number");
  return serials.length > 0 ? new Set(serials) : null;
};

const buildAutoCollapseSerials = (
  baseline: ReadonlySet<number> | null,
  waveMessages: WaveMessagesResult | null | undefined,
  frozen: ReadonlySet<number>
): ReadonlySet<number> => {
  if (!baseline) {
    return frozen;
  }
  const drops = waveMessages?.drops;
  if (!drops || drops.length === 0) {
    return frozen;
  }
  const next = new Set(frozen);
  for (const drop of drops) {
    const serialNo = drop.serial_no;
    if (typeof serialNo !== "number") {
      continue;
    }
    if (!baseline.has(serialNo) && !next.has(serialNo)) {
      next.add(serialNo);
    }
  }
  return next;
};

export const useWaveDropsSerialScroll = ({
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
}: UseWaveDropsSerialScrollParams): UseWaveDropsSerialScrollResult => {
  const [serialTarget, setSerialTarget] = useState<number | null>(initialDrop);
  const [scrollBaselineSerials, setScrollBaselineSerials] =
    useState<ReadonlySet<number> | null>(null);
  const [frozenAutoCollapseSerials, setFrozenAutoCollapseSerials] = useState<
    ReadonlySet<number>
  >(() => new Set());

  const targetDropRef = useRef<HTMLDivElement | null>(null);

  const [isScrolling, setIsScrolling] = useState(false);
  const scrollOperationAbortController = useRef<AbortController | null>(null);
  const scrollOperationLockRef = useRef(false);
  const scrollBaselineRef = useRef<ReadonlySet<number> | null>(null);

  const latestWaveMessagesRef = useRef(waveMessages);
  const latestRenderedWaveMessagesRef = useRef(renderedWaveMessages);
  const smallestSerialNo = useRef<number | null>(null);
  const lastScrolledToSerialRef = useRef<number | null>(null);
  const [init, setInit] = useState(false);

  const queueSerialTarget = useCallback((serialNo: number) => {
    setSerialTarget(serialNo);
  }, []);

  const finalizeScrollBaseline = useCallback(() => {
    const baseline = scrollBaselineRef.current;
    if (!baseline) {
      setScrollBaselineSerials(null);
      return;
    }
    const currentMessages = latestRenderedWaveMessagesRef.current;
    setFrozenAutoCollapseSerials((current) =>
      buildAutoCollapseSerials(baseline, currentMessages, current)
    );
    scrollBaselineRef.current = null;
    setScrollBaselineSerials(null);
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
      scrollOperationLockRef.current = false;
      finalizeScrollBaseline();
      setIsScrolling(false);
      if (scrollOperationAbortController.current) {
        scrollOperationAbortController.current.abort();
        scrollOperationAbortController.current = null;
      }
    }, SCROLL_OPERATION_TIMEOUT);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isScrolling, finalizeScrollBaseline]);

  useEffect(() => {
    return () => {
      if (scrollOperationAbortController.current) {
        scrollOperationAbortController.current.abort();
        scrollOperationAbortController.current = null;
      }
      scrollOperationLockRef.current = false;
      setIsScrolling(false);
    };
  }, []);

  useEffect(() => {
    latestWaveMessagesRef.current = waveMessages;

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
    latestRenderedWaveMessagesRef.current = renderedWaveMessages;
  }, [renderedWaveMessages]);

  useEffect(() => {
    const currentMessages = latestWaveMessagesRef.current;
    if (currentMessages && currentMessages.drops.length > 0) {
      if (!init) {
        setInit(true);
      }

      const lastDrop = currentMessages.drops[0];
      if (lastDrop?.id.startsWith("temp-") && shouldPinToBottom) {
        setTimeout(() => {
          scrollToVisualBottom();
        }, 100);
      }
    }
  }, [waveMessages, shouldPinToBottom, scrollToVisualBottom, init]);

  const scrollToSerialNo = useCallback((behavior: ScrollBehavior) => {
    if (targetDropRef.current && scrollContainerRef.current) {
      targetDropRef.current.scrollIntoView({
        behavior,
        block: "center",
      });

      setTimeout(() => {
        const rect = targetDropRef.current?.getBoundingClientRect();
        const isInViewport =
          rect && rect.top >= 0 && rect.bottom <= window.innerHeight;

        if (!isInViewport && targetDropRef.current) {
          targetDropRef.current.scrollIntoView({
            behavior,
            block: "center",
          });

          setTimeout(() => {
            const retryRect = targetDropRef.current?.getBoundingClientRect();
            const stillInViewport =
              retryRect &&
              retryRect.top >= 0 &&
              retryRect.bottom <= window.innerHeight;

            if (!stillInViewport && targetDropRef.current) {
              targetDropRef.current.scrollIntoView({
                behavior,
                block: "center",
              });
            }
          }, 300);
        }
      }, 150);
      return true;
    }
    return false;
  }, []);

  const smoothScrollWithRetries = useCallback(
    async (maxWaitTimeMs: number = 3000, pollIntervalMs: number = 100) => {
      const startTime = Date.now();
      while (Date.now() - startTime < maxWaitTimeMs) {
        if (targetDropRef.current) {
          return scrollToSerialNo("smooth");
        }
        await delay(pollIntervalMs);
      }
      console.warn(
        `smoothScrollWithRetries: Timed out after ${maxWaitTimeMs}ms waiting for targetDropRef to be set.`
      );
      return false;
    },
    [scrollToSerialNo]
  );

  const fetchAndScrollToDrop = useCallback(async () => {
    if (!serialTarget || isScrolling || scrollOperationLockRef.current) {
      return;
    }

    const baselineSerials = buildSerialSet(
      latestRenderedWaveMessagesRef.current
    );
    scrollBaselineRef.current = baselineSerials;
    setScrollBaselineSerials(baselineSerials);

    scrollOperationLockRef.current = true;
    setIsScrolling(true);

    if (scrollOperationAbortController.current) {
      scrollOperationAbortController.current.abort();
    }

    scrollOperationAbortController.current = new AbortController();
    const signal = scrollOperationAbortController.current.signal;

    let didSucceed = false;
    try {
      if (signal.aborted) {
        finalizeScrollBaseline();
        scrollOperationLockRef.current = false;
        setIsScrolling(false);
        return;
      }

      await fetchNextPage(
        {
          waveId,
          type: DropSize.LIGHT,
          targetSerialNo: serialTarget,
        },
        dropId
      );

      if (signal.aborted) {
        finalizeScrollBaseline();
        scrollOperationLockRef.current = false;
        setIsScrolling(false);
        return;
      }

      await waitAndRevealDrop(serialTarget);

      if (signal.aborted) {
        finalizeScrollBaseline();
        scrollOperationLockRef.current = false;
        setIsScrolling(false);
        return;
      }

      const success = await smoothScrollWithRetries();
      didSucceed = success;

      if (!signal.aborted) {
        setTimeout(() => {
          if (success && !signal.aborted) {
            setSerialTarget(null);
            lastScrolledToSerialRef.current = null;
          }
        }, 600);
      }
    } catch (error) {
      if (!signal.aborted) {
        console.warn("Scroll operation failed:", error);
      }
    } finally {
      if (!didSucceed || signal.aborted) {
        lastScrolledToSerialRef.current = null;
      }
      scrollOperationLockRef.current = false;
      finalizeScrollBaseline();
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
    finalizeScrollBaseline,
  ]);

  useEffect(() => {
    if (!init || !serialTarget || isScrolling) return;
    if (lastScrolledToSerialRef.current === serialTarget) return;
    const currentSmallestSerial = smallestSerialNo.current;
    if (currentSmallestSerial && currentSmallestSerial <= serialTarget) {
      lastScrolledToSerialRef.current = serialTarget;
      const success = scrollToSerialNo("smooth");
      if (success) {
        setTimeout(() => {
          setSerialTarget(null);
          lastScrolledToSerialRef.current = null;
        }, 600);
      } else {
        lastScrolledToSerialRef.current = null;
        fetchAndScrollToDrop();
      }
    } else {
      lastScrolledToSerialRef.current = serialTarget;
      fetchAndScrollToDrop();
    }
  }, [init, serialTarget, fetchAndScrollToDrop, scrollToSerialNo, isScrolling]);

  return {
    serialTarget,
    queueSerialTarget,
    targetDropRef,
    isScrolling,
    scrollBaselineSerials,
    frozenAutoCollapseSerials,
  };
};
