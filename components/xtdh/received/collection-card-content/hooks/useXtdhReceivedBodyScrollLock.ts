'use client';

import { useEffect } from "react";

export function useXtdhReceivedBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof document === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [active]);
}
