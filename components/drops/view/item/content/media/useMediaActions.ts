"use client";

import {
  downloadMediaUrl,
  getDownloadFilenameFromUrl,
  triggerDirectDownload,
} from "@/helpers/media-download.helpers";
import useCapacitor from "@/hooks/useCapacitor";
import { useCallback, useState } from "react";

export function useMediaActions({
  url,
  fallbackFileName,
  dialogTitle = "Save file",
}: {
  readonly url: string;
  readonly fallbackFileName: string;
  readonly dialogTitle?: string | undefined;
}) {
  const { isCapacitor } = useCapacitor();
  const [isDownloading, setIsDownloading] = useState(false);
  const fileName = getDownloadFilenameFromUrl(url, fallbackFileName);
  const openLabel = isCapacitor ? "Open in browser" : "Open in new tab";

  const openMedia = useCallback(() => {
    globalThis.window.open(url, "_blank", "noopener,noreferrer");
  }, [url]);

  const downloadMedia = useCallback(async () => {
    if (isDownloading) {
      return;
    }

    setIsDownloading(true);
    try {
      await downloadMediaUrl({
        url,
        fileName,
        isCapacitor,
        dialogTitle,
      });
    } catch {
      if (!isCapacitor) {
        triggerDirectDownload(url, fileName);
      }
    } finally {
      setIsDownloading(false);
    }
  }, [dialogTitle, fileName, isCapacitor, isDownloading, url]);

  return {
    downloadMedia,
    fileName,
    isDownloading,
    openLabel,
    openMedia,
  };
}
