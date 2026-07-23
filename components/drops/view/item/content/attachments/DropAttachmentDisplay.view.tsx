"use client";

import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { getFileInfoFromUrl } from "@/helpers/file.helpers";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import CommonDropdownItemsDefaultWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsDefaultWrapper";
import type { ApiAttachment } from "@/generated/models/ApiAttachment";
import { ApiAttachmentSafetyStatus } from "@/generated/models/ApiAttachmentSafetyStatus";
import { faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  ArrowDownTrayIcon,
  EllipsisHorizontalIcon,
  LinkIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import clsx from "clsx";
import { Tooltip } from "react-tooltip";
import type { ReactNode, RefObject } from "react";
import { useEffect, useId, useState } from "react";

const SAFE_URL_PROTOCOLS = new Set(["https:", "http:", "blob:"]);

export function getSafeAttachmentUrl(rawUrl: string): string | null {
  if (rawUrl) {
    try {
      const resolvedUrl = resolveIpfsUrlSync(rawUrl);
      const parsed = new URL(resolvedUrl, globalThis.window?.location.origin);
      if (SAFE_URL_PROTOCOLS.has(parsed.protocol)) {
        return parsed.toString();
      }
    } catch {
      return null;
    }
  }

  return null;
}

type AttachmentRenderType = "csv" | "pdf" | "unknown";

const CSV_PREVIEW_MAX_ROWS = 51;
const CSV_PREVIEW_MAX_COLUMNS = 12;
const CSV_PREVIEW_MAX_CHARS = 500_000;

const CSV_PREVIEW_SIZE_EXCEEDED = "__CSV_PREVIEW_SIZE_EXCEEDED__";
const TRUSTED_BADGE_BUTTON_CLASS =
  "tw-relative tw-inline-flex tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-emerald-500/20 tw-bg-emerald-500/10 tw-text-emerald-400 tw-transition-colors tw-duration-200 tw-ease-out focus:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-emerald-500/20 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-950 desktop-hover:hover:tw-border-emerald-400/30 desktop-hover:hover:tw-bg-emerald-500/15 desktop-hover:hover:tw-text-emerald-300";
const TRUSTED_BADGE_ICON_CLASS = "tw-flex-shrink-0 tw-text-current";
const TRUSTED_BADGE_BUTTON_SIZE_CLASS_BY_SIZE = {
  default: "tw-h-5 tw-w-5",
  compact: "tw-h-[18px] tw-w-[18px]",
} as const;
const TRUSTED_BADGE_ICON_SIZE_CLASS_BY_SIZE = {
  default: "tw-h-2.5 tw-w-2.5",
  compact: "tw-h-[9px] tw-w-[9px]",
} as const;
const CSV_PREVIEW_TIMEOUT_MESSAGE =
  "CSV preview timed out. Please download the file.";
const CSV_PREVIEW_SIZE_MESSAGE =
  "CSV preview exceeds the browser size limit. Please download the file.";
export const ATTACHMENT_LOCALE = DEFAULT_LOCALE;

export function TrustedAttachmentBadge({
  size = "default",
}: {
  readonly size?: "default" | "compact";
}) {
  const isMobile = useIsMobileDevice();
  const { hasTouchScreen } = useDeviceInfo();
  const id = useId();
  const tooltipId = `trusted-attachment-badge-${id}`;
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const showTooltip = !isMobile && !hasTouchScreen;
  const dataTooltipId = showTooltip ? tooltipId : undefined;
  const describedById = showTooltip && isTooltipOpen ? tooltipId : undefined;
  const buttonSizeClassName = TRUSTED_BADGE_BUTTON_SIZE_CLASS_BY_SIZE[size];
  const iconSizeClassName = TRUSTED_BADGE_ICON_SIZE_CLASS_BY_SIZE[size];
  const badgeLabel = t(ATTACHMENT_LOCALE, "attachment.safety.badge");

  return (
    <>
      <button
        type="button"
        onMouseEnter={() => setIsTooltipOpen(true)}
        onMouseLeave={() => setIsTooltipOpen(false)}
        className={`${TRUSTED_BADGE_BUTTON_CLASS} ${buttonSizeClassName}`}
        aria-label={t(ATTACHMENT_LOCALE, "attachment.safety.ariaLabel")}
        aria-describedby={describedById}
        {...(dataTooltipId && { "data-tooltip-id": dataTooltipId })}
      >
        <FontAwesomeIcon
          icon={faShieldHalved}
          className={`${TRUSTED_BADGE_ICON_CLASS} ${iconSizeClassName}`}
        />
      </button>
      {showTooltip && (
        <Tooltip
          id={tooltipId}
          place="top"
          positionStrategy="fixed"
          offset={8}
          opacity={1}
          style={TOOLTIP_STYLES}
          isOpen={isTooltipOpen}
        >
          <span className="tw-text-xs">{badgeLabel}</span>
        </Tooltip>
      )}
    </>
  );
}

function throwCsvPreviewSizeExceeded(onSizeExceeded: () => void): never {
  onSizeExceeded();
  throw new Error(CSV_PREVIEW_SIZE_EXCEEDED);
}

function assertCsvContentLengthWithinLimit(
  response: Response,
  maxChars: number,
  onSizeExceeded: () => void
): void {
  const lengthHeader = response.headers.get("Content-Length");
  if (lengthHeader === null) {
    return;
  }
  const parsed = Number.parseInt(lengthHeader, 10);
  if (Number.isFinite(parsed) && parsed > maxChars) {
    throwCsvPreviewSizeExceeded(onSizeExceeded);
  }
}

async function readCsvPreviewTextFromBodyLessResponse(
  response: Response,
  maxChars: number,
  onSizeExceeded: () => void
): Promise<string> {
  const text = await response.text();
  if (text.length > maxChars) {
    throwCsvPreviewSizeExceeded(onSizeExceeded);
  }
  return text;
}

function assertCsvPreviewSignalActive(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }
}

function assertNoCsvDataBeyondCap(
  peek: ReadableStreamReadResult<Uint8Array>,
  signal: AbortSignal,
  decoder: TextDecoder,
  onSizeExceeded: () => void
): void {
  assertCsvPreviewSignalActive(signal);
  if (peek.done || !peek.value) {
    return;
  }
  if (peek.value.byteLength > 0) {
    throwCsvPreviewSizeExceeded(onSizeExceeded);
  }
  const extra = decoder.decode(peek.value, { stream: true });
  if (extra.length > 0) {
    throwCsvPreviewSizeExceeded(onSizeExceeded);
  }
}

function finalizeCsvPreviewAtCap(
  result: string,
  peek: ReadableStreamReadResult<Uint8Array>,
  decoder: TextDecoder
): string {
  return peek.done ? result + decoder.decode() : result;
}

async function releaseCsvPreviewReader(
  reader: ReadableStreamDefaultReader<Uint8Array>
): Promise<void> {
  await reader.cancel().catch(() => undefined);
  try {
    reader.releaseLock();
  } catch {
    // Reader may already be released after cancellation or stream completion.
  }
}

async function readCsvPreviewFromStreamBody(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  maxChars: number,
  signal: AbortSignal,
  onSizeExceeded: () => void
): Promise<string> {
  const decoder = new TextDecoder();
  let result = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      return result + decoder.decode();
    }
    assertCsvPreviewSignalActive(signal);
    const decodedChunk = decoder.decode(value, { stream: true });
    const remaining = maxChars - result.length;
    if (remaining <= 0) {
      throwCsvPreviewSizeExceeded(onSizeExceeded);
    }
    if (decodedChunk.length > remaining) {
      throwCsvPreviewSizeExceeded(onSizeExceeded);
    }
    result += decodedChunk;
    if (result.length !== maxChars) {
      continue;
    }
    const peek = await reader.read();
    assertCsvPreviewSignalActive(signal);
    assertNoCsvDataBeyondCap(peek, signal, decoder, onSizeExceeded);
    return finalizeCsvPreviewAtCap(result, peek, decoder);
  }
}

async function readCsvPreviewText(
  response: Response,
  maxChars: number,
  signal: AbortSignal,
  onSizeExceeded: () => void
): Promise<string> {
  assertCsvContentLengthWithinLimit(response, maxChars, onSizeExceeded);
  if (!response.body) {
    return readCsvPreviewTextFromBodyLessResponse(
      response,
      maxChars,
      onSizeExceeded
    );
  }
  const reader = response.body.getReader();
  try {
    return await readCsvPreviewFromStreamBody(
      reader,
      maxChars,
      signal,
      onSizeExceeded
    );
  } finally {
    await releaseCsvPreviewReader(reader);
  }
}

async function fetchCsvPreviewText(
  url: string,
  signal: AbortSignal,
  markSizeExceeded: () => void
): Promise<string> {
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error("Unable to load CSV preview.");
  }
  return readCsvPreviewText(
    response,
    CSV_PREVIEW_MAX_CHARS,
    signal,
    markSizeExceeded
  );
}

function resolveCsvPreviewErrorMessage(
  err: unknown,
  aborted: boolean,
  didTimeout: boolean,
  didExceedSize: boolean
): string | undefined {
  if (aborted) {
    if (didTimeout) {
      return CSV_PREVIEW_TIMEOUT_MESSAGE;
    }
    if (didExceedSize) {
      return CSV_PREVIEW_SIZE_MESSAGE;
    }
    return undefined;
  }
  if (err instanceof Error && err.message === CSV_PREVIEW_SIZE_EXCEEDED) {
    return CSV_PREVIEW_SIZE_MESSAGE;
  }
  return err instanceof Error ? err.message : "Unable to load CSV.";
}

export const ATTACHMENT_DOWNLOAD_FETCH_TIMEOUT_MS = 120_000;

export type AttachmentSafety = ApiAttachment["safety"];

export function isScannedValidatedAttachment(
  safety: AttachmentSafety
): boolean {
  return safety?.status === ApiAttachmentSafetyStatus.ScannedValidated;
}

function getPathnameFileExtension(url: string): string | null {
  try {
    const base = globalThis.window?.location?.origin || "https://6529.io";
    const parsed = new URL(url, base);
    const basename = parsed.pathname.split("/").pop() ?? "";
    const lastDot = basename.lastIndexOf(".");
    if (lastDot <= 0 || lastDot === basename.length - 1) {
      return null;
    }
    return basename.slice(lastDot + 1).toLowerCase();
  } catch {
    return null;
  }
}

export function getAttachmentRenderType(
  mimeType: string,
  url: string
): AttachmentRenderType {
  const normalizedMimeType = mimeType.split(";")[0]?.trim().toLowerCase();
  const pathExtension = getPathnameFileExtension(url);

  if (normalizedMimeType === "application/pdf" || pathExtension === "pdf") {
    return "pdf";
  }

  if (
    normalizedMimeType === "text/csv" ||
    normalizedMimeType === "application/csv" ||
    normalizedMimeType === "application/vnd.ms-excel" ||
    pathExtension === "csv"
  ) {
    return "csv";
  }

  return "unknown";
}

export function getAttachmentLabel(renderType: AttachmentRenderType): string {
  if (renderType === "pdf") return "PDF";
  if (renderType === "csv") return "CSV";
  return "File";
}

export function getFallbackExtension(renderType: AttachmentRenderType): string {
  if (renderType === "pdf") return "pdf";
  if (renderType === "csv") return "csv";
  return "";
}

export function resolveAttachmentFileName(
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

export function CsvAttachmentPreview({ url }: { readonly url: string }) {
  const [rows, setRows] = useState<string[][] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRows(null);
    setError(null);
    const controller = new AbortController();
    let active = true;
    let didTimeout = false;
    let didExceedSize = false;
    const markSizeExceeded = () => {
      didExceedSize = true;
      controller.abort();
    };
    const timeoutId = globalThis.window.setTimeout(() => {
      didTimeout = true;
      controller.abort();
    }, ATTACHMENT_DOWNLOAD_FETCH_TIMEOUT_MS);

    void (async () => {
      try {
        const text = await fetchCsvPreviewText(
          url,
          controller.signal,
          markSizeExceeded
        );
        if (!active || controller.signal.aborted) {
          return;
        }
        setRows(parseCsvPreview(text));
      } catch (err: unknown) {
        if (!active) {
          return;
        }
        const message = resolveCsvPreviewErrorMessage(
          err,
          controller.signal.aborted,
          didTimeout,
          didExceedSize
        );
        if (message) {
          setError(message);
        }
      } finally {
        globalThis.window.clearTimeout(timeoutId);
      }
    })();

    return () => {
      active = false;
      globalThis.window.clearTimeout(timeoutId);
      controller.abort();
    };
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
    <div className="tw-overflow-x-auto tw-rounded-b-lg tw-border tw-border-t-0 tw-border-solid tw-border-iron-700 tw-bg-iron-950">
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

export function AnimatedAttachmentPanel({
  isOpen,
  children,
}: {
  readonly isOpen: boolean;
  readonly children: ReactNode;
}) {
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      return;
    }

    const timeoutId = globalThis.window.setTimeout(
      () => setShouldRender(false),
      220
    );
    return () => globalThis.window.clearTimeout(timeoutId);
  }, [isOpen]);

  if (!shouldRender && !isOpen) {
    return null;
  }

  return (
    <div
      className={clsx(
        "tw-grid tw-transition-all tw-duration-200 tw-ease-out",
        isOpen ? "tw-opacity-100" : "tw-opacity-0"
      )}
      style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
    >
      <div className="tw-min-h-0 tw-overflow-hidden">
        <div
          className={clsx(
            "tw-transform-gpu tw-transition-transform tw-duration-200 tw-ease-out",
            isOpen ? "tw-translate-y-0" : "-tw-translate-y-2"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export function AttachmentMoreMenu({
  isOpen,
  hasDetails,
  isDetailsOpen,
  viewDetailsLabel,
  hideDetailsLabel,
  copiedLink,
  isDownloading,
  buttonRef,
  onToggle,
  onToggleDetails,
  onCopyLink,
  onDownload,
}: {
  readonly isOpen: boolean;
  readonly hasDetails: boolean;
  readonly isDetailsOpen: boolean;
  readonly viewDetailsLabel: string;
  readonly hideDetailsLabel: string;
  readonly copiedLink: boolean;
  readonly isDownloading: boolean;
  readonly buttonRef: RefObject<HTMLButtonElement | null>;
  readonly onToggle: () => void;
  readonly onToggleDetails: () => void;
  readonly onCopyLink: () => void;
  readonly onDownload: () => void;
}) {
  const getMenuItemClassName = (active = false) =>
    clsx(
      "tw-flex tw-w-full tw-cursor-pointer tw-items-center tw-gap-x-3 tw-rounded-lg tw-border-0 tw-bg-transparent tw-px-3 tw-py-2 tw-text-left tw-transition-colors tw-duration-200 desktop-hover:hover:tw-bg-iron-800",
      active
        ? "tw-text-primary-300 desktop-hover:hover:tw-text-primary-300"
        : "tw-text-iron-300 desktop-hover:hover:tw-text-iron-300"
    );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={onToggle}
        aria-label="Attachment options"
        title="More"
        className="tw-inline-flex tw-size-8 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-text-iron-100 tw-transition desktop-hover:hover:tw-bg-iron-700"
      >
        <EllipsisHorizontalIcon className="tw-size-4" aria-hidden="true" />
      </button>
      <CommonDropdownItemsDefaultWrapper
        isOpen={isOpen}
        setOpen={(open) => {
          if (!open && isOpen) {
            onToggle();
          }
        }}
        buttonRef={buttonRef}
      >
        <li className="tw-list-none">
          <div className="tw-flex tw-flex-col tw-gap-y-1 tw-py-1">
            {hasDetails && (
              <button
                type="button"
                onClick={onToggleDetails}
                className={getMenuItemClassName()}
              >
                <ShieldCheckIcon
                  className="tw-size-4 tw-flex-shrink-0"
                  aria-hidden="true"
                />
                <span className="tw-text-sm tw-font-medium">
                  {isDetailsOpen ? hideDetailsLabel : viewDetailsLabel}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={onCopyLink}
              className={getMenuItemClassName(copiedLink)}
            >
              <LinkIcon
                className="tw-size-4 tw-flex-shrink-0"
                aria-hidden="true"
              />
              <span className="tw-text-sm tw-font-medium">
                {copiedLink ? "Copied" : "Copy link"}
              </span>
            </button>
            <button
              type="button"
              onClick={onDownload}
              disabled={isDownloading}
              className={getMenuItemClassName()}
            >
              <ArrowDownTrayIcon
                className="tw-size-4 tw-flex-shrink-0"
                aria-hidden="true"
              />
              <span className="tw-text-sm tw-font-medium">
                {isDownloading ? "Downloading" : "Download"}
              </span>
            </button>
          </div>
        </li>
      </CommonDropdownItemsDefaultWrapper>
    </>
  );
}
