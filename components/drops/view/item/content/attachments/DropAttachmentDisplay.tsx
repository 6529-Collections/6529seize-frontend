"use client";

import { getFileInfoFromUrl } from "@/helpers/file.helpers";
import { shareFetchedBlobInNativeApp } from "@/helpers/capacitorBlobDownload.helpers";
import { t } from "@/i18n/messages";
import { formatFileSizeLabel } from "@/lib/link-preview/filePreviewI18n";
import {
  DocumentIcon,
  EyeIcon,
  EyeSlashIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import useCapacitor from "@/hooks/useCapacitor";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatedAttachmentPanel,
  AttachmentMoreMenu,
  ATTACHMENT_DOWNLOAD_FETCH_TIMEOUT_MS,
  ATTACHMENT_LOCALE,
  CsvAttachmentPreview,
  getAttachmentLabel,
  getAttachmentRenderType,
  getFallbackExtension,
  getSafeAttachmentUrl,
  isScannedValidatedAttachment,
  resolveAttachmentFileName,
  TrustedAttachmentBadge,
  type AttachmentSafety,
} from "./DropAttachmentDisplay.view";

export default function DropAttachmentDisplay({
  mimeType,
  attachmentUrl,
  fileName: providedFileName,
  safety,
  disableMediaInteraction = false,
}: {
  readonly mimeType: string;
  readonly attachmentUrl: string;
  readonly fileName?: string | undefined;
  readonly safety?: AttachmentSafety | undefined;
  readonly disableMediaInteraction?: boolean | undefined;
}) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const downloadAbortRef = useRef<AbortController | null>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const { isCapacitor } = useCapacitor();
  const safeAttachmentUrl = useMemo(
    () => getSafeAttachmentUrl(attachmentUrl),
    [attachmentUrl]
  );
  const isScannedValidated = isScannedValidatedAttachment(safety);
  const safetySize = formatFileSizeLabel(safety?.size_bytes, ATTACHMENT_LOCALE);
  const hasSafetyMetadata = Boolean(safetySize || safety?.sha256);
  const hasDetails = hasSafetyMetadata;
  const isRendered = isPreviewOpen;
  const safetyLabel = t(ATTACHMENT_LOCALE, "attachment.safety.badge");
  const viewSafetyDetailsLabel = t(
    ATTACHMENT_LOCALE,
    "attachment.safety.viewDetails"
  );
  const hideSafetyDetailsLabel = t(
    ATTACHMENT_LOCALE,
    "attachment.safety.hideDetails"
  );
  const { renderType, fileName, label, canRender, Icon } = useMemo(() => {
    const nextRenderType = getAttachmentRenderType(mimeType, attachmentUrl);
    const fileInfo = getFileInfoFromUrl(attachmentUrl);
    const fallbackExtension = getFallbackExtension(nextRenderType);
    const nextFileName =
      providedFileName ??
      resolveAttachmentFileName(fileInfo, fallbackExtension);
    const nextLabel = getAttachmentLabel(nextRenderType);
    const nextCanRender =
      safeAttachmentUrl !== null &&
      (nextRenderType === "pdf" || nextRenderType === "csv");
    const NextIcon = nextRenderType === "csv" ? TableCellsIcon : DocumentIcon;
    return {
      renderType: nextRenderType,
      fileName: nextFileName,
      label: nextLabel,
      canRender: nextCanRender,
      Icon: NextIcon,
    };
  }, [attachmentUrl, mimeType, providedFileName, safeAttachmentUrl]);

  useEffect(
    () => () => {
      downloadAbortRef.current?.abort();
      downloadAbortRef.current = null;
    },
    []
  );

  useEffect(() => {
    if (!copiedLink) {
      return;
    }

    const timeoutId = globalThis.window.setTimeout(
      () => setCopiedLink(false),
      1500
    );
    return () => globalThis.window.clearTimeout(timeoutId);
  }, [copiedLink]);

  const handleDownload = async () => {
    if (isDownloading || !safeAttachmentUrl) {
      return;
    }

    setIsDownloading(true);
    setDownloadError(null);
    const controller = new AbortController();
    downloadAbortRef.current = controller;
    const timeoutId = globalThis.window.setTimeout(() => {
      controller.abort();
    }, ATTACHMENT_DOWNLOAD_FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(safeAttachmentUrl, {
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error("Unable to download attachment.");
      }

      const blob = await response.blob();
      if (isCapacitor) {
        await shareFetchedBlobInNativeApp(blob, fileName);
      } else {
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = fileName;
        document.body.append(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(objectUrl);
      }
    } catch (error) {
      if (
        controller.signal.aborted ||
        downloadAbortRef.current !== controller
      ) {
        return;
      }

      console.error("Failed to download attachment", error);

      if (isCapacitor) {
        setDownloadError("Unable to download attachment.");
        return;
      }

      const anchor = document.createElement("a");
      anchor.href = safeAttachmentUrl;
      anchor.download = fileName;
      anchor.target = "_blank";
      anchor.rel = "noopener noreferrer";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
    } finally {
      globalThis.window.clearTimeout(timeoutId);
      if (downloadAbortRef.current === controller) {
        downloadAbortRef.current = null;
      }
      setIsDownloading(false);
    }
  };

  const handleCopyLink = async () => {
    if (!safeAttachmentUrl) {
      return;
    }

    try {
      await navigator.clipboard.writeText(safeAttachmentUrl);
      setCopiedLink(true);
    } catch (error) {
      console.error("Failed to copy attachment link", error);
    }
  };

  const handleToggleDetails = () => {
    setIsDetailsOpen((current) => !current);
    setIsMoreMenuOpen(false);
  };

  const handleToggleMoreMenu = () => {
    if (!isMoreMenuOpen) {
      setCopiedLink(false);
      setDownloadError(null);
    }
    setIsMoreMenuOpen((current) => !current);
  };

  const handleMenuCopyLink = async () => {
    await handleCopyLink();
    globalThis.window.setTimeout(() => {
      setIsMoreMenuOpen(false);
    }, 300);
  };

  const handleMenuDownload = () => {
    void handleDownload();
    setIsMoreMenuOpen(false);
  };

  return (
    <div className="tw-flex tw-w-full tw-flex-col">
      <div
        className={clsx(
          "tw-flex tw-w-full tw-items-center tw-gap-x-3 tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-p-3",
          isRendered && "tw-rounded-b-none"
        )}
      >
        <div className="tw-flex tw-size-10 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-bg-iron-800 tw-text-iron-300">
          <Icon className="tw-size-6" aria-hidden="true" />
        </div>
        <div className="tw-min-w-0 tw-flex-1 tw-space-y-1">
          <div className="tw-flex tw-min-w-0 tw-items-center tw-gap-x-1.5">
            <div className="tw-min-w-0 tw-truncate tw-text-sm tw-font-medium tw-text-iron-100">
              {fileName}
            </div>
            {isScannedValidated && (
              <div className="tw-flex-shrink-0">
                <TrustedAttachmentBadge />
              </div>
            )}
          </div>
          <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-0.5 tw-text-xs tw-font-medium tw-text-iron-500">
            <span>{label}</span>
            {isScannedValidated && (
              <span className="tw-text-emerald-300">{safetyLabel}</span>
            )}
          </div>
        </div>
        {!disableMediaInteraction && (
          <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-x-2">
            {canRender && (
              <button
                type="button"
                onClick={() => setIsPreviewOpen((current) => !current)}
                aria-label={
                  isPreviewOpen
                    ? "Hide attachment preview"
                    : "Render attachment preview"
                }
                title={isPreviewOpen ? "Hide preview" : "Render preview"}
                className="tw-inline-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-text-iron-100 tw-transition desktop-hover:hover:tw-bg-iron-700"
              >
                {isPreviewOpen ? (
                  <EyeSlashIcon className="tw-size-4" aria-hidden="true" />
                ) : (
                  <EyeIcon className="tw-size-4" aria-hidden="true" />
                )}
              </button>
            )}
            {safeAttachmentUrl && (
              <AttachmentMoreMenu
                isOpen={isMoreMenuOpen}
                hasDetails={hasDetails}
                isDetailsOpen={isDetailsOpen}
                viewDetailsLabel={viewSafetyDetailsLabel}
                hideDetailsLabel={hideSafetyDetailsLabel}
                copiedLink={copiedLink}
                isDownloading={isDownloading}
                buttonRef={moreButtonRef}
                onToggle={handleToggleMoreMenu}
                onToggleDetails={handleToggleDetails}
                onCopyLink={handleMenuCopyLink}
                onDownload={handleMenuDownload}
              />
            )}
          </div>
        )}
      </div>
      <AnimatedAttachmentPanel isOpen={isDetailsOpen && hasDetails}>
        {hasDetails && (
          <div className="tw-rounded-b-lg tw-border tw-border-t-0 tw-border-solid tw-border-iron-700 tw-bg-iron-950">
            <div className="tw-p-4">
              <div className="tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-500">
                {t(ATTACHMENT_LOCALE, "attachment.safety.heading")}
              </div>
              <div className="tw-mt-2 tw-flex tw-flex-wrap tw-gap-2">
                {safetySize && (
                  <span className="tw-rounded-md tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-px-2 tw-py-1 tw-text-xs tw-text-iron-200">
                    {t(ATTACHMENT_LOCALE, "attachment.safety.size", {
                      size: safetySize,
                    })}
                  </span>
                )}
                {safety?.sha256 && (
                  <span className="tw-max-w-full tw-rounded-md tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-px-2 tw-py-1 tw-font-mono tw-text-xs tw-text-iron-200">
                    <span className="tw-text-iron-500">
                      {t(ATTACHMENT_LOCALE, "attachment.safety.sha256")}{" "}
                    </span>
                    <span className="tw-break-all">{safety.sha256}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatedAttachmentPanel>
      {downloadError && (
        <div className="tw-mt-1.5 tw-text-xs tw-font-medium tw-text-error">
          {downloadError}
        </div>
      )}
      <AnimatedAttachmentPanel isOpen={isPreviewOpen && !!safeAttachmentUrl}>
        {renderType === "pdf" && safeAttachmentUrl && (
          <iframe
            src={safeAttachmentUrl}
            title={fileName}
            referrerPolicy="no-referrer"
            className="tw-h-[32rem] tw-w-full tw-rounded-b-lg tw-border tw-border-t-0 tw-border-solid tw-border-iron-700 tw-bg-iron-950"
          />
        )}
        {renderType === "csv" && safeAttachmentUrl && (
          <CsvAttachmentPreview url={safeAttachmentUrl} />
        )}
      </AnimatedAttachmentPanel>
    </div>
  );
}
