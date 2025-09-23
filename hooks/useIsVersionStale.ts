"use client";

import { env } from "@/config/env";
import { useEffect, useState } from "react";

const CURRENT = env.VERSION!; // baked into the bundle

export function useIsVersionStale(interval = 120_000) {
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let id: NodeJS.Timeout;

    async function check() {
      try {
        const { version } = await fetch("/api/version", {
          cache: "no-store",
        }).then((r) => r.json());
        setStale(version !== CURRENT);
      } catch {
        /* ignore network errors */
      }
    }

    // initial check + interval
    check();
    id = setInterval(check, interval);

    // also re-check when the tab becomes active
    const onFocus = () => check();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [interval]);

  return stale;
}
