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
import { AnimatePresence, motion } from "framer-motion";
import { escapeRegExp } from "@/lib/text/regex";
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
  const inputClasses = [
    "tw-form-input tw-block tw-w-full tw-rounded-lg tw-border-0 tw-appearance-none tw-font-medium tw-peer tw-pl-10 tw-pr-4 tw-bg-iron-900 tw-shadow-sm tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out tw-text-base tw-pt-3 tw-pb-3",
    disabled
      ? "tw-ring-iron-700 tw-text-iron-500 tw-caret-iron-500 placeholder:tw-text-iron-500 tw-bg-iron-800"
      : "tw-ring-iron-700 focus:tw-border-blue-500 tw-caret-primary-400 focus:tw-ring-primary-400 hover:tw-ring-iron-650 placeholder:tw-text-iron-500",
    hasValue || selectedGroup
      ? "focus:tw-text-white tw-text-primary-400"
      : "tw-text-white",
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
          <svg
            className="tw-pointer-events-none tw-absolute tw-left-3 tw-top-3.5 tw-h-5 tw-w-5 tw-text-iron-300"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
              clipRule="evenodd"
            />
          </svg>
          {showClearButton && (
            <svg
              onClick={clearSelection}
              className="tw-cursor-pointer tw-absolute tw-right-3 tw-top-3.5 tw-h-5 tw-w-5 tw-text-iron-400 hover:tw-text-error tw-transition tw-duration-300 tw-ease-out"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              aria-label="Clear selected group"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M17 7L7 17M7 7L17 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            )}

          <label
            htmlFor={inputId}
            className={`tw-absolute tw-rounded-lg tw-cursor-text tw-font-medium tw-text-base ${
              disabled ? "tw-text-iron-400" : "tw-text-iron-500"
            } tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 peer-focus:tw-bg-iron-900 tw-ml-7 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1`}
          >
            {label}
          </label>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {isOpen && !disabled && (
            <motion.div
              className="tw-absolute tw-z-50 tw-mt-1.5 tw-w-full tw-rounded-lg tw-shadow-xl tw-bg-iron-800 tw-ring-1 tw-ring-black tw-ring-opacity-5"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="tw-absolute tw-overflow-hidden tw-w-full tw-rounded-md tw-bg-iron-800 tw-shadow-2xl tw-ring-1 tw-ring-white/10">
                <div className="tw-py-1 tw-flow-root tw-overflow-x-hidden tw-overflow-y-auto tw-max-h-64">
                  { }
                  <ul
                    id={listboxId}
                    role="listbox"
                    className="tw-flex tw-flex-col tw-gap-y-1 tw-px-2 tw-mx-0 tw-mb-0 tw-list-none"
                  >
                    {isFetching ? (
                      <li className="tw-flex tw-items-center tw-justify-center tw-py-4">
                        <CircleLoader size={CircleLoaderSize.SMALL} />
                      </li>
                    ) : suggestions.length > 0 ? (
                      suggestions.map((group, index) => {
                        const isActive = index === activeIndex;
                        const isSelected = selectedGroup?.id === group.id;
                        const optionStateClasses =
                          isActive || isSelected
                            ? "tw-bg-iron-800 tw-text-white"
                            : "tw-text-white hover:tw-bg-iron-800";
                        return (
                          <li
                            key={group.id}
                            id={`${listboxId}-option-${index}`}
                            role="option"
                            aria-selected={isSelected}
                            className={`tw-py-2 tw-w-full tw-flex tw-items-center tw-justify-between tw-text-sm tw-font-medium tw-rounded-lg tw-relative tw-select-none tw-px-2 ${optionStateClasses}`}
                            onMouseEnter={() => setActiveIndex(index)}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => onOptionSelect(group)}
                          >
                            <div className="tw-flex tw-flex-col tw-gap-y-1 tw-w-full">
                              <span className="tw-text-sm tw-font-semibold tw-text-iron-50 tw-truncate">
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
                      })
                    ) : (
                      <li className="tw-py-2 tw-w-full tw-text-sm tw-font-medium tw-text-white tw-rounded-lg tw-relative tw-select-none tw-px-4">
                        {showNoResults ? "No groups found" : helperText}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="tw-text-xs tw-font-medium tw-text-iron-400 tw-mb-0">
        {helperText}
      </p>
    </div>
  );
}
