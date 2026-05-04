import { shareFetchedBlobInNativeApp } from "@/helpers/capacitorBlobDownload.helpers";

export function getDownloadFilenameFromUrl(url: string, fallback = "media") {
  try {
    const pathname = new URL(url).pathname;
    const name = pathname.split("/").filter(Boolean).pop();
    return name ? decodeURIComponent(name) : fallback;
  } catch {
    const name = url.split("?")[0]?.split("#")[0]?.split("/").pop();
    return name || fallback;
  }
}

export function triggerDirectDownload(url: string, fileName: string) {
  const anchor = document.createElement("a");
  anchor.href = url;
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
  shareTitle,
}: {
  readonly url: string;
  readonly fileName: string;
  readonly isCapacitor: boolean;
  readonly dialogTitle?: string | undefined;
  readonly shareTitle?: string | undefined;
}) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Unable to download media.");
  }

  const blob = await response.blob();
  if (isCapacitor) {
    await shareFetchedBlobInNativeApp(blob, fileName, {
      dialogTitle,
      title: shareTitle,
      preferNavigatorShare: true,
    });
    return;
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    triggerDirectDownload(objectUrl, fileName);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
