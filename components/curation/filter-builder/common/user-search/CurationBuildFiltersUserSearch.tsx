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

  const onValueChange = (newValue: string | null) => {
    setValue(newValue);
    setIsOpen(false);
  };

  const onFocusChange = (newV: boolean) => {
    if (newV) {
      setIsOpen(true);
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
        value={value ?? ""}
        showSearchIcon={true}
        onChange={setValue}
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
