"use client";

import { useEffect, useState } from "react";

export function useVideoViewportHeight() {
  const [height, setHeight] = useState<number | undefined>(() =>
    typeof window === "undefined" ? undefined : globalThis.window.innerHeight
  );
  useEffect(() => {
    const update = () => setHeight(globalThis.window.innerHeight);
    globalThis.window.addEventListener("resize", update);
    return () => globalThis.window.removeEventListener("resize", update);
  }, []);
  return height;
}
