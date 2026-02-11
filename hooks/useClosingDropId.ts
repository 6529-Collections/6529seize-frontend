"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** If React's searchParams hasn't caught up within this window, re-show the modal. */
const SAFETY_TIMEOUT_MS = 1_000;

type DropId = string | null | undefined;

type UseClosingDropIdResult = {
  readonly effectiveDropId: string | undefined;
  readonly beginClosingDrop: (dropId: string) => void;
};

export function useClosingDropId(dropId: DropId): UseClosingDropIdResult {
  const currentDropId = dropId ?? undefined;
  const [closingDropId, setClosingDropId] = useState<string | undefined>();
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const beginClosingDrop = useCallback((dropIdToClose: string) => {
    setClosingDropId(dropIdToClose);
    clearTimeout(timerRef.current);
    // Safety: if router.replace fails or React never reflects the URL change,
    // re-show the modal after a timeout so it doesn't stay hidden forever.
    timerRef.current = setTimeout(() => {
      setClosingDropId(undefined);
    }, SAFETY_TIMEOUT_MS);
  }, []);

  // Clean up timer on unmount
  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  // Clear closingDropId once React's searchParams has actually diverged
  // (meaning the URL change from router.replace has propagated).
  // This is the normal path — cancels the safety timer.
  useEffect(() => {
    if (closingDropId !== undefined && currentDropId !== closingDropId) {
      clearTimeout(timerRef.current);
      setClosingDropId(undefined);
    }
  }, [currentDropId, closingDropId]);

  return {
    effectiveDropId:
      closingDropId !== undefined && currentDropId === closingDropId
        ? undefined
        : currentDropId,
    beginClosingDrop,
  };
}
