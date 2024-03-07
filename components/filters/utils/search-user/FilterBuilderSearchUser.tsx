import { useEffect, useState } from "react";
import CommonInput from "../../../utils/input/CommonInput";
import { useDebounce } from "react-use";
import { useQuery } from "@tanstack/react-query";
import { CommunityMemberMinimal } from "../../../../entities/IProfile";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../../services/api/common-api";
import FilterBuilderSearchUserDropdown from "./FilterBuilderSearchUserDropdown";

const MIN_SEARCH_LENGTH = 3;

export default function FilterBuilderSearchUser({
  user,
  label,
  setUser,
}: {
  readonly user: string | null;
  readonly label: string;
  readonly setUser: (newV: string | null) => void;
}) {
  const [debouncedValue, setDebouncedValue] = useState<string | null>(user);
  useDebounce(
    () => {
      setDebouncedValue(user);
    },
    500,
    [user]
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
  const [profiles, setProfiles] = useState<CommunityMemberMinimal[]>([]);
  useEffect(() => setProfiles(data ?? []), [data]);

  return (
    <div>
      <CommonInput
        inputType="text"
        placeholder={label}
        value={user ?? ""}
        onChange={setUser}
        onFocusChange={(newV) => setIsOpen(newV)}
      />
      <FilterBuilderSearchUserDropdown
        open={isOpen}
        selected={user}
        profiles={profiles}
        onSelect={setUser}
      />
    </div>
  );
}
