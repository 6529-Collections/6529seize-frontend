"use client";

import { useQuery } from "@tanstack/react-query";
import type { KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState, useId } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleExclamation,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { commonApiFetch } from "@/services/api/common-api";
import CommonProfileSearchItems from "../profile-search/CommonProfileSearchItems";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  getSelectableIdentity,
  getSelectableIdentityOption,
  type SelectableIdentityOption,
} from "@/components/utils/input/profile-search/getSelectableIdentity";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export enum IdentitySearchSize {
  SM = "SM",
  MD = "MD",
}

const MIN_SEARCH_LENGTH = 3;

type IdentitySearchDraft = {
  readonly value: string;
  readonly baseResolvedDisplayValue: string | null;
  readonly preservedResolvedValues: readonly (string | null)[];
};

export default function IdentitySearch({
  identity,
  size = IdentitySearchSize.MD,
  label = "Identity",
  error = false,
  errorMessage,
  autoFocus = false,
  selectedDisplayValue,
  clearable = true,
  disabled = false,
  dropdownListClassName,
  iconPositionClassName,
  onSelectionChange,
  setIdentity,
}: {
  readonly identity: string | null;
  readonly size?: IdentitySearchSize | undefined;
  readonly error?: boolean | undefined;
  readonly errorMessage?: string | null | undefined;
  readonly label?: string | undefined;
  readonly autoFocus?: boolean | undefined;
  readonly selectedDisplayValue?: string | null | undefined;
  readonly clearable?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  readonly dropdownListClassName?: string | undefined;
  readonly iconPositionClassName?: string | undefined;
  readonly onSelectionChange?:
    | ((selection: SelectableIdentityOption | null) => void)
    | undefined;

  readonly setIdentity: (identity: string | null) => void;
}) {
  const INPUT_CLASSES: Record<IdentitySearchSize, string> = {
    [IdentitySearchSize.SM]: "tw-py-3",
    [IdentitySearchSize.MD]: "tw-pb-3 tw-pt-3",
  };

  const LABEL_CLASSES: Record<IdentitySearchSize, string> = {
    [IdentitySearchSize.SM]: "tw-text-sm",
    [IdentitySearchSize.MD]: "tw-text-md",
  };

  const iconPosition = iconPositionClassName ?? "tw-top-3.5";
  const SEARCH_ICON_SIZE_CLASSES: Record<IdentitySearchSize, string> = {
    [IdentitySearchSize.SM]: "tw-h-4 tw-w-4",
    [IdentitySearchSize.MD]: "tw-h-5 tw-w-5",
  };

  const inputId = useId();
  const listboxId = `${inputId}-listbox`;
  const resolvedDisplayValue = selectedDisplayValue ?? identity ?? null;
  const [searchCriteriaDraft, setSearchCriteriaDraft] =
    useState<IdentitySearchDraft | null>(null);
  const shouldUseDraft =
    !disabled &&
    searchCriteriaDraft !== null &&
    (searchCriteriaDraft.baseResolvedDisplayValue === resolvedDisplayValue ||
      searchCriteriaDraft.preservedResolvedValues.some(
        (value) => value === resolvedDisplayValue
      ));
  const searchCriteria = shouldUseDraft
    ? searchCriteriaDraft.value
    : resolvedDisplayValue;
  const [debouncedValue, setDebouncedValue] = useState<string | null>(
    searchCriteria
  );
  useDebounce(() => setDebouncedValue(disabled ? null : searchCriteria), 200, [
    disabled,
    searchCriteria,
  ]);
  const { data } = useQuery<CommunityMemberMinimal[]>({
    queryKey: [
      QueryKey.PROFILE_SEARCH,
      {
        param: debouncedValue,
        only_profile_owners: "true",
      },
    ],
    queryFn: async () =>
      await commonApiFetch<CommunityMemberMinimal[]>({
        endpoint: "community-members",
        params: {
          param: debouncedValue ?? "",
          only_profile_owners: "true",
        },
      }),
    enabled:
      !disabled &&
      !!debouncedValue &&
      debouncedValue.length >= MIN_SEARCH_LENGTH,
  });
  const searchResults = useMemo(
    () => (disabled ? [] : (data ?? [])),
    [data, disabled]
  );

  const [isOpen, setIsOpen] = useState(false);
  const [manualHighlightedIndex, setManualHighlightedIndex] = useState<
    number | null
  >(null);
  const [highlightedOptionId, setHighlightedOptionId] = useState<
    string | undefined
  >(undefined);

  if (disabled) {
    if (isOpen) {
      setIsOpen(false);
    }
    if (manualHighlightedIndex !== null) {
      setManualHighlightedIndex(null);
    }
  }

  const isDropdownOpen = !disabled && isOpen;
  const selectedResultIndex = useMemo(() => {
    if (searchResults.length === 0 || !identity) {
      return null;
    }

    const matchingIndex = searchResults.findIndex((profile) => {
      const value = getSelectableIdentity(profile);
      return value?.toLowerCase() === identity.toLowerCase();
    });

    return matchingIndex >= 0 ? matchingIndex : null;
  }, [identity, searchResults]);

  const effectiveHighlightedIndex = useMemo(() => {
    if (!isDropdownOpen || searchResults.length === 0) {
      return null;
    }

    if (manualHighlightedIndex !== null) {
      return Math.min(manualHighlightedIndex, searchResults.length - 1);
    }

    return selectedResultIndex;
  }, [
    isDropdownOpen,
    manualHighlightedIndex,
    searchResults.length,
    selectedResultIndex,
  ]);

  const closeDropdown = () => {
    setIsOpen(false);
    setManualHighlightedIndex(null);
  };

  const onValueChange = (
    newValue: string | null,
    options?: {
      readonly displayValue?: string | null;
      readonly selection?: SelectableIdentityOption | null;
    }
  ) => {
    if (disabled) {
      return;
    }

    const draftValue = options?.displayValue ?? newValue ?? "";
    setIdentity(newValue);
    onSelectionChange?.(options?.selection ?? null);
    setSearchCriteriaDraft({
      value: draftValue,
      baseResolvedDisplayValue: resolvedDisplayValue,
      preservedResolvedValues: [newValue, options?.displayValue ?? null],
    });
    closeDropdown();
  };

  const onFocusChange = (newV: boolean) => {
    if (disabled) {
      closeDropdown();
      return;
    }

    if (newV) {
      const len = searchCriteria?.length ?? 0;
      setIsOpen(len >= MIN_SEARCH_LENGTH);
      return;
    }
    closeDropdown();
  };

  const onSearchCriteriaChange = (newV: string | null) => {
    if (disabled) {
      return;
    }

    setSearchCriteriaDraft({
      value: newV ?? "",
      baseResolvedDisplayValue: resolvedDisplayValue,
      preservedResolvedValues: [],
    });
    const len = newV?.length ?? 0;
    setIsOpen(len >= MIN_SEARCH_LENGTH);
    if (!newV && clearable) {
      setIdentity(null);
      onSelectionChange?.(null);
    }
    setManualHighlightedIndex(null);
  };

  const selectProfile = (profile: CommunityMemberMinimal) => {
    if (disabled) {
      return false;
    }

    const nextSelection = getSelectableIdentityOption(profile);
    if (!nextSelection) {
      return false;
    }

    onValueChange(nextSelection.value, {
      displayValue: nextSelection.label,
      selection: nextSelection,
    });
    return true;
  };

  const wrapperRef = useRef<HTMLDivElement>(null);
  useClickAway(wrapperRef, closeDropdown);
  useKeyPressEvent("Escape", () => {
    if (!disabled) {
      closeDropdown();
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const shouldAutoFocus = useRef(autoFocus);
  useEffect(() => {
    if (shouldAutoFocus.current) {
      inputRef.current?.focus();
    }
  }, []);

  const handleArrowNavigation = (event: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) {
      return;
    }

    const resultCount = searchResults.length;
    if (resultCount === 0) {
      return;
    }

    const maxIndex = resultCount - 1;
    const currentHighlightIndex = effectiveHighlightedIndex;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setManualHighlightedIndex(
        currentHighlightIndex === null || currentHighlightIndex >= maxIndex
          ? 0
          : currentHighlightIndex + 1
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setManualHighlightedIndex(
        currentHighlightIndex === null || currentHighlightIndex <= 0
          ? maxIndex
          : currentHighlightIndex - 1
      );
      return;
    }

    if (event.key === "Enter" && effectiveHighlightedIndex !== null) {
      event.preventDefault();
      const profile = searchResults[effectiveHighlightedIndex];
      if (profile !== undefined && selectProfile(profile)) {
        inputRef.current?.form?.requestSubmit();
      }
    }
  };

  const hasIdentity = identity !== null && identity.length > 0;

  return (
    <div className="tw-group tw-relative tw-w-full" ref={wrapperRef}>
      <input
        ref={inputRef}
        type="text"
        value={searchCriteria ?? ""}
        onChange={(e) => onSearchCriteriaChange(e.target.value)}
        onFocus={() => onFocusChange(true)}
        onBlur={(e) => {
          const next = e.relatedTarget as Node | null;
          if (!next || !wrapperRef.current?.contains(next)) {
            onFocusChange(false);
          }
        }}
        onKeyDown={(event) => handleArrowNavigation(event)}
        id={inputId}
        disabled={disabled}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-disabled={disabled}
        aria-expanded={isDropdownOpen}
        aria-controls={listboxId}
        aria-activedescendant={
          isDropdownOpen && highlightedOptionId
            ? highlightedOptionId
            : undefined
        }
        className={`${INPUT_CLASSES[size]} ${
          error
            ? "tw-caret-error tw-ring-error focus:tw-border-error focus:tw-ring-error"
            : "tw-caret-primary-400 tw-ring-iron-700 hover:tw-ring-iron-650 focus:tw-border-blue-500 focus:tw-ring-primary-400"
        } tw-peer tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-border-iron-700 tw-bg-iron-900 tw-pl-9 tw-pr-4 tw-text-base tw-font-medium tw-shadow-sm tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset sm:tw-text-sm ${
          searchCriteria
            ? "tw-text-primary-400 focus:tw-text-white"
            : "tw-text-white"
        } disabled:tw-cursor-not-allowed disabled:tw-opacity-70`}
        placeholder=" "
      />
      <MagnifyingGlassIcon
        className={`${iconPosition} ${SEARCH_ICON_SIZE_CLASSES[size]} tw-pointer-events-none tw-absolute tw-left-3 tw-text-iron-300`}
        aria-hidden="true"
      />
      {!disabled && clearable && hasIdentity && (
        <button
          type="button"
          aria-label="Clear identity"
          onClick={() => onValueChange(null)}
          className={`${iconPosition} tw-absolute tw-right-3 tw-flex tw-h-5 tw-w-5 tw-cursor-pointer tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out hover:tw-text-error focus:tw-outline-none focus:tw-ring-0`}
        >
          <FontAwesomeIcon
            icon={faXmark}
            className="tw-h-4 tw-w-4 tw-flex-shrink-0"
          />
        </button>
      )}
      <label
        htmlFor={inputId}
        className={`${LABEL_CLASSES[size]} ${
          error
            ? "peer-placeholder-shown:tw-top-1/4 peer-placeholder-shown:-tw-translate-y-1/4 peer-focus:tw-text-error"
            : "peer-placeholder-shown:tw-top-1/2 peer-placeholder-shown:-tw-translate-y-1/2 peer-focus:tw-text-primary-400"
        } tw-absolute tw-start-1 tw-top-2 tw-z-10 tw-ml-6 tw-origin-[0] -tw-translate-y-4 tw-scale-75 tw-transform tw-cursor-text tw-rounded-lg tw-bg-iron-900 tw-px-2 tw-font-medium tw-text-iron-500 tw-duration-300 peer-placeholder-shown:tw-top-1/2 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-scale-100 peer-focus:tw-top-2 peer-focus:-tw-translate-y-4 peer-focus:tw-scale-75 peer-focus:tw-bg-iron-900 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 rtl:peer-focus:tw-left-auto rtl:peer-focus:tw-translate-x-1/4`}
      >
        {label}
      </label>
      <CommonProfileSearchItems
        open={isDropdownOpen}
        selected={identity}
        searchCriteria={searchCriteria}
        profiles={searchResults}
        highlightedIndex={effectiveHighlightedIndex}
        listboxId={listboxId}
        listClassName={dropdownListClassName}
        onHighlightedOptionIdChange={setHighlightedOptionId}
        onProfileSelect={(profile) => {
          if (!profile) {
            return;
          }
          selectProfile(profile);
        }}
      />
      {error && (
        <div className="tw-relative tw-flex tw-items-center tw-gap-x-2 tw-pt-1.5">
          <FontAwesomeIcon
            icon={faCircleExclamation}
            className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-error"
            aria-hidden="true"
          />
          <div className="tw-text-xs tw-font-medium tw-text-error">
            {errorMessage ?? "Please enter identity"}
          </div>
        </div>
      )}
    </div>
  );
}
