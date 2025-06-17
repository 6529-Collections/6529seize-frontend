"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";
import { CommunityMemberMinimal } from "../../../../entities/IProfile";
import { commonApiFetch } from "../../../../services/api/common-api";
import CommonProfileSearchItems from "../profile-search/CommonProfileSearchItems";
import { getRandomObjectId } from "../../../../helpers/AllowlistToolHelpers";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
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
  setIdentity,
}: {
  readonly identity: string | null;
  readonly size?: IdentitySearchSize;
  readonly error?: boolean;
  readonly label?: string;

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

  const randomId = getRandomObjectId();

  useEffect(() => setSearchCriteria(identity), [identity]);

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

  const [isOpen, setIsOpen] = useState(false);
  const onValueChange = (newValue: string | null) => {
    setIdentity(newValue);
    setSearchCriteria(newValue);
    setIsOpen(false);
  };

  const onFocusChange = (newV: boolean) => {
    if (newV) {
      setIsOpen(true);
    }
  };

  const onSearchCriteriaChange = (newV: string | null) => {
    setSearchCriteria(newV);
    if (!newV) {
      setIdentity(null);
    }
  };

  const wrapperRef = useRef<HTMLDivElement>(null);
  useClickAway(wrapperRef, () => setIsOpen(false));
  useKeyPressEvent("Escape", () => setIsOpen(false));
  return (
    <div className="tw-group tw-w-full tw-relative" ref={wrapperRef}>
      <input
        type="text"
        value={searchCriteria ?? ""}
        onChange={(e) => onSearchCriteriaChange(e.target.value)}
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)}
        id={randomId}
        autoComplete="off"
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
      <svg
        className={`${ICON_CLASSES[size]} tw-text-iron-300 tw-pointer-events-none tw-absolute tw-left-3 tw-h-5 tw-w-5`}
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
          clipRule="evenodd"></path>
      </svg>
      {!!identity?.length && (
        <svg
          onClick={() => onValueChange(null)}
          className={`${ICON_CLASSES[size]} tw-cursor-pointer tw-absolute tw-right-3 tw-h-5 tw-w-5 tw-text-iron-400 hover:tw-text-error tw-transition tw-duration-300 tw-ease-out`}
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          aria-label="Clear identity"
          xmlns="http://www.w3.org/2000/svg">
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
        htmlFor={randomId}
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
        onProfileSelect={(profile) =>
          onValueChange(profile?.handle ?? profile?.wallet ?? null)
        }
      />
      {error && (
        <div className="tw-pt-1.5 tw-relative tw-flex tw-items-center tw-gap-x-2">
          <svg
            className="tw-size-5 tw-flex-shrink-0 tw-text-error"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="tw-text-error tw-text-xs tw-font-medium">
            Please enter identity
          </div>
        </div>
      )}
    </div>
  );
}
