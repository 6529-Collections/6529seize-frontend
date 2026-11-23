"use client";

import { getLatestDropTransitionTime } from "@/helpers/mint-visibility.helpers";
import { useEffect, useMemo, useState } from "react";

export function useLatestDropTransitionReady({
  isDropComplete,
  mintNumber,
}: {
  readonly isDropComplete: boolean;
  readonly mintNumber: number | undefined;
}): boolean | null {
  const transitionTime = useMemo(
    () =>
      mintNumber === undefined ? null : getLatestDropTransitionTime(mintNumber),
    [mintNumber]
  );
  const [transition, setTransition] = useState<{
    time: number;
    ready: boolean;
  } | null>(null);

  useEffect(() => {
    if (!isDropComplete || transitionTime === null) {
      return;
    }

    const delay = Math.max(0, transitionTime - Date.now());
    const checkTime = () => {
      setTransition({
        time: transitionTime,
        ready: Date.now() >= transitionTime,
      });
    };
    const initialCheck = window.setTimeout(checkTime, 0);
    const deadlineCheck = window.setTimeout(checkTime, delay);

    return () => {
      window.clearTimeout(initialCheck);
      window.clearTimeout(deadlineCheck);
    };
  }, [isDropComplete, transitionTime]);

  if (!isDropComplete || transitionTime === null) return false;

  // An unchecked deadline must not briefly select the previous artwork.
  return transition?.time === transitionTime ? transition.ready : null;
}
