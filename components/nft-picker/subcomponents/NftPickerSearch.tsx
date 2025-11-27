"use client";

import { type RefObject, type ChangeEvent, type KeyboardEvent } from "react";
import { NftSuggestList } from "./NftSuggestList";
import type { Suggestion } from "../types";

interface NftPickerSearchProps {
  query: string;
  isOpen: boolean;
  activeIndex: number;
  suggestionList: Suggestion[];
  hiddenCount: number;
  hideSpam: boolean;
  placeholder: string;
  variant: "card" | "flat";
  inputRef: RefObject<HTMLInputElement | null>;
  collectionInputId: string;
  activeSuggestionId?: string;
  onInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onInputKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
  onInputFocus: () => void;
  onToggleSpam: () => void;
  onHoverSuggestion: (index: number) => void;
  onSelectSuggestion: (suggestion: Suggestion) => void;
}

export function NftPickerSearch({
  query,
  isOpen,
  activeIndex,
  suggestionList,
  hiddenCount,
  hideSpam,
  placeholder,
  variant,
  inputRef,
  collectionInputId,
  activeSuggestionId,
  onInputChange,
  onInputKeyDown,
  onInputFocus,
  onToggleSpam,
  onHoverSuggestion,
  onSelectSuggestion,
}: NftPickerSearchProps) {
  const collectionInputClassName =
    variant === "card"
      ? "tw-w-full tw-rounded-md tw-border tw-border-iron-700 tw-bg-iron-950 tw-px-3 tw-py-[0.625rem] tw-text-sm tw-text-white focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-500"
      : "tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-2.5 tw-text-sm tw-font-medium tw-text-iron-100 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400";

  return (
    <div className="tw-flex tw-flex-col tw-gap-2">
      <label htmlFor={collectionInputId} className="tw-text-sm tw-font-semibold tw-text-iron-200">
        Select collection
      </label>
      <div className="tw-relative">
        <input
          id={collectionInputId}
          ref={inputRef}
          value={query}
          onChange={onInputChange}
          onKeyDown={onInputKeyDown}
          onFocus={onInputFocus}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="nft-picker-suggest-list"
          aria-activedescendant={activeSuggestionId}
          className={collectionInputClassName}
        />
        {suggestionList.length > 0 && (
          <NftSuggestList
            items={suggestionList}
            activeIndex={activeIndex}
            isOpen={isOpen}
            hiddenCount={hiddenCount}
            hideSpam={hideSpam}
            onToggleSpam={onToggleSpam}
            onHover={onHoverSuggestion}
            onSelect={onSelectSuggestion}
          />
        )}
      </div>
    </div>
  );
}
