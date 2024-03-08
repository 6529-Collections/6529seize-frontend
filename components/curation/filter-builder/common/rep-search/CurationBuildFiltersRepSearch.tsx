import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDebounce } from "react-use";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../../services/api/common-api";
import CommonInput from "../../../../utils/input/CommonInput";
import CurationBuildFiltersRepSearchDropdown from "./CurationBuildFiltersRepSearchDropdown";

const MIN_SEARCH_LENGTH = 3;

export default function CurationBuildFiltersRepSearch({
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
    200,
    [category]
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

  return (
    <div>
      <CommonInput
        inputType="text"
        placeholder="Rep Category"
        value={category ?? ""}
        onChange={setCategory}
        onFocusChange={(newV) => setIsOpen(newV)}
      />
      <CurationBuildFiltersRepSearchDropdown
        open={isOpen}
        selected={category}
        categories={data ?? []}
        onSelect={setCategory}
      />
    </div>
  );
}
