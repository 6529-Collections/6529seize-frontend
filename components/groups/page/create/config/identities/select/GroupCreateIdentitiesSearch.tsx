"use client";

import { type FocusEvent, useRef, useState } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";
import GroupCreateIdentitiesSearchItems, {
  GROUP_IDENTITY_MIN_SEARCH_LENGTH,
  type CommunityMemberSearchSort,
  type GroupCreateIdentitiesSearchAppearance,
  type GroupCreateIdentitiesSearchResultsLayout,
} from "./GroupCreateIdentitiesSearchItems";
import type { CommunityMemberMinimal } from "@/entities/IProfile";
import { getRandomObjectId } from "@/helpers/AllowlistToolHelpers";

export default function GroupCreateIdentitiesSearch({
  selectedWallets,
  onIdentitySelect,
  placeholder = " ",
  label = "Identity",
  hideLabel = false,
  inputClassName = "",
  iconClassName = "",
  resultsLayout = "popover",
  appearance = "default",
  sort,
}: {
  readonly selectedWallets: string[];
  readonly onIdentitySelect: (identity: CommunityMemberMinimal) => void;
  readonly placeholder?: string | undefined;
  readonly label?: string | undefined;
  readonly hideLabel?: boolean | undefined;
  readonly inputClassName?: string | undefined;
  readonly iconClassName?: string | undefined;
  readonly resultsLayout?: GroupCreateIdentitiesSearchResultsLayout | undefined;
  readonly appearance?: GroupCreateIdentitiesSearchAppearance | undefined;
  readonly sort?: CommunityMemberSearchSort | undefined;
}) {
  const isModal = appearance === "modal";
  const [isOpen, setIsOpen] = useState(false);
  const [searchCriteria, setSearchCriteria] = useState<string | null>(null);

  const onFocusChange = (newV: boolean) => {
    if (newV) {
      setIsOpen(
        (searchCriteria?.trim().length ?? 0) >= GROUP_IDENTITY_MIN_SEARCH_LENGTH
      );
    }
  };

  const onSearchCriteriaChange = (newV: string | null) => {
    setSearchCriteria(newV);
    setIsOpen((newV?.trim().length ?? 0) >= GROUP_IDENTITY_MIN_SEARCH_LENGTH);
  };

  const wrapperRef = useRef<HTMLDivElement>(null);
  useClickAway(wrapperRef, () => setIsOpen(false));
  useKeyPressEvent("Escape", () => setIsOpen(false));

  const onWrapperBlur = (event: FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget as Node | null;
    if (nextTarget && wrapperRef.current?.contains(nextTarget)) {
      return;
    }

    setIsOpen(false);
  };

  const onSelect = (item: CommunityMemberMinimal) => {
    onIdentitySelect(item);
    setIsOpen(false);
    setSearchCriteria(null);
  };

  const randomId = getRandomObjectId();

  return (
    <div
      className="tw-group tw-relative tw-w-full"
      ref={wrapperRef}
      onBlur={onWrapperBlur}
    >
      <div className="tw-relative tw-w-full">
        <input
          type="text"
          value={searchCriteria ?? ""}
          onChange={(e) => onSearchCriteriaChange(e.target.value)}
          onFocus={() => onFocusChange(true)}
          id={randomId}
          className={`${
            isModal
              ? "tw-h-11 tw-bg-iron-900 tw-py-0 tw-pl-10 tw-pr-4 tw-text-sm tw-font-medium tw-ring-1 tw-ring-inset tw-ring-iron-700 focus:tw-bg-iron-900 focus:tw-ring-2 focus:tw-ring-inset focus:tw-ring-primary-400 desktop-hover:hover:tw-bg-iron-800/80 desktop-hover:hover:tw-ring-iron-650"
              : "tw-bg-iron-950 tw-pb-3 tw-pl-10 tw-pr-4 tw-pt-3 tw-text-base tw-font-medium tw-ring-1 tw-ring-inset tw-ring-iron-700 focus:tw-bg-iron-950 focus:tw-ring-2 focus:tw-ring-inset focus:tw-ring-primary-400 desktop-hover:hover:tw-ring-iron-650 sm:tw-text-sm"
          } tw-peer tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-text-white tw-caret-primary-300 tw-shadow-sm tw-transition-colors tw-duration-200 placeholder:tw-text-iron-500 focus:tw-outline-none ${inputClassName}`}
          placeholder={placeholder}
        />
        <svg
          className={`tw-pointer-events-none tw-absolute tw-left-3 tw-top-1/2 tw-size-5 -tw-translate-y-1/2 tw-text-iron-400 ${iconClassName}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"
          ></path>
        </svg>
        <label
          htmlFor={randomId}
          className={`tw-absolute tw-start-1 tw-top-2 tw-z-10 tw-ml-7 tw-origin-[0] -tw-translate-y-4 tw-scale-75 tw-transform tw-cursor-text tw-rounded-lg tw-bg-iron-900 tw-px-2 tw-text-md tw-font-medium tw-text-iron-500 tw-duration-300 peer-placeholder-shown:tw-top-1/2 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-scale-100 peer-focus:tw-top-2 peer-focus:-tw-translate-y-4 peer-focus:tw-scale-75 peer-focus:tw-bg-iron-900 peer-focus:tw-px-2 peer-focus:tw-text-primary-400 rtl:peer-focus:tw-left-auto rtl:peer-focus:tw-translate-x-1/4 ${
            hideLabel ? "tw-sr-only" : ""
          }`}
        >
          {label}
        </label>
      </div>
      <GroupCreateIdentitiesSearchItems
        open={isOpen}
        searchCriteria={searchCriteria}
        onSelect={onSelect}
        selectedWallets={selectedWallets}
        resultsLayout={resultsLayout}
        appearance={appearance}
        sort={sort}
      />
    </div>
  );
}
