"use client";

import { publicEnv } from "@/config/env";
import { useEffect, useState } from "react";

const CURRENT = publicEnv.VERSION!; // baked into the bundle
const SHOW_NEW_VERSION_TOAST_PARAM = "showNewVersionToast";
const VERSION_ENDPOINT = "/api/version";

type VersionStatusResponse = {
  readonly announced_version?: unknown;
  readonly version?: unknown;
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
        const { announced_version, version } = await fetch(VERSION_ENDPOINT, {
          cache: "no-store",
        }).then((r) => r.json() as Promise<VersionStatusResponse>);
        const targetVersion =
          typeof publicEnv.ANNOUNCED_VERSION_ENDPOINT === "string" &&
          publicEnv.ANNOUNCED_VERSION_ENDPOINT.length > 0
            ? announced_version
            : (announced_version ?? version);

        if (typeof targetVersion === "string" && targetVersion.length > 0) {
          setStale(targetVersion !== CURRENT);
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
