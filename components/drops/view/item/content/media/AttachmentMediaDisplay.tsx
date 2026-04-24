"use client";

import { getFileInfoFromUrl } from "@/helpers/file.helpers";
import {
  ArrowTopRightOnSquareIcon,
  ArrowDownTrayIcon,
  DocumentIcon,
  EyeIcon,
  EyeSlashIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useEffect, useMemo, useState } from "react";

type AttachmentRenderType = "csv" | "pdf" | "unknown";

const CSV_PREVIEW_MAX_ROWS = 51;
const CSV_PREVIEW_MAX_COLUMNS = 12;
const CSV_PREVIEW_MAX_CHARS = 500_000;

function getAttachmentRenderType(
  mimeType: string,
  url: string
): AttachmentRenderType {
  const normalizedMimeType = mimeType.split(";")[0]?.trim().toLowerCase();
  const normalizedUrl = url.toLowerCase();

  if (
    normalizedMimeType === "application/pdf" ||
    normalizedUrl.includes(".pdf")
  ) {
    return "pdf";
  }

  if (
    normalizedMimeType === "text/csv" ||
    normalizedMimeType === "application/csv" ||
    normalizedMimeType === "application/vnd.ms-excel" ||
    normalizedUrl.includes(".csv")
  ) {
    return "csv";
  }

  return "unknown";
}

export function isAttachmentMimeType(mimeType: string, url: string): boolean {
  return getAttachmentRenderType(mimeType, url) !== "unknown";
}

function getAttachmentLabel(renderType: AttachmentRenderType): string {
  if (renderType === "pdf") return "PDF";
  if (renderType === "csv") return "CSV";
  return "File";
}

function getFallbackExtension(renderType: AttachmentRenderType): string {
  if (renderType === "pdf") return "pdf";
  if (renderType === "csv") return "csv";
  return "";
}

function parseCsvPreview(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        field += '"';
        index++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index++;
      }
      row.push(field);
      rows.push(row);
      if (rows.length >= CSV_PREVIEW_MAX_ROWS) {
        return rows;
      }
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function CsvAttachmentPreview({ url }: { readonly url: string }) {
  const [rows, setRows] = useState<string[][] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load CSV preview.");
        }
        const text = await response.text();
        setRows(parseCsvPreview(text.slice(0, CSV_PREVIEW_MAX_CHARS)));
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Unable to load CSV.");
      });

    return () => controller.abort();
  }, [url]);

  if (error) {
    return (
      <div className="tw-rounded-b-lg tw-border tw-border-t-0 tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-4 tw-text-sm tw-text-iron-300">
        {error}
      </div>
    );
  }

  if (!rows) {
    return (
      <div className="tw-rounded-b-lg tw-border tw-border-t-0 tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-4 tw-text-sm tw-text-iron-400">
        Loading CSV...
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="tw-rounded-b-lg tw-border tw-border-t-0 tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-p-4 tw-text-sm tw-text-iron-400">
        Empty CSV
      </div>
    );
  }

  const visibleRows = rows.map((row) => row.slice(0, CSV_PREVIEW_MAX_COLUMNS));

  return (
    <div className="tw-max-h-[28rem] tw-overflow-auto tw-rounded-b-lg tw-border tw-border-t-0 tw-border-solid tw-border-iron-700 tw-bg-iron-950">
      <table className="tw-w-full tw-border-separate tw-border-spacing-0 tw-text-left tw-text-xs tw-text-iron-200">
        <tbody>
          {visibleRows.map((row, rowIndex) => (
            <tr key={`csv-row-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td
                  key={`csv-cell-${rowIndex}-${cellIndex}`}
                  className={clsx(
                    "tw-max-w-64 tw-border-0 tw-border-b tw-border-r tw-border-solid tw-border-iron-800 tw-px-3 tw-py-2 tw-align-top",
                    rowIndex === 0 && "tw-bg-iron-900 tw-font-semibold"
                  )}
                >
                  <span className="tw-line-clamp-4 tw-break-words">{cell}</span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AttachmentMediaDisplay({
  media_mime_type,
  media_url,
}: {
  readonly media_mime_type: string;
  readonly media_url: string;
}) {
  const [isRendered, setIsRendered] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const renderType = getAttachmentRenderType(media_mime_type, media_url);
  const fileInfo = getFileInfoFromUrl(media_url);
  const fallbackExtension = getFallbackExtension(renderType);
  const fileName = fileInfo
    ? `${fileInfo.name}.${fileInfo.extension}`
    : fallbackExtension
      ? `attachment.${fallbackExtension}`
      : "attachment";
  const label = getAttachmentLabel(renderType);
  const canRender = renderType === "pdf" || renderType === "csv";
  const canOpenInNewTab = renderType === "pdf";
  const Icon = renderType === "csv" ? TableCellsIcon : DocumentIcon;
  const encodedUrl = useMemo(() => media_url, [media_url]);
  const handleDownload = async () => {
    if (isDownloading) {
      return;
    }

    setIsDownloading(true);

    try {
      const response = await fetch(encodedUrl);
      if (!response.ok) {
        throw new Error("Unable to download attachment.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      const anchor = document.createElement("a");
      anchor.href = encodedUrl;
      anchor.download = fileName;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
    } finally {
      setIsDownloading(false);
    }
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
        <div className="tw-min-w-0 tw-flex-1">
          <div className="tw-truncate tw-text-sm tw-font-medium tw-text-iron-100">
            {fileName}
          </div>
          <div className="tw-text-xs tw-font-medium tw-text-iron-500">
            {label}
          </div>
        </div>
        <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-x-2">
          {canRender && (
            <button
              type="button"
              onClick={() => setIsRendered((current) => !current)}
              aria-label={
                isRendered
                  ? "Hide attachment preview"
                  : "Render attachment preview"
              }
              title={isRendered ? "Hide preview" : "Render preview"}
              className="tw-inline-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-text-iron-100 tw-transition desktop-hover:hover:tw-bg-iron-700"
            >
              {isRendered ? (
                <EyeSlashIcon className="tw-size-4" aria-hidden="true" />
              ) : (
                <EyeIcon className="tw-size-4" aria-hidden="true" />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={handleDownload}
            aria-label="Download attachment"
            title={isDownloading ? "Downloading" : "Download"}
            disabled={isDownloading}
            className="tw-inline-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-text-iron-100 tw-no-underline tw-transition desktop-hover:hover:tw-bg-iron-700"
          >
            <ArrowDownTrayIcon className="tw-size-4" aria-hidden="true" />
          </button>
          {canOpenInNewTab && (
            <a
              href={encodedUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open attachment"
              title="Open"
              className="tw-inline-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-text-iron-100 tw-transition desktop-hover:hover:tw-bg-iron-700"
            >
              <ArrowTopRightOnSquareIcon
                className="tw-size-4"
                aria-hidden="true"
              />
            </a>
          )}
        </div>
      </div>
      {isRendered && renderType === "pdf" && (
        <iframe
          src={encodedUrl}
          title={fileName}
          className="tw-h-[32rem] tw-w-full tw-rounded-b-lg tw-border tw-border-t-0 tw-border-solid tw-border-iron-700 tw-bg-iron-950"
        />
      )}
      {isRendered && renderType === "csv" && (
        <CsvAttachmentPreview url={encodedUrl} />
      )}
    </div>
  );
}
