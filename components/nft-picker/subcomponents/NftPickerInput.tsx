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
      : "tw-h-11 tw-w-full tw-flex-none tw-rounded-lg tw-border-0 tw-bg-iron-950 tw-px-3 tw-py-2.5 tw-text-base tw-font-medium tw-text-iron-100 tw-shadow-inner tw-ring-1 tw-ring-inset tw-ring-white/10 tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-ring-white/15 desktop-hover:hover:focus:tw-ring-primary-400 focus:tw-border-primary-400 focus:tw-bg-iron-950 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-inset focus:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-bg-iron-900 disabled:tw-text-iron-600 sm:tw-flex-1 sm:tw-text-sm";

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
