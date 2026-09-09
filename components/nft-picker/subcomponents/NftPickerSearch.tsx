"use client";

import { type RefObject, type ChangeEvent, type KeyboardEvent } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { NftSuggestList } from "./NftSuggestList";
import type { Suggestion } from "../types";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

interface NftPickerSearchProps {
  query: string;
  isOpen: boolean;
  activeIndex: number;
  suggestionList: Suggestion[];
  placeholder?: string | undefined;
  variant: "card" | "flat";
  inputRef: RefObject<HTMLInputElement | null>;
  collectionInputId: string;
  activeSuggestionId?: string | undefined;
  onInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onInputFocus: () => void;
  onHoverSuggestion: (index: number) => void;
  onSelectSuggestion: (suggestion: Suggestion) => void;
  loading?: boolean | undefined;
  isError: boolean;
  isNotFound: boolean;
  isInvalidAddress: boolean;
  onRetry: () => void;
}

export function NftPickerSearch({
  query,
  isOpen,
  activeIndex,
  suggestionList,
  placeholder,
  variant,
  inputRef,
  collectionInputId,
  activeSuggestionId,
  onInputChange,
  onInputKeyDown,
  onInputFocus,
  onHoverSuggestion,
  onSelectSuggestion,
  loading,
  isError,
  isNotFound,
  isInvalidAddress,
  onRetry,
}: NftPickerSearchProps) {
  const locale = useBrowserLocale();
  const statusId = `${collectionInputId}-status`;
  let statusKey: Parameters<typeof t>[1] = "nftPicker.address.help";
  if (isInvalidAddress) {
    statusKey = "nftPicker.address.invalid";
  } else if (loading) {
    statusKey = "nftPicker.address.loading";
  } else if (isError) {
    statusKey = "nftPicker.address.error";
  } else if (isNotFound) {
    statusKey = "nftPicker.address.notFound";
  } else if (suggestionList.some((item) => item.tokenType !== "ERC721")) {
    statusKey = "nftPicker.address.unsupported";
  } else if (suggestionList.length > 0) {
    statusKey = "nftPicker.address.found";
  }
  const collectionInputClassName =
    variant === "card"
      ? "tw-w-full tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-950 tw-pl-10 tw-pr-10 tw-py-[0.625rem] tw-text-sm tw-text-white focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-500"
      : "tw-w-full tw-bg-black tw-border tw-border-solid tw-border-white/10 tw-text-iron-300 tw-text-sm tw-rounded-lg focus:tw-ring-primary-400 focus:tw-border-primary-400 tw-pl-10 tw-pr-14 tw-py-3 placeholder:tw-text-iron-600 tw-transition-all focus:tw-outline-none";

  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <label htmlFor={collectionInputId} className="tw-sr-only">
        {t(locale, "nftPicker.address.label")}
      </label>
      <div className="tw-relative">
        <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-0 tw-flex tw-items-center tw-pl-3">
          <MagnifyingGlassIcon className="tw-h-4 tw-w-4 tw-text-iron-600" />
        </div>
        <input
          id={collectionInputId}
          ref={inputRef}
          value={query}
          onChange={onInputChange}
          onKeyDown={onInputKeyDown}
          onFocus={onInputFocus}
          placeholder={
            placeholder ?? t(locale, "nftPicker.address.placeholder")
          }
          autoComplete="off"
          spellCheck={false}
          aria-describedby={statusId}
          aria-invalid={isInvalidAddress}
          aria-busy={Boolean(loading)}
          role="combobox"
          aria-expanded={isOpen && suggestionList.length > 0}
          aria-controls={
            isOpen && suggestionList.length > 0
              ? "nft-picker-suggest-list"
              : undefined
          }
          aria-activedescendant={activeSuggestionId}
          className={collectionInputClassName}
        />
        {loading && (
          <div className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-z-20 tw-flex tw-items-center tw-pr-3">
            <svg
              className="tw-h-4 tw-w-4 tw-animate-spin tw-text-primary-400 motion-reduce:tw-animate-none"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="tw-opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="tw-opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
        {suggestionList.length > 0 && (
          <NftSuggestList
            items={suggestionList}
            activeIndex={activeIndex}
            isOpen={isOpen}
            onHover={onHoverSuggestion}
            onSelect={onSelectSuggestion}
          />
        )}
      </div>
      <output
        id={statusId}
        htmlFor={collectionInputId}
        aria-live="polite"
        className="tw-m-0 tw-text-xs tw-text-iron-300"
      >
        {t(locale, statusKey)}
      </output>
      {isError && !loading && (
        <button
          type="button"
          onClick={() => {
            // Retry disappears while fetching; keep keyboard focus in the lookup.
            inputRef.current?.focus();
            onRetry();
          }}
          className="tw-self-start tw-rounded-md tw-px-2 tw-py-2 tw-text-sm tw-text-primary-400 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400"
        >
          {t(locale, "nftPicker.address.retry")}
        </button>
      )}
    </div>
  );
}
