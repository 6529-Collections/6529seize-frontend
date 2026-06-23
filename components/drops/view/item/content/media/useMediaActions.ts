"use client";

import {
  downloadMediaUrl,
  getDownloadFilenameFromUrl,
  triggerDirectDownload,
} from "@/helpers/media-download.helpers";
import useCapacitor from "@/hooks/useCapacitor";
import { useCallback, useState } from "react";

const DIRECT_OPEN_UNSUPPORTED_EXTENSIONS = new Set(["mov", "qt"]);
const DIRECT_OPEN_UNSUPPORTED_MIME_TYPES = new Set(["video/quicktime"]);

type MediaOpenLabels = {
  readonly openInBrowser?: string | undefined;
  readonly openInNewTab?: string | undefined;
};

function getUrlExtension(url: string): string | null {
  try {
    const pathname = new URL(url, globalThis.window.location.origin).pathname;
    const fileName = pathname.split("/").findLast(Boolean);
    const extension = fileName?.split(".").pop();
    return extension?.toLowerCase() ?? null;
  } catch {
    const fileName = url.split("?")[0]?.split("#")[0]?.split("/").pop();
    const extension = fileName?.split(".").pop();
    return extension?.toLowerCase() ?? null;
  }
}

function canOpenMediaInBrowser({
  mimeType,
  url,
}: {
  readonly mimeType?: string | undefined;
  readonly url: string;
}): boolean {
  if (mimeType) {
    const normalizedMimeType = (mimeType.split(";")[0] ?? "")
      .trim()
      .toLowerCase();
    if (DIRECT_OPEN_UNSUPPORTED_MIME_TYPES.has(normalizedMimeType)) {
      return false;
    }
  }

  const extension = getUrlExtension(url);
  return !(extension && DIRECT_OPEN_UNSUPPORTED_EXTENSIONS.has(extension));
}

export function useMediaActions({
  url,
  fallbackFileName,
  dialogTitle = "Save file",
  mimeType,
  labels,
}: {
  readonly url: string;
  readonly fallbackFileName: string;
  readonly dialogTitle?: string | undefined;
  readonly mimeType?: string | undefined;
  readonly labels?: MediaOpenLabels | undefined;
}) {
  const { isCapacitor } = useCapacitor();
  const [isDownloading, setIsDownloading] = useState(false);
  const fileName = getDownloadFilenameFromUrl(url, fallbackFileName);
  const canOpen = canOpenMediaInBrowser({ mimeType, url });
  let openLabel: string | undefined;

  if (canOpen) {
    openLabel = isCapacitor
      ? (labels?.openInBrowser ?? "Open in browser")
      : (labels?.openInNewTab ?? "Open in new tab");
  }

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
    openMedia: canOpen ? openMedia : undefined,
    openLabel,
  };
}
