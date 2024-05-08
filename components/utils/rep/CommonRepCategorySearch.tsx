import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import CommonInput from "../input/CommonInput";
import CommonRepCategorySearchResults from "./CommonRepCategorySearchResults";

const MIN_SEARCH_LENGTH = 3;
export default function CommonRepCategorySearch({
  category,
  setCategory,
  disabledCategories = [],
}: {
  readonly category: string | null;
  readonly setCategory: (newV: string | null) => void;
  readonly disabledCategories?: string[];
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

  return (
    <div ref={wrapperRef}>
      <CommonInput
        inputType="text"
        placeholder="Rep Category"
        value={searchCriteria ?? ""}
        showSearchIcon={true}
        onChange={onSearchCriteriaChange}
        onFocusChange={onFocusChange}
      />
      <CommonRepCategorySearchResults
        open={isOpen}
        selected={category}
        categories={data ?? []}
        disabledCategories={disabledCategories}
        onSelect={onValueChange}
      />
    </div>
  );
}
