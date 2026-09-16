"use client";

import { publicEnv } from "@/config/env";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const CURRENT = publicEnv.VERSION ?? "unknown"; // baked into the bundle
const SHOW_NEW_VERSION_TOAST_PARAM = "showNewVersionToast";
const CLIENT_VERSION_HEADER = "x-6529-client-version";
const VERSION_ENDPOINT = "/api/version";

type VersionStatusResponse = {
  readonly stale?: unknown;
};

export function useIsVersionStale(interval = 120_000, enabled = true) {
  const searchParams = useSearchParams();
  const shouldForceShowNewVersionToast =
    searchParams.get(SHOW_NEW_VERSION_TOAST_PARAM) === "true";
  const [stale, setStale] = useState(shouldForceShowNewVersionToast);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (shouldForceShowNewVersionToast) {
      setStale(true);
      return;
    }

    let id: NodeJS.Timeout;

    async function check() {
      try {
        const { stale } = await fetch(VERSION_ENDPOINT, {
          cache: "no-store",
          headers: {
            [CLIENT_VERSION_HEADER]: CURRENT,
          },
        }).then((r) => r.json() as Promise<VersionStatusResponse>);

        if (typeof stale === "boolean") {
          setStale(stale);
        }
      } catch {
        /* ignore network errors */
      }
    }

    // initial check + interval
    check();
    id = setInterval(check, interval);

    // also re-check when the tab becomes active
    const onFocus = () => check();
    globalThis.addEventListener("focus", onFocus);

    return () => {
      clearInterval(id);
      globalThis.removeEventListener("focus", onFocus);
    };
  }, [interval, enabled, shouldForceShowNewVersionToast]);

  return enabled && stale;
}
