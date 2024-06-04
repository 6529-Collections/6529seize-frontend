import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../services/api/common-api";
import CommonRepCategorySearchResults from "../../../utils/rep/CommonRepCategorySearchResults";
const MIN_SEARCH_LENGTH = 3;
export default function CreateWaveVotingRepCategory({
  category,
  setCategory,
}: {
  readonly category: string | null;
  readonly setCategory: (newV: string | null) => void;
}) {
  const [searchCriteria, setSearchCriteria] = useState<string | null>(category);
  const [debouncedValue, setDebouncedValue] = useState<string | null>(
    searchCriteria
  );
  useDebounce(
    () => {
      setDebouncedValue(searchCriteria);
    },
    200,
    [searchCriteria]
  );

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
    const results = data?.filter((item) => item !== debouncedValue) ?? [];
    if (debouncedValue?.length) {
      results.unshift(debouncedValue);
    }
    setCategories(results);
  }, [data, debouncedValue]);

  return (
    <div className="tw-relative" ref={wrapperRef}>
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
        ></path>
      </svg>
      <input
        type="text"
        value={searchCriteria ?? ""}
        onChange={(e) => onSearchCriteriaChange(e.target.value)}
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)}
        placeholder="Rep category"
        className="tw-form-input tw-block tw-w-full tw-text-base tw-rounded-lg tw-border-0 tw-appearance-none  tw-border-iron-600 focus:tw-border-blue-500 tw-peer tw-pl-11 tw-py-3 tw-pr-4 tw-bg-iron-900 hover:tw-bg-iron-800 focus:tw-bg-iron-900 tw-font-semibold tw-caret-primary-300 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-600 placeholder:tw-text-iron-500 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-inset focus:tw-ring-primary-400 tw-transition tw-duration-300 tw-ease-out"
      />
      <CommonRepCategorySearchResults
        open={isOpen}
        selected={category}
        categories={categories}
        onSelect={onValueChange}
      />
    </div>
  );
}
