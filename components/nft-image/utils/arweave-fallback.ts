import type React from "react";

/**
 * Public gateways in priority order (best -> worst).
 */
const ARWEAVE_GATEWAYS: readonly string[] = [
  "arweave.net",
  "arweave.org",
  "arweave.dev",
  "ar-io.net",
  "arweave.live",
  "gateway.arweave.io",
  "arweave.surf",
  "arweave.team",
  "arweavetoday.com",
  "arweave.fyi",
  "arweave.guide",
] as const;

function safeParseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function normalizeHost(hostname: string): string {
  const h = hostname.toLowerCase();
  if (h === "arweave.net" || h.endsWith(".arweave.net")) return "arweave.net";
  return h;
}

function isArweaveGatewayHost(hostname: string): boolean {
  const h = normalizeHost(hostname);
  return ARWEAVE_GATEWAYS.includes(h);
}

function isArweaveUrl(url: string): boolean {
  const u = safeParseUrl(url);
  return !!u && isArweaveGatewayHost(u.hostname);
}

function getGatewayIndexFromUrl(url: string): number {
  const u = safeParseUrl(url);
  if (!u) return -1;

  const h = normalizeHost(u.hostname);
  return ARWEAVE_GATEWAYS.indexOf(h);
}

function buildUrlWithGateway(
  originalUrl: string,
  gatewayHost: string
): string | null {
  const u = safeParseUrl(originalUrl);
  if (!u) return null;

  u.hostname = gatewayHost;
  u.host = gatewayHost + (u.port ? `:${u.port}` : "");
  return u.toString();
}

type MediaErrorEvent =
  | React.SyntheticEvent<HTMLImageElement, Event>
  | React.SyntheticEvent<HTMLVideoElement, Event>;

const DS_ORIGINAL = "arweaveOriginalSrc";
const DS_INDEX = "arweaveGatewayIndex";

export function withArweaveFallback(
  onError?: (event: MediaErrorEvent) => void
): (event: MediaErrorEvent) => void {
  return (event: MediaErrorEvent) => {
    const target = event.currentTarget;
    const currentSrc = target.src;

    if (!currentSrc || !isArweaveUrl(currentSrc)) {
      onError?.(event);
      return;
    }

    let originalSrc = target.dataset[DS_ORIGINAL];

    if (originalSrc && originalSrc !== currentSrc) {
      delete target.dataset[DS_INDEX];
      originalSrc = currentSrc;
      target.dataset[DS_ORIGINAL] = originalSrc;
    } else if (!originalSrc) {
      originalSrc = currentSrc;
      target.dataset[DS_ORIGINAL] = originalSrc;
    }

    const storedIdxRaw = target.dataset[DS_INDEX];
    const storedIdx = storedIdxRaw === undefined ? Number.NaN : Number(storedIdxRaw);

    const currentIdx = Number.isFinite(storedIdx)
      ? storedIdx
      : getGatewayIndexFromUrl(currentSrc);

    const nextIdx = Math.max(currentIdx, 0) + 1;

    if (nextIdx >= ARWEAVE_GATEWAYS.length) {
      onError?.(event);
      return;
    }

    const nextGateway = ARWEAVE_GATEWAYS[nextIdx];
    if (nextGateway === undefined) {
      onError?.(event);
      return;
    }
    const nextUrl = buildUrlWithGateway(originalSrc, nextGateway);

    if (!nextUrl) {
      onError?.(event);
      return;
    }

    target.dataset[DS_INDEX] = String(nextIdx);
    target.src = nextUrl;
  };
}
