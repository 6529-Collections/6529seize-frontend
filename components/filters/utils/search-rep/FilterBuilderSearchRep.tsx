import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useDebounce } from "react-use";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../services/api/common-api";
import CommonInput from "../../../utils/input/CommonInput";
import FilterBuilderSearchRepDropdown from "./FilterBuilderSearchRepDropdown";

const MIN_SEARCH_LENGTH = 3;

export default function FilterBuilderSearchRep({
  category,
  setCategory,
}: {
  readonly category: string | null;
  readonly setCategory: (newV: string | null) => void;
}) {
  const [debouncedValue, setDebouncedValue] = useState<string | null>(category);
  useDebounce(
    () => {
      setDebouncedValue(category);
    },
    500,
    [category]
  );

  const { isFetching, data } = useQuery<string[]>({
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
  const [categories, setCategories] = useState<string[]>([]);
  useEffect(() => setCategories(data ?? []), [data]);

  return (
    <div>
      <CommonInput
        inputType="text"
        placeholder="Rep Category"
        value={category ?? ""}
        onChange={setCategory}
        onFocusChange={(newV) => setIsOpen(newV)}
      />
      <FilterBuilderSearchRepDropdown
        open={isOpen}
        selected={category}
        categories={categories}
        onSelect={setCategory}
      />
    </div>
  );
}
