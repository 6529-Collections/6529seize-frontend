"use client";

import { useRef } from "react";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import CreateWaveGroupSearchInput from "./CreateWaveGroupSearchInput";
import CreateWaveGroupSearchResults, {
  type CreateWaveGroupSearchResultsLayout,
} from "./CreateWaveGroupSearchResults";
import { useCreateWaveGroupSearch } from "./useCreateWaveGroupSearch";

export default function CreateWaveGroupSearchField({
  label,
  defaultLabel,
  disabled,
  selectedGroup,
  allowClear = true,
  resultsLayout = "popover",
  onSelect,
}: {
  readonly label: string;
  readonly defaultLabel: string;
  readonly disabled: boolean;
  readonly selectedGroup: ApiGroupFull | null;
  readonly allowClear?: boolean;
  readonly resultsLayout?: CreateWaveGroupSearchResultsLayout;
  readonly onSelect: (group: ApiGroupFull | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const search = useCreateWaveGroupSearch({
    defaultLabel,
    disabled,
    inputRef,
    selectedGroup,
    allowClear,
    onSelect,
    wrapperRef,
  });

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-2" ref={wrapperRef}>
      <div className="tw-group tw-relative tw-w-full">
        <CreateWaveGroupSearchInput
          inputRef={inputRef}
          inputId={search.inputId}
          listboxId={search.listboxId}
          activeOptionId={search.activeOptionId}
          label={label}
          value={search.inputValue}
          isOpen={search.isOpen}
          disabled={disabled}
          hasValue={search.hasValue}
          hasSelectedGroup={!!selectedGroup}
          showClearButton={search.showClearButton}
          onInputFocus={search.onInputFocus}
          onInputChange={search.handleInputChange}
          onInputKeyDown={search.handleKeyDown}
          onClearSelection={search.clearSelection}
        />
        <CreateWaveGroupSearchResults
          isOpen={search.isOpen}
          disabled={disabled}
          layout={resultsLayout}
          listboxId={search.listboxId}
          isFetching={search.isFetching}
          suggestions={search.suggestions}
          selectedGroup={selectedGroup}
          activeIndex={search.activeIndex}
          searchCriteria={search.searchCriteria}
          showNoResults={search.showNoResults}
          helperText={search.helperText}
          onActiveIndexChange={search.setActiveIndex}
          onOptionSelect={search.onOptionSelect}
        />
      </div>

      <p className="tw-mb-0 tw-text-xs tw-font-medium tw-text-iron-400">
        {search.helperText}
      </p>
    </div>
  );
}
