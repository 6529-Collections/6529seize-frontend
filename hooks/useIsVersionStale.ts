"use client";

import { publicEnv } from "@/config/env";
import { useEffect, useState } from "react";

const CURRENT = publicEnv.VERSION ?? "unknown"; // baked into the bundle
const SHOW_NEW_VERSION_TOAST_PARAM = "showNewVersionToast";
const CLIENT_VERSION_HEADER = "x-6529-client-version";
const VERSION_ENDPOINT = "/api/version";

type VersionStatusResponse = {
  readonly stale?: unknown;
};

const shouldForceShowNewVersionToast = () =>
  globalThis.window !== undefined &&
  new URLSearchParams(globalThis.location.search).get(
    SHOW_NEW_VERSION_TOAST_PARAM
  ) === "true";

export function useIsVersionStale(interval = 120_000) {
  const [stale, setStale] = useState(shouldForceShowNewVersionToast);

  useEffect(() => {
    if (shouldForceShowNewVersionToast()) {
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
  }, [interval]);

  return stale;
}
