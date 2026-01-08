"use client";

import { useState } from "react";
import { SortDirection } from "@/entities/ISort";
import { ApiCommunityMembersSortOption } from "@/generated/models/ApiCommunityMembersSortOption";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp, faArrowDown, faCheck, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import {
  DROPDOWN_SORT_OPTIONS,
  SIMPLE_SORT_OPTIONS,
  DropdownSortOption,
  getDropdownDisplayLabel,
  getDropdownActiveState,
} from "./communityMembersSortConfig";

function MobileDropdownSort({
  option,
  activeSort,
  onSortChange,
  expandedDropdown,
  setExpandedDropdown,
}: {
  readonly option: DropdownSortOption;
  readonly activeSort: ApiCommunityMembersSortOption;
  readonly onSortChange: (sort: ApiCommunityMembersSortOption) => void;
  readonly expandedDropdown: string | null;
  readonly setExpandedDropdown: (label: string | null) => void;
}) {
  const { isPrimaryActive, isSecondaryActive, isActive } = getDropdownActiveState(option, activeSort);
  const isExpanded = expandedDropdown === option.label;

  const handleToggle = () => {
    setExpandedDropdown(isExpanded ? null : option.label);
  };

  const handleSelect = (sort: ApiCommunityMembersSortOption) => {
    onSortChange(sort);
    setExpandedDropdown(null);
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleToggle}
        className={`tw-w-full tw-text-left tw-rounded-lg tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-transition tw-duration-200 tw-border-0 tw-flex tw-items-center tw-justify-between ${
          isActive
            ? "tw-bg-primary-500/20 tw-text-primary-300"
            : "tw-bg-iron-800 tw-text-iron-300"
        }`}
      >
        <div className="tw-flex tw-items-center tw-gap-2">
          <span>{getDropdownDisplayLabel(option, activeSort)}</span>
          <FontAwesomeIcon
            icon={faChevronDown}
            className={`tw-h-2.5 tw-w-2.5 tw-transition-transform ${isExpanded ? "tw-rotate-180" : ""}`}
          />
        </div>
        {isActive && (
          <FontAwesomeIcon icon={faCheck} className="tw-h-4 tw-w-4 tw-text-primary-400" />
        )}
      </button>
      {isExpanded && (
        <div className="tw-ml-4 tw-mt-1 tw-flex tw-flex-col tw-gap-1">
          <button
            type="button"
            onClick={() => handleSelect(option.primarySort)}
            className={`tw-w-full tw-text-left tw-rounded-lg tw-px-4 tw-py-2.5 tw-text-sm tw-font-medium tw-transition tw-duration-200 tw-border-0 tw-flex tw-items-center tw-justify-between ${
              isPrimaryActive
                ? "tw-bg-primary-500/20 tw-text-primary-300"
                : "tw-bg-iron-900 tw-text-iron-400"
            }`}
          >
            <span>{option.primaryLabel}</span>
            {isPrimaryActive && (
              <FontAwesomeIcon icon={faCheck} className="tw-h-3.5 tw-w-3.5 tw-text-primary-400" />
            )}
          </button>
          <button
            type="button"
            onClick={() => handleSelect(option.secondarySort)}
            className={`tw-w-full tw-text-left tw-rounded-lg tw-px-4 tw-py-2.5 tw-text-sm tw-font-medium tw-transition tw-duration-200 tw-border-0 tw-flex tw-items-center tw-justify-between ${
              isSecondaryActive
                ? "tw-bg-primary-500/20 tw-text-primary-300"
                : "tw-bg-iron-900 tw-text-iron-400"
            }`}
          >
            <span>{option.secondaryLabel}</span>
            {isSecondaryActive && (
              <FontAwesomeIcon icon={faCheck} className="tw-h-3.5 tw-w-3.5 tw-text-primary-400" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default function CommunityMembersMobileSortContent({
  activeSort,
  sortDirection,
  onSortChange,
  onDirectionChange,
}: {
  readonly activeSort: ApiCommunityMembersSortOption;
  readonly sortDirection: SortDirection;
  readonly onSortChange: (sort: ApiCommunityMembersSortOption) => void;
  readonly onDirectionChange: (direction: SortDirection) => void;
}) {
  const [expandedDropdown, setExpandedDropdown] = useState<string | null>(null);

  return (
    <div className="tw-px-4 tw-pb-4">
      <div className="tw-flex tw-items-center tw-gap-3 tw-mb-4">
        <span className="tw-text-sm tw-font-medium tw-text-iron-400">Direction</span>
        <div className="tw-flex tw-items-center tw-gap-2">
          <button
            type="button"
            onClick={() => onDirectionChange(SortDirection.DESC)}
            className={`tw-rounded-lg tw-border tw-border-solid tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-transition tw-duration-200 tw-flex tw-items-center tw-gap-2 ${
              sortDirection === SortDirection.DESC
                ? "tw-border-primary-500 tw-bg-primary-500/20 tw-text-primary-300"
                : "tw-border-iron-700 tw-bg-iron-800 tw-text-iron-400"
            }`}
          >
            <FontAwesomeIcon icon={faArrowDown} className="tw-h-3.5 tw-w-3.5" />
            <span>Desc</span>
          </button>
          <button
            type="button"
            onClick={() => onDirectionChange(SortDirection.ASC)}
            className={`tw-rounded-lg tw-border tw-border-solid tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-transition tw-duration-200 tw-flex tw-items-center tw-gap-2 ${
              sortDirection === SortDirection.ASC
                ? "tw-border-primary-500 tw-bg-primary-500/20 tw-text-primary-300"
                : "tw-border-iron-700 tw-bg-iron-800 tw-text-iron-400"
            }`}
          >
            <FontAwesomeIcon icon={faArrowUp} className="tw-h-3.5 tw-w-3.5" />
            <span>Asc</span>
          </button>
        </div>
      </div>

      <div className="tw-border-t tw-border-iron-700 tw-pt-4">
        <span className="tw-text-sm tw-font-medium tw-text-iron-400 tw-mb-3 tw-block">Sort by</span>
        <div className="tw-flex tw-flex-col tw-gap-1">
          <button
            type="button"
            onClick={() => onSortChange(ApiCommunityMembersSortOption.Level)}
            className={`tw-w-full tw-text-left tw-rounded-lg tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-transition tw-duration-200 tw-border-0 tw-flex tw-items-center tw-justify-between ${
              activeSort === ApiCommunityMembersSortOption.Level
                ? "tw-bg-primary-500/20 tw-text-primary-300"
                : "tw-bg-iron-800 tw-text-iron-300"
            }`}
          >
            <span>Level</span>
            {activeSort === ApiCommunityMembersSortOption.Level && (
              <FontAwesomeIcon icon={faCheck} className="tw-h-4 tw-w-4 tw-text-primary-400" />
            )}
          </button>
          {DROPDOWN_SORT_OPTIONS.map((option) => (
            <MobileDropdownSort
              key={option.label}
              option={option}
              activeSort={activeSort}
              onSortChange={onSortChange}
              expandedDropdown={expandedDropdown}
              setExpandedDropdown={setExpandedDropdown}
            />
          ))}
          {SIMPLE_SORT_OPTIONS.filter(o => o.value !== ApiCommunityMembersSortOption.Level).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSortChange(option.value)}
              className={`tw-w-full tw-text-left tw-rounded-lg tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-transition tw-duration-200 tw-border-0 tw-flex tw-items-center tw-justify-between ${
                activeSort === option.value
                  ? "tw-bg-primary-500/20 tw-text-primary-300"
                  : "tw-bg-iron-800 tw-text-iron-300"
              }`}
            >
              <span>{option.label}</span>
              {activeSort === option.value && (
                <FontAwesomeIcon icon={faCheck} className="tw-h-4 tw-w-4 tw-text-primary-400" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
