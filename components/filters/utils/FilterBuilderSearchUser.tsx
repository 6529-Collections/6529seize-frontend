import { useState } from "react";
import CommonInput from "../../utils/input/CommonInput";
import { useDebounce } from "react-use";
import { useQuery } from "@tanstack/react-query";
import { CommunityMemberMinimal } from "../../../entities/IProfile";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";

const MIN_SEARCH_LENGTH = 3;

export default function FilterBuilderSearchUser() {
  const [user, setUser] = useState<string | null>(null);
  const [debouncedValue, setDebouncedValue] = useState<string | null>(user);
  useDebounce(
    () => {
      setDebouncedValue(user);
    },
    500,
    [user]
  );

  const { isFetching, data: profiles } = useQuery<CommunityMemberMinimal[]>({
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

  return (
    <div>
      <CommonInput
        inputType="text"
        placeholder="User"
        value={user ?? ""}
        onChange={setUser}
      />
    </div>
  );
}
