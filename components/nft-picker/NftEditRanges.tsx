"use client";

import type { ParseError, TokenRange } from "./NftPicker.types";
import { formatCanonical, formatBigIntWithSeparators } from "./NftPicker.utils";

const BIGINT_ZERO = BigInt(0);
const BIGINT_ONE = BigInt(1);

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
  const canonical = formatCanonical(ranges);
  const total = ranges.reduce(
    (acc, range) => acc + (range.end - range.start + BIGINT_ONE),
    BIGINT_ZERO
  );
  const hasTokens = total > BIGINT_ZERO;
  const countLabel = formatBigIntWithSeparators(total);
  const selectionLabel = hasTokens
    ? `${countLabel} ${total === BIGINT_ONE ? "token" : "tokens"} selected`
    : "No tokens selected";
  const summaryText = canonical || "Add tokens to see them listed here.";
  return (
    <div className="tw-flex tw-flex-col tw-gap-3 tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-900 tw-p-3">
      <div className="tw-flex tw-flex-wrap tw-items-start tw-justify-between tw-gap-2">
        <div className="tw-flex tw-flex-col tw-gap-1">
          <span className="tw-text-sm tw-font-semibold tw-text-white">{selectionLabel}</span>
          <span className="tw-text-xs tw-text-iron-300 tw-break-words">{summaryText}</span>
        </div>
        <div className="tw-flex tw-gap-2">
          <button
            type="button"
            className="tw-rounded tw-border tw-border-iron-700 tw-bg-transparent tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-text-iron-200 hover:tw-border-primary-500 hover:tw-text-white"
            onClick={onToggle}
          >
            {isEditing ? "Hide text editor" : "Edit as text"}
          </button>
          <button
            type="button"
            className="tw-rounded tw-border tw-border-iron-700 tw-bg-transparent tw-px-3 tw-py-1 tw-text-xs tw-font-semibold tw-text-iron-200 hover:tw-border-primary-500 hover:tw-text-white disabled:tw-opacity-40"
            onClick={onClear}
            disabled={!hasTokens}
          >
            Clear All
          </button>
        </div>
      </div>
      {isEditing && (
        <div className="tw-flex tw-flex-col tw-gap-2">
          <textarea
            value={textValue}
            onChange={(event) => onTextChange(event.target.value)}
            className="tw-h-32 tw-w-full tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-950 tw-p-2 tw-text-sm tw-text-iron-100 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-500"
            aria-label="Edit token ranges"
          />
          {parseErrors.length > 0 && (
            <ul className="tw-list-disc tw-pl-5 tw-text-xs tw-text-red-300">
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
