"use client";

import { useLayoutEffect } from "react";

const BODY_SCROLL_LOCKED_DATASET_KEY = "seizeBodyScrollLocked";
const BODY_SCROLLBAR_GAP_DATASET_KEY = "seizeBodyScrollbarGap";
const BODY_SCROLLBAR_GAP_PROPERTY = "--seize-body-scrollbar-gap";

let scrollLockCount = 0;
let scrollbarGapLockCount = 0;

interface BodyScrollLockOptions {
  readonly reserveScrollbarGap?: boolean | undefined;
}

const acquireBodyScrollLock = ({
  reserveScrollbarGap = false,
}: BodyScrollLockOptions): (() => void) => {
  const { body, documentElement } = document;
  const scrollbarGap = reserveScrollbarGap
    ? window.innerWidth - documentElement.clientWidth
    : 0;
  const reservesScrollbarGap =
    reserveScrollbarGap && (scrollbarGapLockCount > 0 || scrollbarGap > 0);

  scrollLockCount += 1;
  body.dataset[BODY_SCROLL_LOCKED_DATASET_KEY] = "true";

  if (reservesScrollbarGap) {
    if (scrollbarGapLockCount === 0) {
      body.style.setProperty(BODY_SCROLLBAR_GAP_PROPERTY, `${scrollbarGap}px`);
    }
    scrollbarGapLockCount += 1;
    body.dataset[BODY_SCROLLBAR_GAP_DATASET_KEY] = "true";
  }

  let isReleased = false;
  return () => {
    if (isReleased) return;
    isReleased = true;

    scrollLockCount = Math.max(0, scrollLockCount - 1);
    if (scrollLockCount === 0) {
      delete body.dataset[BODY_SCROLL_LOCKED_DATASET_KEY];
    }

    if (!reservesScrollbarGap) return;
    scrollbarGapLockCount = Math.max(0, scrollbarGapLockCount - 1);
    if (scrollbarGapLockCount === 0) {
      delete body.dataset[BODY_SCROLLBAR_GAP_DATASET_KEY];
      body.style.removeProperty(BODY_SCROLLBAR_GAP_PROPERTY);
    }
  };
};

export default function useBodyScrollLock(options: BodyScrollLockOptions = {}) {
  const { reserveScrollbarGap = false } = options;

  useLayoutEffect(
    () => acquireBodyScrollLock({ reserveScrollbarGap }),
    [reserveScrollbarGap]
  );
}
