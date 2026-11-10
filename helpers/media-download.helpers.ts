import {
  downloadAndShareInNativeApp,
  shareFetchedBlobInNativeApp,
} from "@/helpers/capacitorBlobDownload.helpers";
import {
  getDownloadFileDecision,
  prepareBlobForDownload,
} from "@/helpers/download-file-type.helpers";

const DOWNLOAD_URL_PROTOCOLS = new Set(["blob:", "http:", "https:"]);
const MEDIA_DOWNLOAD_FETCH_TIMEOUT_MS = 120_000;

function getSafeDownloadUrl(url: string): string {
  const parsed = new URL(url, globalThis.window.location.origin);
  if (!DOWNLOAD_URL_PROTOCOLS.has(parsed.protocol)) {
    throw new Error("Unsupported download URL protocol.");
  }
  return parsed.href;
}

function decodeFileName(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function getDownloadFilenameFromUrl(url: string, fallback = "media") {
  const decodedFallback = decodeFileName(fallback);
  // Object URLs contain a generated ID, never the attachment's original name.
  if (url.startsWith("blob:")) return fallback;
  try {
    const pathname = new URL(url).pathname;
    const name = pathname.split("/").findLast(Boolean);
    return name ? decodeFileName(name) : decodedFallback;
  } catch {
    const rawName = url.split("?")[0]?.split("#")[0]?.split("/").pop();
    const name = rawName ? decodeFileName(rawName) : undefined;
    return name ?? decodedFallback;
  }
}

/**
 * Saves `url` through a temporary link. The saved name keeps a served media
 * extension (from `declaredType` or the name); anything else becomes `.bin`.
 */
export function triggerDirectDownload(
  url: string,
  fileName: string,
  declaredType?: string
) {
  const safeUrl = getSafeDownloadUrl(url);
  const anchor = document.createElement("a");
  anchor.href = safeUrl;
  anchor.download = getDownloadFileDecision({
    fileName,
    declaredTypes: [declaredType],
  }).fileName;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  // A modal's focus trap blocks clicks outside it, including synthetic links.
  const container =
    document.activeElement?.closest("dialog[open], [role='dialog']") ??
    // A disabled download button can lose focus while the fetch completes.
    [
      ...document.querySelectorAll(
        "dialog[open], [role='dialog'][aria-modal='true']"
      ),
    ].at(-1) ??
    document.body;
  anchor.addEventListener("click", (event) => event.stopPropagation());
  container.append(anchor);
  anchor.click();
  anchor.remove();
}

export async function downloadMediaUrl({
  url,
  fileName,
  isCapacitor,
  dialogTitle = "Save file",
  mimeType,
}: {
  readonly url: string;
  readonly fileName: string;
  readonly isCapacitor: boolean;
  readonly dialogTitle?: string | undefined;
  /** The type the caller expects; the saved type is still decided here. */
  readonly mimeType?: string | undefined;
}) {
  const safeUrl = getSafeDownloadUrl(url);
  if (isCapacitor && !safeUrl.startsWith("blob:")) {
    // Written straight to disk, so the declared type and name decide.
    const { fileName: nativeFileName } = getDownloadFileDecision({
      fileName,
      declaredTypes: [mimeType],
    });
    await downloadAndShareInNativeApp(safeUrl, nativeFileName, dialogTitle);
    return;
  }

  const controller = new AbortController();
  const timeoutId = globalThis.window.setTimeout(() => {
    controller.abort();
  }, MEDIA_DOWNLOAD_FETCH_TIMEOUT_MS);
  let fetched: Blob;
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error("Unable to download media.");
    }

    fetched = await response.blob();
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error("Media download timed out.");
    }
    throw error;
  } finally {
    globalThis.window.clearTimeout(timeoutId);
  }

  const download = await prepareBlobForDownload({
    blob: fetched,
    fileName,
    declaredType: mimeType,
  });
  if (isCapacitor) {
    await shareFetchedBlobInNativeApp(download.blob, download.fileName, {
      dialogTitle,
    });
    return;
  }

  const objectUrl = URL.createObjectURL(download.blob);
  try {
    triggerDirectDownload(objectUrl, download.fileName);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
