"use client";

import { useCallback, useEffect, useRef } from "react";
import type { MouseEvent } from "react";

const CLEAR_SUPPRESSION_AFTER_TOUCH_END_MS = 750;

export default function useLongPressClickSuppression() {
  const clearSuppressionTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const shouldSuppressNextClickRef = useRef(false);
  const releaseDocumentSuppressionRef = useRef<(() => void) | null>(null);

  const clearSuppression = useCallback(() => {
    if (clearSuppressionTimeoutRef.current) {
      clearTimeout(clearSuppressionTimeoutRef.current);
      clearSuppressionTimeoutRef.current = null;
    }

    shouldSuppressNextClickRef.current = false;
    releaseDocumentSuppressionRef.current?.();
    releaseDocumentSuppressionRef.current = null;
  }, []);

  const markNextClickForSuppression = useCallback(() => {
    if (clearSuppressionTimeoutRef.current) {
      clearTimeout(clearSuppressionTimeoutRef.current);
      clearSuppressionTimeoutRef.current = null;
    }

    shouldSuppressNextClickRef.current = true;
    if (releaseDocumentSuppressionRef.current) return;

    // A sheet can appear under the held finger in a portal. Its release click
    // belongs to the original hold, even when it lands outside the source row.
    const onReleaseClick = (event: globalThis.MouseEvent) => {
      if (event.detail === 0) return;
      clearSuppression();
      event.preventDefault();
      event.stopPropagation();
    };
    // The next deliberate press must be able to choose a menu action at once.
    document.addEventListener("pointerdown", clearSuppression, true);
    document.addEventListener("click", onReleaseClick, true);
    releaseDocumentSuppressionRef.current = () => {
      document.removeEventListener("pointerdown", clearSuppression, true);
      document.removeEventListener("click", onReleaseClick, true);
    };
  }, [clearSuppression]);

  const releaseSuppressionAfterTouchEnd = useCallback(() => {
    if (!shouldSuppressNextClickRef.current) {
      return;
    }

    if (clearSuppressionTimeoutRef.current) {
      clearTimeout(clearSuppressionTimeoutRef.current);
    }

    clearSuppressionTimeoutRef.current = setTimeout(() => {
      clearSuppression();
    }, CLEAR_SUPPRESSION_AFTER_TOUCH_END_MS);
  }, [clearSuppression]);

  const handleClickCapture = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (!shouldSuppressNextClickRef.current) {
        return;
      }

      if (!event.currentTarget.contains(event.target as Node)) {
        return;
      }

      clearSuppression();
      event.preventDefault();
      event.stopPropagation();
    },
    [clearSuppression]
  );

  useEffect(() => clearSuppression, [clearSuppression]);

  return {
    markNextClickForSuppression,
    releaseSuppressionAfterTouchEnd,
    clearSuppression,
    handleClickCapture,
  };
}
