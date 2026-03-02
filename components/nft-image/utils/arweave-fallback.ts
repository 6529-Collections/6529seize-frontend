import type React from "react";

function isArweaveUrl(url: string): boolean {
  try {
    const h = new URL(url).hostname.toLowerCase();
    return h === "arweave.net" || h.endsWith(".arweave.net");
  } catch {
    return false;
  }
}

function getArweaveFallbackUrl(url: string): string | null {
  if (!isArweaveUrl(url)) return null;
  try {
    const u = new URL(url);
    u.hostname = "ar-io.net";
    u.host = "ar-io.net" + (u.port ? ":" + u.port : "");
    return u.toString();
  } catch {
    return null;
  }
}

type MediaErrorEvent =
  | React.SyntheticEvent<HTMLImageElement, Event>
  | React.SyntheticEvent<HTMLVideoElement, Event>;

export function withArweaveFallback(
  onError?: (event: MediaErrorEvent) => void
): (event: MediaErrorEvent) => void {
  return (event: MediaErrorEvent) => {
    const target = event.currentTarget;
    const src = target.src;
    if (src && isArweaveUrl(src)) {
      const fallback = getArweaveFallbackUrl(src);
      if (fallback) {
        if (target.dataset['arweaveOriginalSrc'] === undefined) {
          target.dataset['arweaveOriginalSrc'] = src;
        }
        target.src = fallback;
        return;
      }
    }
    onError?.(event);
  };
}
