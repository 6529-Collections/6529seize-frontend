import { publicEnv } from "@/config/env";
import {
  parseDecentralizedMediaRef,
  to6529ResolverUrl,
} from "@/lib/media/decentralized-media";

const DECENTRALIZED_SCHEME = /^(?:ipfs|ipns|ar):\/\//i;

const getPageOrigin = (): string | null =>
  typeof globalThis.window === "undefined"
    ? null
    : globalThis.window.location.origin;

/**
 * The URL a "new tab" action may open, or null when it must not open it.
 *
 * - `https:` URLs open as they are.
 * - `ipfs://`, `ipns://` and `ar://` open through the app's media resolver.
 * - `http:` and `blob:` URLs open only on this page's own origin (local
 *   builds, and files decrypted in this tab).
 * - Every other scheme (`javascript:`, `data:`, `file:`, ...) is refused.
 */
export function getOpenableUrl(
  rawUrl: string | null | undefined
): string | null {
  const trimmed = rawUrl?.trim() ?? "";
  if (!trimmed) {
    return null;
  }

  if (DECENTRALIZED_SCHEME.test(trimmed)) {
    const ref = parseDecentralizedMediaRef(trimmed);
    return ref
      ? to6529ResolverUrl(ref, publicEnv.MEDIA_RESOLVER_ENDPOINT)
      : null;
  }

  const pageOrigin = getPageOrigin();
  let url: URL;
  try {
    url = pageOrigin ? new URL(trimmed, pageOrigin) : new URL(trimmed);
  } catch {
    return null;
  }

  if (url.protocol === "https:") {
    return url.href;
  }
  if (
    (url.protocol === "http:" || url.protocol === "blob:") &&
    pageOrigin !== null &&
    url.origin === pageOrigin
  ) {
    return url.href;
  }
  return null;
}

/**
 * Opens `rawUrl` in a new tab without giving the new page a reference to
 * this one or a referrer. Returns false when the URL is not openable.
 */
export function openUrlInNewTab(rawUrl: string | null | undefined): boolean {
  const url = getOpenableUrl(rawUrl);
  if (!url) {
    return false;
  }
  globalThis.window.open(url, "_blank", "noopener,noreferrer");
  return true;
}
