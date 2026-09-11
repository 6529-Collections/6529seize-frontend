"use client";

import { getMintTimelineDetails } from "@/components/meme-calendar/meme-calendar.helpers";
import { HOME_LATEST_DROP_GRACE_PERIOD_MINUTES } from "@/helpers/mint-visibility.helpers";
import { useEffect, useMemo, useState } from "react";

const MINUTE_IN_MILLISECONDS = 60_000;

export function getLatestDropTransitionTime(mintNumber: number): number | null {
  if (!Number.isSafeInteger(mintNumber) || mintNumber < 1) {
    return null;
  }

  const mintEndTime = getMintTimelineDetails(mintNumber).mintEndUtc.getTime();
  return (
    mintEndTime + HOME_LATEST_DROP_GRACE_PERIOD_MINUTES * MINUTE_IN_MILLISECONDS
  );
}

export function useLatestDropTransitionReady({
  isDropComplete,
  mintNumber,
}: {
  readonly isDropComplete: boolean;
  readonly mintNumber: number | undefined;
}): boolean {
  const transitionTime = useMemo(
    () =>
      mintNumber === undefined ? null : getLatestDropTransitionTime(mintNumber),
    [mintNumber]
  );
  const [elapsedTransitionTime, setElapsedTransitionTime] = useState<
    number | null
  >(null);

  useEffect(() => {
    if (!isDropComplete || transitionTime === null) {
      return;
    }

    const delay = Math.max(0, transitionTime - Date.now());
    const timeout = window.setTimeout(() => {
      setElapsedTransitionTime(transitionTime);
    }, delay);

    return () => window.clearTimeout(timeout);
  }, [isDropComplete, transitionTime]);

  return (
    isDropComplete &&
    transitionTime !== null &&
    elapsedTransitionTime === transitionTime
  );
}
