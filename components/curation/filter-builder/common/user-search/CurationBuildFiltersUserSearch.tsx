import { useQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useClickAway, useDebounce, useKeyPressEvent } from "react-use";
import { CommunityMemberMinimal } from "../../../../../entities/IProfile";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../../services/api/common-api";
import CommonInput from "../../../../utils/input/CommonInput";
import CurationBuildFiltersUserSearchDropdown from "./CurationBuildFiltersUserSearchDropdown";

const MIN_SEARCH_LENGTH = 3;

export default function CurationBuildFiltersUserSearch({
  value,
  placeholder,
  setValue,
}: {
  readonly value: string | null;
  readonly placeholder: string;
  readonly setValue: (value: string | null) => void;
}) {
  const [searchCriteria, setSearchCriteria] = useState<string | null>(value);

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
    setValue(newValue);
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
      setValue(null);
    }
  };

  const wrapperRef = useRef<HTMLDivElement>(null);
  useClickAway(wrapperRef, () => setIsOpen(false));
  useKeyPressEvent("Escape", () => setIsOpen(false));

  return (
    <div ref={wrapperRef}>
      <CommonInput
        inputType="text"
        placeholder={placeholder}
        value={searchCriteria ?? ""}
        showSearchIcon={true}
        onChange={onSearchCriteriaChange}
        onFocusChange={onFocusChange}
      />
      <CurationBuildFiltersUserSearchDropdown
        open={isOpen}
        selected={value}
        profiles={data ?? []}
        onSelect={onValueChange}
      />
    </div>
  );
}
