import { normalizeDecentralizedMediaUrl } from "@/lib/media/decentralized-media";
import type {
  MediaFileView,
  MediaKind,
  MediaLocator,
  StorageStatus,
  WorkRecordInfo,
} from "@/lib/stream/types";

/** How the browser shows a MIME type (docs/integrators/reading-a-work.md). */
export function mediaKindOf(contentType: string): MediaKind {
  const type = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  if (type.startsWith("image/")) {
    return "image";
  }
  if (type.startsWith("video/")) {
    return "video";
  }
  if (type.startsWith("audio/")) {
    return "audio";
  }
  if (type === "text/html") {
    return "html";
  }
  if (type === "text/javascript" || type === "application/javascript") {
    return "script";
  }
  return "other";
}

/**
 * A browser URL for a locator: `ar://` and `ipfs://` go through the 6529 media
 * resolver. An on-chain copy has no URL; read it from the content store or
 * `fullTokenURI`.
 */
export function locatorDisplayUrl(locator: MediaLocator): string | null {
  if (locator.kind === "ONCHAIN") {
    return null;
  }
  return normalizeDecentralizedMediaUrl(locator.uri) ?? null;
}

/** Where a work's files live (on-chain complete, some files stored, or none). */
export function storageStatusOf(
  record: Pick<WorkRecordInfo, "onChainComplete"> | null,
  media: readonly Pick<MediaFileView, "onChain">[]
): StorageStatus {
  if (record?.onChainComplete === true) {
    return "on-chain";
  }
  return media.some((file) => file.onChain) ? "partly-on-chain" : "off-chain";
}

const DATA_HTML_BASE64 = "data:text/html;base64,";

/**
 * The HTML an `animation_url` carries, for a sandboxed `srcdoc` frame. Only
 * `data:text/html;base64,` is decoded; anything else returns null and is shown
 * by URL (subject to the frame-src policy).
 */
export function decodeInlineHtml(uri: string): string | null {
  if (!uri.startsWith(DATA_HTML_BASE64)) {
    return null;
  }
  try {
    const binary = atob(uri.slice(DATA_HTML_BASE64.length));
    const bytes = Uint8Array.from(binary, (character) =>
      character.charCodeAt(0)
    );
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}
