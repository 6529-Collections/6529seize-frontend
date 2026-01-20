"use client";

import useCapacitor from "@/hooks/useCapacitor";
import { useEffect, useRef } from "react";
import PullToRefresh from "./PullToRefresh";

export default function CapacitorSetup() {
  const { isCapacitor } = useCapacitor();
  const originalViewport = useRef<string | null>(null);

  useEffect(() => {
    if (isCapacitor) {
      document.body.classList.add("capacitor-native");
    } else {
      document.body.classList.remove("capacitor-native");
    }
  }, [isCapacitor]);

  useEffect(() => {
    if (typeof document === "undefined") return;

    const meta =
      document.querySelector('meta[name="viewport"]') ??
      document.createElement("meta");

    if (!meta.getAttribute("name")) {
      meta.setAttribute("name", "viewport");
      document.head.appendChild(meta);
    }

    originalViewport.current ??= meta.getAttribute("content");

    if (isCapacitor) {
      meta.setAttribute(
        "content",
        "width=device-width,initial-scale=1,maximum-scale=1,minimum-scale=1,user-scalable=no,viewport-fit=cover"
      );
    } else if (originalViewport.current) {
      meta.setAttribute("content", originalViewport.current);
    }

    return () => {
      if (originalViewport.current) {
        meta.setAttribute("content", originalViewport.current);
      }
    };
  }, [isCapacitor]);

  return <PullToRefresh />;
}
