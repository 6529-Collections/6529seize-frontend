"use client";

import type { ParseError, TokenRange } from "./NftPicker.types";
import { formatCanonical } from "./NftPicker.utils";

interface NftEditRangesProps {
  readonly ranges: TokenRange[];
  readonly isEditing: boolean;
  readonly textValue: string;
  readonly parseErrors: ParseError[];
  readonly onToggle: () => void;
  readonly onTextChange: (value: string) => void;
  readonly onApply: () => void;
  readonly onCancel: () => void;
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
}: NftEditRangesProps) {
  const canonical = formatCanonical(ranges);
  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <div className="tw-flex tw-items-center tw-justify-between">
        <span className="tw-text-xs tw-text-iron-300">Tokens</span>
        <button
          type="button"
          className="tw-text-xs tw-font-semibold tw-text-primary-400 hover:tw-underline"
          onClick={onToggle}
        >
          {isEditing ? "Hide text editor" : "Edit as text"}
        </button>
      </div>
      <div className="tw-max-h-24 tw-overflow-x-auto tw-rounded tw-border tw-border-iron-700 tw-bg-iron-900 tw-p-2 tw-text-xs tw-text-iron-100">
        {canonical || "No tokens selected"}
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
