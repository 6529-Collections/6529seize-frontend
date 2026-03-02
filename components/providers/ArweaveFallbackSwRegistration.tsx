"use client";

import { useEffect } from "react";

const SW_PATH = "/arweave-fallback-sw.js";

export default function ArweaveFallbackSwRegistration() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }
    navigator.serviceWorker
      .register(SW_PATH, { scope: "/" })
      .catch((e) => {
        if (process.env.NODE_ENV !== "production") {
          console.error(`[ArweaveFallbackSW] Failed to register ${SW_PATH}:`, e);
        }
      });
  }, []);
  return null;
}
