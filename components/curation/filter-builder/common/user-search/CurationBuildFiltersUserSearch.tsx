import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDebounce } from "react-use";
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
  const [debouncedValue, setDebouncedValue] = useState<string | null>(value);
  useDebounce(
    () => {
      setDebouncedValue(value);
    },
    200,
    [value]
  );

  const { data } = useQuery<CommunityMemberMinimal[]>({
    queryKey: [QueryKey.PROFILE_SEARCH, debouncedValue],
    queryFn: async () =>
      await commonApiFetch<CommunityMemberMinimal[]>({
        endpoint: "community-members",
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
        placeholder={placeholder}
        value={value ?? ""}
        onChange={setValue}
        onFocusChange={(newV) => setIsOpen(newV)}
      />
      <CurationBuildFiltersUserSearchDropdown
        open={isOpen}
        selected={value}
        profiles={data ?? []}
        onSelect={setValue}
      />
    </div>
  );
}
