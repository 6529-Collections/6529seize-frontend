"use client";

import type { ChangeEvent, KeyboardEvent } from "react";

interface NftPickerInputProps {
  tokenInput: string;
  tokenInputPlaceholder: string;
  tokenInputDisabled: boolean;
  helperMessageId: string;
  variant: "card" | "flat";
  onTokenInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onTokenInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
}

export function NftPickerInput({
  tokenInput,
  tokenInputPlaceholder,
  tokenInputDisabled,
  helperMessageId,
  variant,
  onTokenInputChange,
  onTokenInputKeyDown,
}: NftPickerInputProps) {
  const tokenInputClassName =
    variant === "card"
      ? "tw-flex-1 tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-2.5 tw-text-sm tw-text-iron-100 tw-transition disabled:tw-cursor-not-allowed disabled:tw-bg-iron-900 disabled:tw-text-iron-600 focus:tw-border-primary-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-primary-500"
      : "tw-flex-1 tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-2.5 tw-text-sm tw-text-iron-100 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-bg-iron-900 disabled:tw-text-iron-600";

  return (
    <input
      value={tokenInput}
      onChange={onTokenInputChange}
      onKeyDown={onTokenInputKeyDown}
      placeholder={tokenInputPlaceholder}
      disabled={tokenInputDisabled}
      className={tokenInputClassName}
      aria-label="Add token IDs or ranges"
      aria-describedby={helperMessageId}
    />
  );
}
