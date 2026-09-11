"use client";

import type { KeyboardEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { faCheck, faCopy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { ParseError, TokenRange } from "../types";
import { formatBigIntWithSeparators, formatCanonical } from "../utils";
import Button from "@/components/utils/button/Button";

const BIGINT_ZERO = BigInt(0);
const BIGINT_ONE = BigInt(1);

type CopyStatus = "idle" | "copied" | "error";

interface CopyFeedbackState {
  readonly canonical: string;
  readonly status: CopyStatus;
}

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
  readonly allowAll?: boolean | undefined;
  readonly variant: "card" | "flat";
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
  allowAll = true,
  variant,
  onToggle,
  onTextChange,
  onApply,
  onCancel,
  onClear,
}: NftEditRangesProps) {
  const isFlat = variant === "flat";
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
  const emptySummaryText = allowAll
    ? "Add tokens using the input above or choose Select All to include every token."
    : "Add tokens using the input above.";
  const summaryText = hasTokens ? canonical : emptySummaryText;
  const [copyFeedback, setCopyFeedback] = useState<CopyFeedbackState>({
    canonical: "",
    status: "idle",
  });
  const copyStatus =
    copyFeedback.canonical === canonical ? copyFeedback.status : "idle";

  useEffect(() => {
    if (copyStatus === "idle") {
      return undefined;
    }
    const timeout = globalThis.setTimeout(() => {
      setCopyFeedback({ canonical, status: "idle" });
    }, 2000);
    return () => globalThis.clearTimeout(timeout);
  }, [canonical, copyStatus]);

  const handleCopy = async () => {
    if (!canonical) {
      return;
    }

    try {
      if (!navigator?.clipboard?.writeText) {
        throw new Error("Clipboard API unavailable");
      }

      await navigator.clipboard.writeText(canonical);
      setCopyFeedback({ canonical, status: "copied" });
    } catch (error) {
      console.warn("NftEditRanges: clipboard copy failed", error);
      setCopyFeedback({ canonical, status: "error" });
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
    <div className="tw-flex tw-flex-col tw-gap-4 tw-rounded-xl tw-border tw-border-solid tw-border-primary-500/30 tw-bg-primary-500/5 tw-p-4">
      <div className="tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-flex-wrap sm:tw-items-start sm:tw-justify-between">
        <div className="tw-flex tw-w-full tw-flex-col tw-gap-2">
          <span className="tw-text-base tw-font-semibold tw-text-white">
            {selectionLabel}
          </span>
          <div className="tw-flex tw-flex-col tw-gap-2 lg:tw-flex-row lg:tw-items-center">
            <span
              className={`tw-flex-1 tw-break-words ${
                isFlat
                  ? "tw-text-sm tw-font-medium tw-text-iron-100"
                  : "tw-font-mono tw-text-xs tw-text-iron-200"
              }`}
            >
              {summaryText}
            </span>
            {showCopyButton && (
              <div className="tw-flex tw-flex-shrink-0 tw-items-center tw-gap-2">
                <Button
                  variant="tertiary"
                  size="sm"
                  className="tw-border-primary-500/50 tw-bg-transparent tw-text-primary-300 desktop-hover:hover:tw-border-primary-500 desktop-hover:hover:tw-bg-transparent desktop-hover:hover:tw-text-white"
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
                </Button>
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
              <Button
                variant="secondary"
                size="sm"
                className="tw-bg-transparent desktop-hover:hover:tw-border-primary-500 desktop-hover:hover:tw-bg-transparent"
                onClick={onToggle}
              >
                {isEditing ? "Hide text editor" : "Edit as text"}
              </Button>
            )}
            {showClearButton && (
              <Button
                variant="secondary"
                size="sm"
                className="tw-bg-transparent desktop-hover:hover:tw-border-primary-500 desktop-hover:hover:tw-bg-transparent"
                onClick={onClear}
              >
                Clear All
              </Button>
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
              {parseErrors.map((error) => (
                <li key={`${error.input}-${error.index}`}>
                  {error.message} ({error.input})
                </li>
              ))}
            </ul>
          )}
          <div className="tw-flex tw-justify-end tw-gap-2">
            <Button variant="secondary" size="sm" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="action" size="sm" onClick={onApply}>
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
