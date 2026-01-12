"use client";

import type { KeyboardEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { faCheck, faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { ParseError, TokenRange } from "../types";
import { formatBigIntWithSeparators, formatCanonical } from "../utils";

const BIGINT_ZERO = BigInt(0);
const BIGINT_ONE = BigInt(1);

type CopyStatus = "idle" | "copied" | "error";

const COPY_FEEDBACK: Record<
  CopyStatus,
  { message: string; className: string }
> = {
  idle: {
    message: "Copy feedback",
    className: "tw-text-transparent",
  },
  copied: {
    message: "Copied selection to clipboard.",
    className: "tw-text-emerald-300",
  },
  error: {
    message: "Unable to copy selection.",
    className: "tw-text-red-300",
  },
};

interface NftEditRangesProps {
  readonly ranges: TokenRange[];
  readonly isEditing: boolean;
  readonly textValue: string;
  readonly parseErrors: ParseError[];
  readonly onToggle: () => void;
  readonly onTextChange: (value: string) => void;
  readonly onApply: () => void;
  readonly onCancel: () => void;
  readonly onClear: () => void;
}

export function NftEditRanges({
  ranges,
  isEditing,
  textValue,
  parseErrors,
  onToggle,
  onTextChange,
  onApply,
  onCancel,
  onClear,
}: NftEditRangesProps) {
  const canonical = useMemo(() => formatCanonical(ranges), [ranges]);
  const total = useMemo(
    () =>
      ranges.reduce(
        (acc, range) => acc + (range.end - range.start + BIGINT_ONE),
        BIGINT_ZERO
      ),
    [ranges]
  );
  const hasTokens = total > BIGINT_ZERO;
  const countLabel = formatBigIntWithSeparators(total);
  const tokenLabel = total === BIGINT_ONE ? "token" : "tokens";
  const selectionLabel = hasTokens
    ? `${countLabel} ${tokenLabel} selected`
    : "No tokens selected";
  const summaryText = hasTokens
    ? canonical
    : "Add tokens using the input above or choose Select All to include every token.";
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  useEffect(() => {
    if (copyStatus === "idle") {
      return undefined;
    }
    const timeout = globalThis.setTimeout(() => {
      setCopyStatus("idle");
    }, 2000);
    return () => globalThis.clearTimeout(timeout);
  }, [copyStatus]);

  useEffect(() => {
    setCopyStatus("idle");
  }, [canonical]);

  const handleCopy = async () => {
    if (!canonical) {
      return;
    }

    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }

      await navigator.clipboard.writeText(canonical);
      setCopyStatus("copied");
    } catch (error) {
      console.warn("NftEditRanges: clipboard copy failed", error);
      setCopyStatus("error");
    }
  };

  const handleTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      onApply();
    }
  };

  const { message: copyMessage, className: copyClassName } =
    COPY_FEEDBACK[copyStatus];

  const showCopyButton = hasTokens && Boolean(canonical);
  const showToggleButton = hasTokens || isEditing;
  const showClearButton = hasTokens;
  const showActionButtons = showToggleButton || showClearButton;

  return (
    <div className="tw-flex tw-flex-col tw-gap-4 tw-rounded-lg tw-border tw-border-primary-500/30 tw-bg-primary-500/5 tw-p-4">
      <div className="tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-flex-wrap sm:tw-items-start sm:tw-justify-between">
        <div className="tw-flex tw-w-full tw-flex-col tw-gap-2">
          <span className="tw-text-base tw-font-semibold tw-text-white">
            {selectionLabel}
          </span>
          <div className="tw-flex tw-flex-col tw-gap-2 lg:tw-flex-row lg:tw-items-center">
            <span className="tw-flex-1 tw-break-words tw-font-mono tw-text-xs tw-text-iron-200">
              {summaryText}
            </span>
            {showCopyButton && (
              <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-2">
                <button
                  type="button"
                  className="tw-inline-flex tw-items-center tw-justify-center tw-gap-2 tw-rounded tw-border tw-border-primary-500/50 tw-bg-transparent tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-primary-300 hover:tw-border-primary-500 hover:tw-text-white focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-500"
                  onClick={handleCopy}
                  aria-label="Copy token selection"
                >
                  {copyStatus === "copied" ? (
                    <span className="tw-inline-flex tw-items-center tw-gap-2 tw-font-semibold tw-text-emerald-300">
                      <FontAwesomeIcon icon={faCheck} />
                      <span>Copied!</span>
                    </span>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCopy} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          {copyStatus !== "idle" && (
            <output
              aria-live="polite"
              className={`tw-min-h-[1.25rem] tw-text-xs tw-font-medium ${copyClassName}`}
            >
              {copyMessage}
            </output>
          )}
        </div>
        {showActionButtons && (
          <div className="tw-flex tw-flex-col tw-gap-2 sm:tw-flex-row">
            {showToggleButton && (
              <button
                type="button"
                className="tw-inline-flex tw-items-center tw-justify-center tw-gap-2 tw-rounded tw-border tw-border-iron-700 tw-bg-transparent tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-200 hover:tw-border-primary-500 hover:tw-text-white focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-500"
                onClick={onToggle}
              >
                {isEditing ? "Hide text editor" : "Edit as text"}
              </button>
            )}
            {showClearButton && (
              <button
                type="button"
                className="tw-inline-flex tw-items-center tw-justify-center tw-gap-2 tw-rounded tw-border tw-border-iron-700 tw-bg-transparent tw-px-3 tw-py-2 tw-text-xs tw-font-semibold tw-text-iron-200 hover:tw-border-primary-500 hover:tw-text-white focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-500"
                onClick={onClear}
              >
                Clear All
              </button>
            )}
          </div>
        )}
      </div>
      {isEditing && (
        <div className="tw-flex tw-flex-col tw-gap-2">
          <textarea
            value={textValue}
            onChange={(event) => onTextChange(event.target.value)}
            onKeyDown={handleTextareaKeyDown}
            className="tw-h-32 tw-w-full tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-950 tw-p-2 tw-text-sm tw-text-iron-100 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-500"
            aria-label="Edit token ranges"
          />
          {parseErrors.length > 0 && (
            <ul className="tw-text-red-300 tw-list-disc tw-pl-5 tw-text-xs">
              {parseErrors.map((error, index) => (
                <li key={`${error.input}-${error.index}-${index}`}>
                  {error.message} ({error.input})
                </li>
              ))}
            </ul>
          )}
          <div className="tw-flex tw-justify-end tw-gap-2">
            <button
              type="button"
              className="tw-rounded tw-border tw-border-iron-700 tw-bg-transparent tw-px-3 tw-py-1 tw-text-xs tw-text-iron-200 hover:tw-border-primary-500 hover:tw-text-white"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="tw-rounded tw-bg-primary-500 tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-text-black hover:tw-bg-primary-400"
              onClick={onApply}
            >
              Apply
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
