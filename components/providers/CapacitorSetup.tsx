"use client";

import { useEffect } from "react";
import useCapacitor from "@/hooks/useCapacitor";

export default function CapacitorSetup() {
  const { isCapacitor } = useCapacitor();

  useEffect(() => {
    const content = isCapacitor
      ? "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover"
      : "width=device-width, initial-scale=1.0";

    let meta = document.querySelector(
      'meta[name="viewport"]'
    ) as HTMLMetaElement | null;

    if (meta) {
      meta.content = content;
    } else {
      meta = document.createElement("meta");
      meta.name = "viewport";
      meta.content = content;
      document.head.appendChild(meta);
    }

    if (isCapacitor) {
      document.body.classList.add("capacitor-native");
    }
  }, [isCapacitor]);

  return null;
}
