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

const SAFE_URL_PROTOCOLS = new Set(["https:", "http:", "blob:"]);

function getSafeMediaUrl(rawUrl: string): string | null {
  if (!rawUrl) {
    return null;
  }
  try {
    const parsed = new URL(
      rawUrl,
      typeof window !== "undefined" ? window.location.origin : undefined
    );
    if (SAFE_URL_PROTOCOLS.has(parsed.protocol)) {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

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

function resolveAttachmentFileName(
  fileInfo: ReturnType<typeof getFileInfoFromUrl>,
  fallbackExtension: string
): string {
  if (fileInfo) {
    return `${fileInfo.name}.${fileInfo.extension}`;
  }
  if (fallbackExtension) {
    return `attachment.${fallbackExtension}`;
  }
  return "attachment";
}

interface CsvParserState {
  rows: string[][];
  row: string[];
  field: string;
  inQuotes: boolean;
}

function flushField(state: CsvParserState) {
  state.row.push(state.field);
  state.field = "";
}

function flushRow(state: CsvParserState): string[][] | null {
  flushField(state);
  state.rows.push(state.row);
  if (state.rows.length >= CSV_PREVIEW_MAX_ROWS) {
    return state.rows;
  }
  state.row = [];
  return null;
}

function processCsvQuote(
  state: CsvParserState,
  char: string,
  nextChar: string | undefined
): number {
  if (char !== '"') {
    return 0;
  }
  if (state.inQuotes && nextChar === '"') {
    state.field += '"';
    return 2;
  }
  state.inQuotes = !state.inQuotes;
  return 1;
}

function processCsvDelimiter(state: CsvParserState, char: string): boolean {
  if (char === "," && !state.inQuotes) {
    flushField(state);
    return true;
  }
  return false;
}

function processCsvLineBreak(
  state: CsvParserState,
  char: string,
  nextChar: string | undefined
): { consumed: number; rows: string[][] | null } {
  if ((char === "\n" || char === "\r") && !state.inQuotes) {
    return {
      consumed: char === "\r" && nextChar === "\n" ? 2 : 1,
      rows: flushRow(state),
    };
  }
  return { consumed: 0, rows: null };
}

function parseCsvPreview(text: string): string[][] {
  const state: CsvParserState = {
    rows: [],
    row: [],
    field: "",
    inQuotes: false,
  };

  for (let index = 0; index < text.length; index++) {
    const char = text.charAt(index);
    const nextChar =
      index + 1 < text.length ? text.charAt(index + 1) : undefined;

    const quoteConsumed = processCsvQuote(state, char, nextChar);
    if (quoteConsumed > 0) {
      index += quoteConsumed - 1;
      continue;
    }

    if (processCsvDelimiter(state, char)) {
      continue;
    }

    const lineBreakResult = processCsvLineBreak(state, char, nextChar);
    if (lineBreakResult.consumed > 0) {
      if (lineBreakResult.rows) {
        return lineBreakResult.rows;
      }
      index += lineBreakResult.consumed - 1;
      continue;
    }

    state.field += char;
  }

  if (!state.inQuotes && (state.field.length || state.row.length)) {
    flushField(state);
    state.rows.push(state.row);
  }

  return state.rows;
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
  const rowKeyCounts = new Map<string, number>();
  let isFirstRow = true;

  return (
    <div className="tw-max-h-[28rem] tw-overflow-auto tw-rounded-b-lg tw-border tw-border-t-0 tw-border-solid tw-border-iron-700 tw-bg-iron-950">
      <table className="tw-w-full tw-border-separate tw-border-spacing-0 tw-text-left tw-text-xs tw-text-iron-200">
        <tbody>
          {visibleRows.map((row) => {
            const rowSignature = row.join("\u0001");
            const rowCount = rowKeyCounts.get(rowSignature) ?? 0;
            rowKeyCounts.set(rowSignature, rowCount + 1);
            const cellKeyCounts = new Map<string, number>();
            const rowIsHeader = isFirstRow;
            isFirstRow = false;

            return (
              <tr key={`csv-row-${rowSignature}-${rowCount}`}>
                {row.map((cell) => {
                  const cellCount = cellKeyCounts.get(cell) ?? 0;
                  cellKeyCounts.set(cell, cellCount + 1);

                  return (
                    <td
                      key={`csv-cell-${cell}-${cellCount}`}
                      className={clsx(
                        "tw-max-w-64 tw-border-0 tw-border-b tw-border-r tw-border-solid tw-border-iron-800 tw-px-3 tw-py-2 tw-align-top",
                        rowIsHeader && "tw-bg-iron-900 tw-font-semibold"
                      )}
                    >
                      <span className="tw-line-clamp-4 tw-break-words">
                        {cell}
                      </span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function AttachmentMediaDisplay({
  media_mime_type,
  media_url,
  disableMediaInteraction = false,
}: {
  readonly media_mime_type: string;
  readonly media_url: string;
  readonly disableMediaInteraction?: boolean | undefined;
}) {
  const [isRendered, setIsRendered] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const safeMediaUrl = useMemo(() => getSafeMediaUrl(media_url), [media_url]);
  const renderType = getAttachmentRenderType(media_mime_type, media_url);
  const fileInfo = getFileInfoFromUrl(media_url);
  const fallbackExtension = getFallbackExtension(renderType);
  const fileName = resolveAttachmentFileName(fileInfo, fallbackExtension);
  const label = getAttachmentLabel(renderType);
  const canRender =
    safeMediaUrl !== null && (renderType === "pdf" || renderType === "csv");
  const canOpenInNewTab = safeMediaUrl !== null && renderType === "pdf";
  const canDownload = safeMediaUrl !== null;
  const Icon = renderType === "csv" ? TableCellsIcon : DocumentIcon;
  const handleDownload = async () => {
    if (isDownloading || !safeMediaUrl) {
      return;
    }

    setIsDownloading(true);

    try {
      const response = await fetch(safeMediaUrl);
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
      anchor.href = safeMediaUrl;
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
        {!disableMediaInteraction && (
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
            {canDownload && (
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
            )}
            {canOpenInNewTab && safeMediaUrl && (
              <a
                href={safeMediaUrl}
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
        )}
      </div>
      {isRendered && renderType === "pdf" && safeMediaUrl && (
        <iframe
          src={safeMediaUrl}
          title={fileName}
          sandbox="allow-scripts allow-popups allow-downloads"
          referrerPolicy="no-referrer"
          className="tw-h-[32rem] tw-w-full tw-rounded-b-lg tw-border tw-border-t-0 tw-border-solid tw-border-iron-700 tw-bg-iron-950"
        />
      )}
      {isRendered && renderType === "csv" && safeMediaUrl && (
        <CsvAttachmentPreview url={safeMediaUrl} />
      )}
    </div>
  );
}
