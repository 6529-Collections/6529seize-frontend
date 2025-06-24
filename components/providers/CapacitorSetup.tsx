"use client";

import { useLayoutEffect } from "react";
import useCapacitor from "@/hooks/useCapacitor";

export default function CapacitorSetup() {
  const { isCapacitor } = useCapacitor();

  useLayoutEffect(() => {
    const content = isCapacitor
      ? "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
      : "width=device-width, initial-scale=1.0";

    const existingMeta = document.querySelector('meta[name="viewport"]');
    if (existingMeta) {
      existingMeta.remove();
    }

    // Create and append a new one
    const meta = document.createElement("meta");
    meta.name = "viewport";
    meta.content = content;
    document.head.appendChild(meta);

    if (isCapacitor) {
      document.body.classList.add("capacitor-native");
    }
  }, [isCapacitor]);

  return null;
}
