"use client";

import { useCallback, useEffect, useRef } from "react";
import type { MouseEvent } from "react";

const CLEAR_SUPPRESSION_AFTER_TOUCH_END_MS = 750;

export default function useLongPressClickSuppression() {
  const clearSuppressionTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const shouldSuppressNextClickRef = useRef(false);

  const clearSuppression = useCallback(() => {
    if (clearSuppressionTimeoutRef.current) {
      clearTimeout(clearSuppressionTimeoutRef.current);
      clearSuppressionTimeoutRef.current = null;
    }

    shouldSuppressNextClickRef.current = false;
  }, []);

  const markNextClickForSuppression = useCallback(() => {
    if (clearSuppressionTimeoutRef.current) {
      clearTimeout(clearSuppressionTimeoutRef.current);
      clearSuppressionTimeoutRef.current = null;
    }

    shouldSuppressNextClickRef.current = true;
  }, []);

  const releaseSuppressionAfterTouchEnd = useCallback(() => {
    if (!shouldSuppressNextClickRef.current) {
      return;
    }

    if (clearSuppressionTimeoutRef.current) {
      clearTimeout(clearSuppressionTimeoutRef.current);
    }

    clearSuppressionTimeoutRef.current = setTimeout(() => {
      shouldSuppressNextClickRef.current = false;
      clearSuppressionTimeoutRef.current = null;
    }, CLEAR_SUPPRESSION_AFTER_TOUCH_END_MS);
  }, []);

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
