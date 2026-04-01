"use client";

import { useQuery } from "@tanstack/react-query";
import type { KeyboardEvent } from "react";
import { useEffect, useRef, useState, useId } from "react";
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
  dropdownListClassName,
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
  readonly dropdownListClassName?: string | undefined;
  readonly onSelectionChange?:
    | ((selection: SelectableIdentityOption | null) => void)
    | undefined;

  readonly setIdentity: (identity: string | null) => void;
}) {
  const INPUT_CLASSES: Record<IdentitySearchSize, string> = {
    [IdentitySearchSize.SM]: "tw-py-3 tw-text-sm",
    [IdentitySearchSize.MD]: "tw-pb-3 tw-pt-3 tw-text-md",
  };

  const LABEL_CLASSES: Record<IdentitySearchSize, string> = {
    [IdentitySearchSize.SM]: "tw-text-sm",
    [IdentitySearchSize.MD]: "tw-text-md",
  };

  const ICON_CLASSES: Record<IdentitySearchSize, string> = {
    [IdentitySearchSize.SM]: "tw-top-3",
    [IdentitySearchSize.MD]: "tw-top-3.5",
  };

  const inputId = useId();
  const listboxId = `${inputId}-listbox`;
  const resolvedDisplayValue = selectedDisplayValue ?? identity ?? null;
  const [searchCriteriaDraft, setSearchCriteriaDraft] =
    useState<IdentitySearchDraft | null>(null);
  const shouldUseDraft =
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
  useDebounce(() => setDebouncedValue(searchCriteria), 200, [searchCriteria]);
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
    enabled: !!debouncedValue && debouncedValue.length >= MIN_SEARCH_LENGTH,
  });

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [highlightedOptionId, setHighlightedOptionId] = useState<
    string | undefined
  >(undefined);
  const [shouldSubmit, setShouldSubmit] = useState(false);
  const onValueChange = (
    newValue: string | null,
    options?: {
      readonly displayValue?: string | null;
      readonly selection?: SelectableIdentityOption | null;
    }
  ) => {
    const draftValue = options?.displayValue ?? newValue ?? "";
    setIdentity(newValue);
    onSelectionChange?.(options?.selection ?? null);
    setSearchCriteriaDraft({
      value: draftValue,
      baseResolvedDisplayValue: resolvedDisplayValue,
      preservedResolvedValues: [newValue, options?.displayValue ?? null],
    });
    setIsOpen(false);
    setHighlightedIndex(null);
  };

  const onFocusChange = (newV: boolean) => {
    if (newV) {
      const len = searchCriteria?.length ?? 0;
      setIsOpen(len >= MIN_SEARCH_LENGTH);
      return;
    }
    setIsOpen(false);
    setHighlightedIndex(null);
  };

  const onSearchCriteriaChange = (newV: string | null) => {
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
    setHighlightedIndex(null);
  };

  const selectProfile = (profile: CommunityMemberMinimal) => {
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
  useClickAway(wrapperRef, () => setIsOpen(false));
  useKeyPressEvent("Escape", () => setIsOpen(false));

  const inputRef = useRef<HTMLInputElement>(null);
  const shouldAutoFocus = useRef(autoFocus);
  useEffect(() => {
    if (shouldAutoFocus.current) {
      inputRef.current?.focus();
    }
  }, []);

  useEffect(() => {
    if (!shouldSubmit) {
      return;
    }

    const formElement = inputRef.current?.form;
    if (formElement) {
      formElement.requestSubmit();
    }
    setShouldSubmit(false);
  }, [shouldSubmit]);

  const handleArrowNavigation = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!data?.length) {
      return;
    }

    const maxIndex = data.length - 1;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((current) => {
        if (current === null || current >= maxIndex) {
          return 0;
        }
        return current + 1;
      });
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((current) => {
        if (current === null || current <= 0) {
          return maxIndex;
        }
        return current - 1;
      });
      return;
    }

    if (event.key === "Enter" && highlightedIndex !== null) {
      event.preventDefault();
      const profile = data[highlightedIndex];
      if (profile) {
        if (selectProfile(profile)) {
          setShouldSubmit(true);
        }
      }
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setHighlightedIndex(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!data?.length) {
      setHighlightedIndex(null);
      return;
    }

    if (identity) {
      const matchingIndex = data.findIndex((profile) => {
        const value = getSelectableIdentity(profile);
        return value?.toLowerCase() === identity.toLowerCase();
      });

      if (matchingIndex >= 0) {
        setHighlightedIndex(matchingIndex);
        return;
      }
    }

    setHighlightedIndex((current) =>
      current === null ? null : Math.min(current, data.length - 1)
    );
  }, [data, identity]);

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
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={
          isOpen && highlightedOptionId ? highlightedOptionId : undefined
        }
        className={`${INPUT_CLASSES[size]} ${
          error
            ? "tw-caret-error tw-ring-error focus:tw-border-error focus:tw-ring-error"
            : "tw-caret-primary-400 tw-ring-iron-700 hover:tw-ring-iron-650 focus:tw-border-blue-500 focus:tw-ring-primary-400"
        } tw-peer tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-border-iron-700 tw-bg-iron-900 tw-pl-10 tw-pr-4 tw-text-base tw-font-medium tw-shadow-sm tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset ${
          searchCriteria
            ? "tw-text-primary-400 focus:tw-text-white"
            : "tw-text-white"
        }`}
        placeholder=" "
      />
      <MagnifyingGlassIcon
        className={`${ICON_CLASSES[size]} tw-pointer-events-none tw-absolute tw-left-3 tw-h-5 tw-w-5 tw-text-iron-300`}
        aria-hidden="true"
      />
      {clearable && hasIdentity && (
        <button
          type="button"
          aria-label="Clear identity"
          onClick={() => onValueChange(null)}
          className={`${ICON_CLASSES[size]} tw-absolute tw-right-3 tw-flex tw-h-5 tw-w-5 tw-cursor-pointer tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out hover:tw-text-error focus:tw-outline-none focus:tw-ring-0`}
        >
          <FontAwesomeIcon icon={faXmark} className="tw-h-5 tw-w-5" />
        </button>
      )}
      <label
        htmlFor={inputId}
        className={`${LABEL_CLASSES[size]} ${
          error
            ? "peer-placeholder-shown:tw-top-1/4 peer-placeholder-shown:-tw-translate-y-1/4 peer-focus:tw-text-error"
            : "peer-placeholder-shown:tw-top-1/2 peer-placeholder-shown:-tw-translate-y-1/2 peer-focus:tw-text-primary-400"
        } tw-absolute tw-start-1 tw-top-2 tw-z-10 tw-ml-7 tw-origin-[0] -tw-translate-y-4 tw-scale-75 tw-transform tw-cursor-text tw-rounded-lg tw-bg-iron-900 tw-px-2 tw-font-medium tw-text-iron-500 tw-duration-300 peer-placeholder-shown:tw-top-1/2 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-scale-100 peer-focus:tw-top-2 peer-focus:-tw-translate-y-4 peer-focus:tw-scale-75 peer-focus:tw-bg-iron-900 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 rtl:peer-focus:tw-left-auto rtl:peer-focus:tw-translate-x-1/4`}
      >
        {label}
      </label>
      <CommonProfileSearchItems
        open={isOpen}
        selected={identity}
        searchCriteria={searchCriteria}
        profiles={data ?? []}
        highlightedIndex={highlightedIndex}
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
