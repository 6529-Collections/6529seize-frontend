import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { GroupFull } from "../../../../../../generated/models/GroupFull";
import GroupCardActionStats from "../utils/GroupCardActionStats";
import GroupCardCICAllInput from "./GroupCardCICAllInput";
import { CommunityMemberOverview } from "../../../../../../entities/IProfile";
import { QueryKey } from "../../../../../react-query-wrapper/ReactQueryWrapper";
import {
  CommunityMembersQuery,
  CommunityMembersSortOption,
} from "../../../../../../pages/community";
import { SortDirection } from "../../../../../../entities/ISort";
import { commonApiFetch } from "../../../../../../services/api/common-api";
import { Page } from "../../../../../../helpers/Types";
import { useEffect, useState } from "react";
import GroupCardActionWrapper from "../GroupCardActionWrapper";

export default function GroupCardCICAll({
  group,
  onCancel,
}: {
  readonly group: GroupFull;
  readonly onCancel: () => void;
}) {
  const [cicToGive, setCicToGive] = useState<number | null>(null);
  const { data: members, isFetching } = useQuery<Page<CommunityMemberOverview>>(
    {
      queryKey: [
        QueryKey.COMMUNITY_MEMBERS_TOP,
        {
          page: 1,
          pageSize: 1,
          sort: CommunityMembersSortOption.LEVEL,
          sortDirection: SortDirection.DESC,
          groupId: group.id,
        },
      ],
      queryFn: async () =>
        await commonApiFetch<
          Page<CommunityMemberOverview>,
          CommunityMembersQuery
        >({
          endpoint: `community-members/top`,
          params: {
            page: 1,
            page_size: 1,
            sort: CommunityMembersSortOption.LEVEL,
            sort_direction: SortDirection.DESC,
            group_id: group.id,
          },
        }),
      placeholderData: keepPreviousData,
    }
  );

  const [membersCount, setMembersCount] = useState<number | null>(null);
  useEffect(() => {
    if (members) {
      setMembersCount(members.count);
    } else {
      setMembersCount(null);
    }
  }, [members]);
  return (
    <GroupCardActionWrapper
      onCancel={onCancel}
      loading={false}
      disabled={typeof cicToGive !== "number" || !membersCount}
      onSave={() => {}}
    >
      <GroupCardCICAllInput cicToGive={cicToGive} setCicToGive={setCicToGive} />
      <GroupCardActionStats
        membersCount={membersCount}
        loadingMembersCount={isFetching}
      />
    </GroupCardActionWrapper>
  );
}
