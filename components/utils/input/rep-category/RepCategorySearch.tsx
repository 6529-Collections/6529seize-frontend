"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";
import { commonApiFetch } from "@/services/api/common-api";
import RepCategorySearchDropdown from "./RepCategorySearchDropdown";
import { getRandomObjectId } from "@/helpers/AllowlistToolHelpers";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { isHelpBotCreditRepCategory } from "./repCategoryConstants";
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
  hideDefaultError = false,
  inputClassName,
  labelClassName,
  setCategory,
}: {
  readonly category: string | null;
  readonly size?: RepCategorySearchSize | undefined;
  readonly disableInputCategoryAsValue?: boolean | undefined;
  readonly error?: boolean | undefined;
  readonly inputClassName?: string | undefined;
  readonly labelClassName?: string | undefined;
  /**
   * Keep the error styling (ring/caret) but suppress the built-in message,
   * for callers that render their own — e.g. the create-wave outcome field
   * that names the exact broken category rule.
   */
  readonly hideDefaultError?: boolean | undefined;
  readonly setCategory: (category: string | null) => void;
}) {
  const randomId = getRandomObjectId();
  const INPUT_CLASSES: Record<RepCategorySearchSize, string> = {
    [RepCategorySearchSize.SM]: "tw-py-3",
    [RepCategorySearchSize.MD]: "tw-pb-3 tw-pt-3",
  };

  const LABEL_CLASSES: Record<RepCategorySearchSize, string> = {
    [RepCategorySearchSize.SM]: "tw-text-sm",
    [RepCategorySearchSize.MD]: "tw-text-md",
  };

  const [isOpen, setIsOpen] = useState(false);
  const [draftCriteria, setDraftCriteria] = useState<string | null | undefined>(
    undefined
  );
  const searchCriteria = draftCriteria === undefined ? category : draftCriteria;

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

  const onValueChange = (newValue: string | null) => {
    setCategory(newValue);
    setDraftCriteria(undefined);
    setIsOpen(false);
  };

  const onFocus = () => {
    setDraftCriteria((current) => (current === undefined ? category : current));
    setIsOpen(true);
  };

  const onSearchCriteriaChange = (newV: string | null) => {
    setDraftCriteria(newV);
    if (!newV) {
      setCategory(null);
    }
  };

  const wrapperRef = useRef<HTMLDivElement>(null);
  useClickAway(wrapperRef, () => setIsOpen(false));
  useKeyPressEvent("Escape", () => setIsOpen(false));

  const categories = useMemo(() => {
    if (!debouncedValue) {
      return [];
    }
    if (debouncedValue.length < MIN_SEARCH_LENGTH) {
      return [];
    }

    if (disableInputCategoryAsValue) {
      return (data ?? []).filter((item) => !isHelpBotCreditRepCategory(item));
    }
    if (isHelpBotCreditRepCategory(debouncedValue)) {
      return [];
    }
    if (!data?.length) {
      return [debouncedValue];
    }
    return [
      debouncedValue,
      ...data.filter(
        (i) => i !== debouncedValue && !isHelpBotCreditRepCategory(i)
      ),
    ];
  }, [data, debouncedValue, disableInputCategoryAsValue]);

  return (
    <div
      className="tw-relative tw-w-full"
      ref={wrapperRef}
      onBlur={(event) => {
        if (
          event.relatedTarget instanceof Node &&
          event.currentTarget.contains(event.relatedTarget)
        ) {
          return;
        }
        setIsOpen(false);
      }}
    >
      <div className="tw-group tw-relative tw-w-full">
        <input
          type="text"
          value={searchCriteria ?? ""}
          onChange={(e) => onSearchCriteriaChange(e.target.value)}
          onFocus={onFocus}
          id={randomId}
          aria-invalid={error || undefined}
          className={`${INPUT_CLASSES[size]} ${
            error
              ? "tw-caret-error tw-ring-error focus:tw-border-error focus:tw-ring-error"
              : "tw-caret-primary-400 tw-ring-iron-700 hover:tw-ring-iron-650 focus:tw-border-blue-500 focus:tw-ring-primary-400"
          } tw-form-input tw-block tw-w-full tw-appearance-none tw-rounded-lg tw-border-0 tw-text-base sm:tw-text-sm ${
            searchCriteria
              ? "tw-text-primary-400 focus:tw-text-white"
              : "tw-text-white"
          } tw-peer tw-border-iron-700 tw-bg-iron-900 tw-py-3 tw-pl-10 tw-pr-4 tw-font-medium tw-shadow-sm tw-ring-1 tw-ring-inset tw-transition tw-duration-300 tw-ease-out placeholder:tw-text-iron-500 focus:tw-bg-iron-900 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset ${inputClassName ?? ""}`}
          placeholder=" "
        />
        <svg
          className="tw-pointer-events-none tw-absolute tw-left-3 tw-top-1/2 tw-h-5 tw-w-5 -tw-translate-y-1/2 tw-text-iron-300"
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
        {!!category?.length && (
          <button
            type="button"
            onClick={() => onValueChange(null)}
            aria-label="Clear category"
            className="tw-absolute tw-right-3 tw-top-1/2 tw-flex tw-h-5 tw-w-5 -tw-translate-y-1/2 tw-cursor-pointer tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-400 tw-transition tw-duration-300 tw-ease-out hover:tw-text-error focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
          >
            <svg
              className="tw-h-5 tw-w-5"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M17 7L7 17M7 7L17 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        <label
          htmlFor={randomId}
          className={`${LABEL_CLASSES[size]} ${
            error
              ? "peer-focus:tw-text-error"
              : "peer-focus:tw-text-primary-400"
          } tw-absolute tw-start-1 tw-top-2 tw-z-10 tw-ml-7 tw-origin-[0] -tw-translate-y-4 tw-scale-75 tw-transform tw-cursor-text tw-rounded-lg tw-bg-iron-900 tw-px-2 tw-font-medium tw-text-iron-500 tw-duration-300 peer-placeholder-shown:tw-top-1/2 peer-placeholder-shown:-tw-translate-y-1/2 peer-placeholder-shown:tw-scale-100 peer-focus:tw-top-2 peer-focus:-tw-translate-y-4 peer-focus:tw-scale-75 peer-focus:tw-bg-iron-900 peer-focus:tw-px-2 rtl:peer-focus:tw-left-auto rtl:peer-focus:tw-translate-x-1/4 ${labelClassName ?? ""}`}
        >
          Rep Category
        </label>
        <RepCategorySearchDropdown
          open={isOpen}
          selected={category}
          categories={categories}
          onSelect={onValueChange}
        />
      </div>

      {error && !hideDefaultError && (
        <div className="tw-relative tw-flex tw-items-center tw-gap-x-2 tw-pt-1.5">
          <svg
            className="tw-size-5 tw-flex-shrink-0 tw-text-error"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div className="tw-text-xs tw-font-medium tw-text-error">
            Please enter rep category
          </div>
        </div>
      )}
    </div>
  );
}
