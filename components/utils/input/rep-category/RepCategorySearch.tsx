"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";
import { commonApiFetch } from "@/services/api/common-api";
import RepCategorySearchDropdown from "./RepCategorySearchDropdown";
import { getRandomObjectId } from "@/helpers/AllowlistToolHelpers";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
export enum RepCategorySearchSize {
  SM = "SM",
  MD = "MD",
}

const MIN_SEARCH_LENGTH = 3;

export default function RepCategorySearch({
  category,
  size = RepCategorySearchSize.MD,
  disableInputCategoryAsValue = false,
  error = false,
  setCategory,
}: {
  readonly category: string | null;
  readonly size?: RepCategorySearchSize;
  readonly disableInputCategoryAsValue?: boolean;
  readonly error?: boolean;
  readonly setCategory: (category: string | null) => void;
}) {
  const randomId = getRandomObjectId();
  const INPUT_CLASSES: Record<RepCategorySearchSize, string> = {
    [RepCategorySearchSize.SM]: "tw-py-3 tw-text-sm",
    [RepCategorySearchSize.MD]: "tw-pb-3 tw-pt-3 tw-text-md",
  };

  const LABEL_CLASSES: Record<RepCategorySearchSize, string> = {
    [RepCategorySearchSize.SM]: "tw-text-sm",
    [RepCategorySearchSize.MD]: "tw-text-md",
  };

  const ICON_CLASSES: Record<RepCategorySearchSize, string> = {
    [RepCategorySearchSize.SM]: "tw-top-3",
    [RepCategorySearchSize.MD]: "tw-top-3.5",
  };

  const [searchCriteria, setSearchCriteria] = useState<string | null>(category);

  useEffect(() => {
    setSearchCriteria(category);
  }, [category]);

  const [debouncedValue, setDebouncedValue] = useState<string | null>(
    searchCriteria
  );
  useDebounce(() => setDebouncedValue(searchCriteria), 200, [searchCriteria]);

  const { data } = useQuery<string[]>({
    queryKey: [QueryKey.REP_CATEGORIES_SEARCH, debouncedValue],
    queryFn: async () =>
      await commonApiFetch<string[]>({
        endpoint: "/rep/categories",
        params: {
          param: debouncedValue ?? "",
        },
      }),
    enabled: !!debouncedValue && debouncedValue.length >= MIN_SEARCH_LENGTH,
  });

  const [isOpen, setIsOpen] = useState(false);
  const onValueChange = (newValue: string | null) => {
    setCategory(newValue);
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
      setCategory(null);
    }
  };

  const wrapperRef = useRef<HTMLDivElement>(null);
  useClickAway(wrapperRef, () => setIsOpen(false));
  useKeyPressEvent("Escape", () => setIsOpen(false));

  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    if (!debouncedValue) {
      setCategories([]);
      return;
    }
    if (debouncedValue.length < MIN_SEARCH_LENGTH) {
      setCategories([]);
      return;
    }

    if (disableInputCategoryAsValue) {
      setCategories(data ?? []);
      return;
    }
    if (!data?.length) {
      setCategories([debouncedValue]);
      return;
    }
    setCategories([
      debouncedValue,
      ...data.filter((i) => i !== debouncedValue),
    ]);
  }, [data, debouncedValue]);

  return (
    <div className="tw-relative tw-w-full" ref={wrapperRef}>
      <div className="tw-relative tw-group tw-w-full">
        <input
          type="text"
          value={searchCriteria ?? ""}
          onChange={(e) => onSearchCriteriaChange(e.target.value)}
          onFocus={() => onFocusChange(true)}
          onBlur={() => onFocusChange(false)}
          id={randomId}
          className={`${INPUT_CLASSES[size]} ${
            error
              ? "tw-ring-error focus:tw-border-error focus:tw-ring-error tw-caret-error"
              : "tw-ring-iron-700 focus:tw-border-blue-500 tw-caret-primary-400 focus:tw-ring-primary-400 hover:tw-ring-iron-650"
          } tw-form-input tw-block tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none ${
            searchCriteria
              ? "focus:tw-text-white tw-text-primary-400"
              : "tw-text-white"
          } tw-font-medium tw-border-iron-700 tw-peer tw-pl-10 tw-py-3 tw-pr-4 tw-bg-iron-900 focus:tw-bg-iron-900 tw-shadow-sm tw-ring-1 tw-ring-inset placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset tw-transition tw-duration-300 tw-ease-out`}
          placeholder=" "
        />
        <svg
          className="tw-text-iron-300 tw-pointer-events-none tw-absolute tw-left-3 tw-top-3.5 tw-h-5 tw-w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"></path>
        </svg>
        {!!category?.length && (
          <svg
            onClick={() => onValueChange(null)}
            aria-label="Clear category"
            className={`${ICON_CLASSES[size]} tw-cursor-pointer tw-absolute tw-right-3 tw-top-3.5 tw-h-5 tw-w-5 tw-text-iron-400 hover:tw-text-error tw-transition tw-duration-300 tw-ease-out`}
            viewBox="0 0 24 24"
            fill="none"
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
              ? "peer-focus:tw-text-error"
              : "peer-focus:tw-text-primary-400"
          } tw-text-iron-500 tw-rounded-lg tw-absolute tw-cursor-text tw-font-medium tw-duration-300 tw-transform -tw-translate-y-4 tw-scale-75 tw-top-2 tw-z-10 tw-origin-[0] tw-bg-iron-900 peer-focus:tw-bg-iron-900 tw-ml-7 tw-px-2 peer-focus:tw-px-2 peer-placeholder-shown:tw-scale-100 
      peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-top-1/2 peer-focus:tw-top-2 peer-focus:tw-scale-75 peer-focus:-tw-translate-y-4 rtl:peer-focus:tw-translate-x-1/4 rtl:peer-focus:tw-left-auto tw-start-1`}>
          Rep Category
        </label>
        <RepCategorySearchDropdown
          open={isOpen}
          selected={category}
          categories={categories}
          onSelect={onValueChange}
        />
      </div>

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
            Please enter rep cateogry
          </div>
        </div>
      )}
    </div>
  );
}
