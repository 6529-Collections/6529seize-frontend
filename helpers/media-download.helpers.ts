import { shareFetchedBlobInNativeApp } from "@/helpers/capacitorBlobDownload.helpers";

const DOWNLOAD_URL_PROTOCOLS = new Set(["blob:", "http:", "https:"]);

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
  try {
    const pathname = new URL(url).pathname;
    const name = pathname.split("/").findLast(Boolean);
    return name ? decodeFileName(name) : decodedFallback;
  } catch {
    const rawName = url.split("?")[0]?.split("#")[0]?.split("/").pop();
    const name = rawName ? decodeFileName(rawName) : undefined;
    return name || decodedFallback;
  }
}

export function triggerDirectDownload(url: string, fileName: string) {
  const safeUrl = getSafeDownloadUrl(url);
  const anchor = document.createElement("a");
  anchor.href = safeUrl;
  anchor.download = fileName;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

export async function downloadMediaUrl({
  url,
  fileName,
  isCapacitor,
  dialogTitle = "Save file",
}: {
  readonly url: string;
  readonly fileName: string;
  readonly isCapacitor: boolean;
  readonly dialogTitle?: string | undefined;
}) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Unable to download media.");
  }

  const blob = await response.blob();
  if (isCapacitor) {
    await shareFetchedBlobInNativeApp(blob, fileName, { dialogTitle });
    return;
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    triggerDirectDownload(objectUrl, fileName);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
