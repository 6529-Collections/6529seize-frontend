"use client";

import { useEffect, useState } from "react";

export default function useIsTouchDevice(): boolean {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const hasFinePointer = window.matchMedia?.("(pointer: fine)")?.matches;
    if (hasFinePointer) {
      setIsTouchDevice(false);
      return;
    }

    const onTouchStart = () => {
      setIsTouchDevice(true);
      window.removeEventListener("touchstart", onTouchStart);
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });

    return () => {
      window.removeEventListener("touchstart", onTouchStart);
    };
  }, []);

  return isTouchDevice;
}
