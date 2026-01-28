"use client";

import { useEffect, useState } from "react";

export default function useHasTouchInput(): boolean {
  const [hasTouchInput, setHasTouchInput] = useState(() => {
    if (typeof globalThis === "undefined") {
      return false;
    }

    const nav = globalThis.navigator as Navigator | undefined;
    return (nav?.maxTouchPoints ?? 0) > 0;
  });

  useEffect(() => {
    if (typeof globalThis === "undefined") {
      return;
    }

    if (hasTouchInput) {
      return;
    }

    const onTouchStart = () => {
      setHasTouchInput(true);
      globalThis.removeEventListener("touchstart", onTouchStart);
    };

    globalThis.addEventListener("touchstart", onTouchStart, { passive: true });

    return () => {
      globalThis.removeEventListener("touchstart", onTouchStart);
    };
  }, [hasTouchInput]);

  return hasTouchInput;
}
