"use client";

import { getFileInfoFromUrl } from "@/helpers/file.helpers";
import { shareFetchedBlobInNativeApp } from "@/helpers/capacitorBlobDownload.helpers";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import { resolveIpfsUrlSync } from "@/components/ipfs/IPFSContext";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { formatFileSizeLabel } from "@/lib/link-preview/filePreviewI18n";
import CommonDropdownItemsDefaultWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsDefaultWrapper";
import type { ApiAttachment } from "@/generated/models/ApiAttachment";
import { ApiAttachmentSafetyStatus } from "@/generated/models/ApiAttachmentSafetyStatus";
import { faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  ArrowDownTrayIcon,
  DocumentIcon,
  EllipsisHorizontalIcon,
  EyeIcon,
  EyeSlashIcon,
  LinkIcon,
  ShieldCheckIcon,
  TableCellsIcon,
} from "@heroicons/react/24/outline";
import useCapacitor from "@/hooks/useCapacitor";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import useIsMobileDevice from "@/hooks/isMobileDevice";
import clsx from "clsx";
import { Tooltip } from "react-tooltip";
import type { ReactNode, RefObject } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

const SAFE_URL_PROTOCOLS = new Set(["https:", "http:", "blob:"]);

function getSafeAttachmentUrl(rawUrl: string): string | null {
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
const ATTACHMENT_LOCALE = DEFAULT_LOCALE;

function TrustedAttachmentBadge({
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

const ATTACHMENT_DOWNLOAD_FETCH_TIMEOUT_MS = 120_000;

type AttachmentSafety = ApiAttachment["safety"];

function isScannedValidatedAttachment(
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

function getAttachmentRenderType(
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

function AnimatedAttachmentPanel({
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

function AttachmentMoreMenu({
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
  const safetySize = formatFileSizeLabel(
    safety?.size_bytes,
    ATTACHMENT_LOCALE
  );
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
