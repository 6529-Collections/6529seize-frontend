import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useDebounce } from "react-use";
import { CommunityMemberMinimal } from "../../../entities/IProfile";
import { commonApiFetch } from "../../../services/api/common-api";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import CurationBuildFiltersUserSearchDropdown from "../../curation/filter-builder/common/user-search/CurationBuildFiltersUserSearchDropdown";

const MIN_SEARCH_LENGTH = 3;

export default function UserPageDropsSearchUser({
  handleOrWallet,
  onUserSelect,
}: {
  readonly handleOrWallet: string;
  readonly onUserSelect: (user: string) => void;
}) {
  const [debouncedValue, setDebouncedValue] = useState<string | null>(
    handleOrWallet
  );
  useDebounce(
    () => {
      setDebouncedValue(handleOrWallet);
    },
    200,
    [handleOrWallet]
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

  const onValueChange = (newValue: string | null) => {
    onUserSelect(newValue ?? "");
  };

  return (
    <div className="tw-bg-black tw-text-white">
      <CurationBuildFiltersUserSearchDropdown
        open={true}
        selected={null}
        profiles={data ?? []}
        onSelect={onValueChange}
      />
    </div>
  );
}
