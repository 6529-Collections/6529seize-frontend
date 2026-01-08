"use client";

import { useState, useRef, useEffect } from "react";
import { SortDirection } from "@/entities/ISort";
import { ApiCommunityMembersSortOption } from "@/generated/models/ApiCommunityMembersSortOption";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp, faArrowDown, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import {
  DROPDOWN_SORT_OPTIONS,
  SIMPLE_SORT_OPTIONS,
  DropdownSortOption,
  getDropdownDisplayLabel,
  getDropdownActiveState,
} from "./communityMembersSortConfig";

function DropdownSortButton({
  option,
  activeSort,
  onSortChange,
}: {
  readonly option: DropdownSortOption;
  readonly activeSort: ApiCommunityMembersSortOption;
  readonly onSortChange: (sort: ApiCommunityMembersSortOption) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { isPrimaryActive, isSecondaryActive, isActive } = getDropdownActiveState(option, activeSort);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (sort: ApiCommunityMembersSortOption) => {
    onSortChange(sort);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="tw-relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-transition tw-duration-200 tw-flex tw-items-center tw-gap-1.5 ${
          isActive
            ? "tw-border-primary-500 tw-bg-primary-500/20 tw-text-primary-300"
            : "tw-border-iron-700 tw-bg-iron-800 tw-text-iron-300 hover:tw-bg-iron-700 hover:tw-text-iron-200"
        }`}>
        <span>{getDropdownDisplayLabel(option, activeSort)}</span>
        <FontAwesomeIcon
          icon={faChevronDown}
          className={`tw-h-2.5 tw-w-2.5 tw-transition-transform ${isOpen ? "tw-rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div 
          className="tw-absolute tw-top-full tw-left-0 tw-mt-1 tw-z-50 tw-rounded-lg tw-shadow-xl tw-min-w-[120px] tw-overflow-hidden"
          style={{ backgroundColor: '#1f1f1f', border: '1px solid #3a3a3a' }}
        >
          <button
            type="button"
            onClick={() => handleSelect(option.primarySort)}
            className={`tw-w-full tw-text-left tw-px-4 tw-py-2.5 tw-text-sm tw-font-medium tw-border-0 tw-cursor-pointer ${
              isPrimaryActive 
                ? "tw-text-primary-300" 
                : "tw-text-iron-300"
            }`}
            style={{ 
              backgroundColor: isPrimaryActive ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => { if (!isPrimaryActive) e.currentTarget.style.backgroundColor = '#2a2a2a'; }}
            onMouseLeave={(e) => { if (!isPrimaryActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            {option.primaryLabel}
          </button>
          <button
            type="button"
            onClick={() => handleSelect(option.secondarySort)}
            className={`tw-w-full tw-text-left tw-px-4 tw-py-2.5 tw-text-sm tw-font-medium tw-border-0 tw-cursor-pointer ${
              isSecondaryActive 
                ? "tw-text-primary-300" 
                : "tw-text-iron-300"
            }`}
            style={{ 
              backgroundColor: isSecondaryActive ? 'rgba(96, 165, 250, 0.2)' : 'transparent',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => { if (!isSecondaryActive) e.currentTarget.style.backgroundColor = '#2a2a2a'; }}
            onMouseLeave={(e) => { if (!isSecondaryActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            {option.secondaryLabel}
          </button>
        </div>
      )}
    </div>
  );
}

export default function CommunityMembersSortControls({
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
  return (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-3 tw-py-3">
      <span className="tw-text-sm tw-font-medium tw-text-iron-400">Sort by</span>
      <div className="tw-flex tw-items-center tw-gap-2">
        <button
          type="button"
          onClick={() => onDirectionChange(SortDirection.DESC)}
          className={`tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-transition tw-duration-200 ${
            sortDirection === SortDirection.DESC
              ? "tw-border-primary-500 tw-bg-primary-500/20 tw-text-primary-300"
              : "tw-border-iron-700 tw-bg-iron-800 tw-text-iron-400 hover:tw-bg-iron-700 hover:tw-text-iron-200"
          }`}
          title="Descending">
          <FontAwesomeIcon icon={faArrowDown} className="tw-h-3.5 tw-w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDirectionChange(SortDirection.ASC)}
          className={`tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-transition tw-duration-200 ${
            sortDirection === SortDirection.ASC
              ? "tw-border-primary-500 tw-bg-primary-500/20 tw-text-primary-300"
              : "tw-border-iron-700 tw-bg-iron-800 tw-text-iron-400 hover:tw-bg-iron-700 hover:tw-text-iron-200"
          }`}
          title="Ascending">
          <FontAwesomeIcon icon={faArrowUp} className="tw-h-3.5 tw-w-3.5" />
        </button>
      </div>
      <div className="tw-w-px tw-h-6 tw-bg-iron-700" />
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
        <button
          type="button"
          onClick={() => onSortChange(ApiCommunityMembersSortOption.Level)}
          className={`tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-transition tw-duration-200 ${
            activeSort === ApiCommunityMembersSortOption.Level
              ? "tw-border-primary-500 tw-bg-primary-500/20 tw-text-primary-300"
              : "tw-border-iron-700 tw-bg-iron-800 tw-text-iron-300 hover:tw-bg-iron-700 hover:tw-text-iron-200"
          }`}>
          Level
        </button>
        {DROPDOWN_SORT_OPTIONS.map((option) => (
          <DropdownSortButton
            key={option.label}
            option={option}
            activeSort={activeSort}
            onSortChange={onSortChange}
          />
        ))}
        {SIMPLE_SORT_OPTIONS.filter(o => o.value !== ApiCommunityMembersSortOption.Level).map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSortChange(option.value)}
            className={`tw-rounded-lg tw-border tw-border-solid tw-px-3 tw-py-1.5 tw-text-sm tw-font-medium tw-transition tw-duration-200 ${
              activeSort === option.value
                ? "tw-border-primary-500 tw-bg-primary-500/20 tw-text-primary-300"
                : "tw-border-iron-700 tw-bg-iron-800 tw-text-iron-300 hover:tw-bg-iron-700 hover:tw-text-iron-200"
            }`}>
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
