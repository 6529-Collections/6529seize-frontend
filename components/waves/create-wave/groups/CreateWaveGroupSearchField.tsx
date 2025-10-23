"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useDebounce, useClickAway, useKeyPressEvent } from "react-use";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { GroupsRequestParams } from "@/entities/IGroup";
import { Mutable, NonNullableNotRequired } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import CircleLoader, {
  CircleLoaderSize,
} from "@/components/distribution-plan-tool/common/CircleLoader";

const MAX_RESULTS = 7;
const DEBOUNCE_MS = 200;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightedText({
  text,
  query,
}: {
  readonly text: string;
  readonly query: string;
}) {
  const trimmed = query.trim();
  if (!trimmed) {
    return <>{text}</>;
  }

  const matcher = new RegExp(`(${escapeRegExp(trimmed)})`, "ig");
  const parts = text.split(matcher);

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <span key={`${part}-${index}`} className="tw-text-primary-300">
            {part}
          </span>
        ) : (
          <span key={`${part}-${index}`} className="tw-text-inherit">
            {part}
          </span>
        )
      )}
    </>
  );
}

export default function CreateWaveGroupSearchField({
  label,
  defaultLabel,
  disabled,
  selectedGroup,
  onSelect,
}: {
  readonly label: string;
  readonly defaultLabel: string;
  readonly disabled: boolean;
  readonly selectedGroup: ApiGroupFull | null;
  readonly onSelect: (group: ApiGroupFull | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const baseId = useId();
  const inputId = `${baseId}-input`;
  const listboxId = `${baseId}-listbox`;
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [inputValue, setInputValue] = useState<string>(
    selectedGroup?.name ?? ""
  );
  const [searchCriteria, setSearchCriteria] = useState<string>(
    selectedGroup?.name ?? ""
  );
  const [debouncedValue, setDebouncedValue] = useState<string>(
    selectedGroup?.name ?? ""
  );
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  useDebounce(
    () => {
      setDebouncedValue(searchCriteria.trim());
    },
    DEBOUNCE_MS,
    [searchCriteria]
  );

  const { data, isFetching } = useQuery<ApiGroupFull[]>({
    queryKey: [QueryKey.GROUPS, { group_name: debouncedValue || null }],
    queryFn: async () => {
      const params: Mutable<
        NonNullableNotRequired<GroupsRequestParams>
      > = {};
      if (debouncedValue) {
        params.group_name = debouncedValue;
      }

      return await commonApiFetch<
        ApiGroupFull[],
        NonNullableNotRequired<GroupsRequestParams>
      >({
        endpoint: "groups",
        params,
      });
    },
    enabled: isOpen && !disabled,
    placeholderData: keepPreviousData,
  });

  const suggestions = (data ?? []).slice(0, MAX_RESULTS);

  const clearSelection = useCallback(() => {
    setInputValue("");
    setSearchCriteria("");
    onSelect(null);
    setIsOpen(true);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }, [onSelect]);

  // Keep local state in sync with external selection
  useEffect(() => {
    if (selectedGroup) {
      setInputValue(selectedGroup.name);
      setSearchCriteria(selectedGroup.name);
    } else {
      setInputValue("");
      setSearchCriteria("");
    }
  }, [selectedGroup]);

  useClickAway(wrapperRef, () => {
    if (!isOpen) return;
    setIsOpen(false);
    setActiveIndex(-1);
  });
  useKeyPressEvent("Escape", () => {
    if (!isOpen) return;
    setIsOpen(false);
    setActiveIndex(-1);
  });

  const onInputFocus = () => {
    if (disabled) return;
    setIsOpen(true);
    setActiveIndex(-1);
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setSearchCriteria(value);
    setIsOpen(true);
    setActiveIndex(-1);
    if (selectedGroup) {
      onSelect(null);
    }
  };

  const onOptionSelect = (group: ApiGroupFull) => {
    setInputValue(group.name);
    setSearchCriteria(group.name);
    onSelect(group);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (event.key === "ArrowDown") {
        setIsOpen(true);
        setActiveIndex(0);
        event.preventDefault();
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex >= suggestions.length) {
          return suggestions.length ? 0 : -1;
        }
        return nextIndex;
      });
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => {
        if (suggestions.length === 0) {
          return -1;
        }
        if (prev <= 0) {
          return suggestions.length - 1;
        }
        return prev - 1;
      });
    } else if (event.key === "Enter") {
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        event.preventDefault();
        onOptionSelect(suggestions[activeIndex]);
      }
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const showNoResults = !isFetching && isOpen && suggestions.length === 0;
  const helperText = selectedGroup
    ? `Selected: ${selectedGroup.name}`
    : `Default: ${defaultLabel}`;

  const hasValue = inputValue.trim().length > 0;
  const showClearButton = (hasValue || !!selectedGroup) && !disabled;
  const labelBackground = disabled ? "tw-bg-iron-800" : "tw-bg-iron-900";
  const inputClasses = [
    "tw-form-input",
    "tw-block",
    "tw-w-full",
    "tw-rounded-lg",
    "tw-border-0",
    "tw-appearance-none",
    "tw-px-4",
    "tw-pr-10",
    "tw-pt-4",
    "tw-pb-3",
    "tw-text-base",
    "tw-font-medium",
    "tw-shadow-sm",
    "tw-peer",
    "tw-ring-1",
    "tw-ring-inset",
    "tw-transition",
    "tw-duration-300",
    "tw-ease-out",
    "focus:tw-outline-none",
    "focus:tw-ring-1",
    "focus:tw-ring-inset",
    disabled
      ? "tw-bg-iron-800 tw-ring-iron-700 tw-text-iron-500 tw-caret-iron-500 placeholder:tw-text-iron-500"
      : "tw-bg-iron-900 hover:tw-bg-iron-800 focus:tw-bg-iron-900 tw-ring-iron-650 focus:tw-ring-primary-400 focus:tw-border-blue-500 tw-caret-primary-400 placeholder:tw-text-iron-500",
    hasValue || selectedGroup ? "focus:tw-text-white tw-text-primary-400" : "tw-text-white",
  ].join(" ");

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-2" ref={wrapperRef}>
      <div className="tw-group tw-w-full tw-relative">
        <div className="tw-relative">
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-disabled={disabled}
            aria-activedescendant={
              activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
            }
            value={inputValue}
            onFocus={onInputFocus}
            onChange={(event) => handleInputChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder=" "
            disabled={disabled}
            className={inputClasses}
            autoComplete="off"
          />
          {showClearButton && (
            <button
              type="button"
              className="tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-iron-400 hover:tw-text-error tw-transition tw-duration-150 tw-bg-transparent tw-border-0 tw-p-0"
              onClick={clearSelection}
              aria-label="Clear selected group"
            >
              <svg
                className="tw-h-4 tw-w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
            )}

          <label
            htmlFor={inputId}
            className={`tw-absolute tw-cursor-text tw-text-base tw-font-normal ${
              disabled ? "tw-text-iron-400" : "tw-text-iron-500"
            } tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] ${labelBackground} peer-focus:tw-bg-iron-900 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1`}
          >
            {label}
          </label>
        </div>

        {isOpen && !disabled && (
          <div
            role="listbox"
            id={listboxId}
            className="tw-absolute tw-z-50 tw-mt-2 tw-max-h-64 tw-w-full tw-overflow-y-auto tw-rounded-xl tw-border tw-border-iron-700 tw-bg-iron-950 tw-shadow-xl"
          >
            {isFetching && (
              <div className="tw-flex tw-items-center tw-justify-center tw-py-4">
                <CircleLoader size={CircleLoaderSize.SMALL} />
              </div>
            )}

            {!isFetching && suggestions.length > 0 && (
              <ul className="tw-list-none tw-px-0 tw-py-1 tw-m-0">
                {suggestions.map((group, index) => {
                  const isActive = index === activeIndex;
                  const isSelected =
                    selectedGroup && selectedGroup.id === group.id;
                  return (
                    <li
                      key={group.id}
                      id={`${listboxId}-option-${index}`}
                      role="option"
                      aria-selected={isSelected}
                      className={`tw-cursor-pointer tw-px-4 tw-py-2 tw-transition tw-duration-150 ${
                        isActive
                          ? "tw-bg-iron-800"
                          : "hover:tw-bg-iron-800 tw-bg-transparent"
                      }`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => onOptionSelect(group)}
                    >
                      <div className="tw-text-sm tw-font-semibold tw-flex tw-flex-col tw-gap-y-1">
                        <span className="tw-text-iron-50 tw-truncate">
                          <HighlightedText
                            text={group.name}
                            query={searchCriteria}
                          />
                        </span>
                        <span className="tw-text-xs tw-text-iron-400 tw-truncate">
                          <HighlightedText
                            text={`@${group.created_by?.handle ?? "unknown"}`}
                            query={searchCriteria}
                          />
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {showNoResults && (
              <div className="tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-text-iron-400">
                No groups found
              </div>
            )}
          </div>
        )}
      </div>

      <p className="tw-text-xs tw-font-medium tw-text-iron-400 tw-mb-0">
        {helperText}
      </p>
    </div>
  );
}
