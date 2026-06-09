"use client";

import { type FocusEvent, useRef, useState } from "react";
import { useClickAway, useKeyPressEvent } from "react-use";
import GroupCreateIdentitiesSearchItems, {
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
}: {
  readonly selectedWallets: string[];
  readonly onIdentitySelect: (identity: CommunityMemberMinimal) => void;
  readonly placeholder?: string | undefined;
  readonly label?: string | undefined;
  readonly hideLabel?: boolean | undefined;
  readonly inputClassName?: string | undefined;
  readonly iconClassName?: string | undefined;
  readonly resultsLayout?: GroupCreateIdentitiesSearchResultsLayout | undefined;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const onFocusChange = (newV: boolean) => {
    if (newV) {
      setIsOpen(true);
    }
  };

  const [searchCriteria, setSearchCriteria] = useState<string | null>(null);

  const onSearchCriteriaChange = (newV: string | null) => {
    setSearchCriteria(newV);
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
      <input
        type="text"
        value={searchCriteria ?? ""}
        onChange={(e) => onSearchCriteriaChange(e.target.value)}
        onFocus={() => onFocusChange(true)}
        id={randomId}
        className={`tw-peer tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-border-iron-700 tw-bg-iron-950 tw-pb-3 tw-pl-10 tw-pr-4 tw-pt-3 tw-text-base tw-font-medium tw-text-white tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-700 tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 hover:tw-ring-iron-650 focus:tw-border-blue-500 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 sm:tw-text-sm ${inputClassName}`}
        placeholder={placeholder}
      />
      <svg
        className={`tw-pointer-events-none tw-absolute tw-left-3 tw-top-3.5 tw-h-5 tw-w-5 tw-text-iron-300 ${iconClassName}`}
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
      <GroupCreateIdentitiesSearchItems
        open={isOpen}
        searchCriteria={searchCriteria}
        onSelect={onSelect}
        selectedWallets={selectedWallets}
        resultsLayout={resultsLayout}
      />
    </div>
  );
}
