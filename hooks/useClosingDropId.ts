"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_URL_SETTLE_FRAMES = 60;

type DropId = string | null | undefined;

type UseClosingDropIdResult = {
  readonly effectiveDropId: string | undefined;
  readonly beginClosingDrop: (dropId: string) => void;
};

export function useClosingDropId(dropId: DropId): UseClosingDropIdResult {
  const currentDropId = dropId ?? undefined;
  const [closingDropId, setClosingDropId] = useState<string | undefined>();
  const frameRef = useRef<number | undefined>(undefined);

  const stopWatchingUrl = useCallback(() => {
    if (frameRef.current !== undefined) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = undefined;
    }
  }, []);

  const beginClosingDrop = useCallback(
    (dropIdToClose: string) => {
      setClosingDropId(dropIdToClose);
      stopWatchingUrl();

      let frames = 0;
      const waitForUrlToSettle = () => {
        frames += 1;
        const urlDropId =
          new URLSearchParams(window.location.search).get("drop") ?? undefined;

        if (urlDropId !== dropIdToClose || frames >= MAX_URL_SETTLE_FRAMES) {
          setClosingDropId(undefined);
          frameRef.current = undefined;
          return;
        }

        frameRef.current = window.requestAnimationFrame(waitForUrlToSettle);
      };

      frameRef.current = window.requestAnimationFrame(waitForUrlToSettle);
    },
    [stopWatchingUrl]
  );

  useEffect(() => stopWatchingUrl, [stopWatchingUrl]);

  return {
    effectiveDropId:
      closingDropId !== undefined && currentDropId === closingDropId
        ? undefined
        : currentDropId,
    beginClosingDrop,
  };
}
