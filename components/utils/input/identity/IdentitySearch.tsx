"use client";

import { useQuery } from "@tanstack/react-query";
import type { KeyboardEvent} from "react";
import { useEffect, useRef, useState, useId } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation, faXmark } from "@fortawesome/free-solid-svg-icons";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { commonApiFetch } from "@/services/api/common-api";
import CommonProfileSearchItems from "../profile-search/CommonProfileSearchItems";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getSelectableIdentity } from "@/components/utils/input/profile-search/getSelectableIdentity";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export enum IdentitySearchSize {
  SM = "SM",
  MD = "MD",
}

const MIN_SEARCH_LENGTH = 3;

export default function IdentitySearch({
  identity,
  size = IdentitySearchSize.MD,
  label = "Identity",
  error = false,
  autoFocus = false,
  setIdentity,
}: {
  readonly identity: string | null;
  readonly size?: IdentitySearchSize | undefined;
  readonly error?: boolean | undefined;
  readonly label?: string | undefined;
  readonly autoFocus?: boolean | undefined;

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

  const [searchCriteria, setSearchCriteria] = useState<string | null>(identity);
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

  const selectionUpdateRef = useRef(false);

  useEffect(() => {
    if (selectionUpdateRef.current) {
      selectionUpdateRef.current = false;
      return;
    }
    setSearchCriteria(identity);
  }, [identity]);

  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [highlightedOptionId, setHighlightedOptionId] = useState<
    string | undefined
  >(undefined);
  const [shouldSubmit, setShouldSubmit] = useState(false);
  const onValueChange = (
    newValue: string | null,
    displayValue?: string | null
  ) => {
    selectionUpdateRef.current = true;
    setIdentity(newValue);
    setSearchCriteria(displayValue ?? newValue);
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
    setSearchCriteria(newV);
    const len = newV?.length ?? 0;
    setIsOpen(len >= MIN_SEARCH_LENGTH);
    if (!newV) {
      setIdentity(null);
    }
    setHighlightedIndex(null);
  };

  const selectProfile = (profile: CommunityMemberMinimal) => {
    const nextIdentity = getSelectableIdentity(profile);
    if (!nextIdentity) {
      return false;
    }

    const displayValue =
      profile.handle ?? profile.display ?? nextIdentity;
    onValueChange(nextIdentity, displayValue);
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

  return (
    <div className="tw-group tw-w-full tw-relative" ref={wrapperRef}>
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
            ? "tw-ring-error focus:tw-border-error focus:tw-ring-error tw-caret-error"
            : "tw-ring-iron-700 focus:tw-border-blue-500 tw-caret-primary-400 focus:tw-ring-primary-400 hover:tw-ring-iron-650"
        } tw-form-input tw-block tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none tw-font-medium tw-border-iron-700 tw-peer tw-pl-10 tw-pr-4 tw-bg-iron-900 tw-shadow-sm tw-ring-1 tw-ring-inset placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-transition tw-duration-300 tw-ease-out ${
          searchCriteria
            ? "focus:tw-text-white tw-text-primary-400"
            : "tw-text-white"
        }`}
        placeholder=" "
      />
      <MagnifyingGlassIcon
        className={`${ICON_CLASSES[size]} tw-text-iron-300 tw-pointer-events-none tw-absolute tw-left-3 tw-h-5 tw-w-5`}
        aria-hidden="true"
      />
      {!!identity?.length && (
        <button
          type="button"
          aria-label="Clear identity"
          onClick={() => onValueChange(null)}
          className={`${ICON_CLASSES[size]} tw-absolute tw-right-3 tw-flex tw-h-5 tw-w-5 tw-items-center tw-justify-center tw-cursor-pointer tw-bg-transparent tw-border-0 tw-p-0 tw-text-iron-400 hover:tw-text-error focus:tw-outline-none focus:tw-ring-0 tw-transition tw-duration-300 tw-ease-out`}
        >
          <FontAwesomeIcon icon={faXmark} className="tw-h-5 tw-w-5" />
        </button>
      )}
      <label
        htmlFor={inputId}
        className={`${LABEL_CLASSES[size]} ${
          error
            ? "peer-focus:tw-text-error peer-placeholder-shown:-tw-translate-y-1/4 peer-placeholder-shown:tw-top-1/4"
            : "peer-focus:tw-text-primary-400 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2"
        } tw-absolute tw-rounded-lg tw-cursor-text tw-font-medium tw-text-iron-500 tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900  peer-focus:tw-bg-iron-900 tw-ml-7 tw-px-2 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 peer-placeholder-shown:tw-scale-100  peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1`}>
        {label}
      </label>
      <CommonProfileSearchItems
        open={isOpen}
        selected={identity}
        searchCriteria={searchCriteria}
        profiles={data ?? []}
        highlightedIndex={highlightedIndex}
        listboxId={listboxId}
        onHighlightedOptionIdChange={setHighlightedOptionId}
        onProfileSelect={(profile) => {
          if (!profile) {
            return;
          }
          selectProfile(profile);
        }}
      />
      {error && (
        <div className="tw-pt-1.5 tw-relative tw-flex tw-items-center tw-gap-x-2">
          <FontAwesomeIcon
            icon={faCircleExclamation}
            className="tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-error"
            aria-hidden="true"
          />
          <div className="tw-text-error tw-text-xs tw-font-medium">
            Please enter identity
          </div>
        </div>
      )}
    </div>
  );
}
