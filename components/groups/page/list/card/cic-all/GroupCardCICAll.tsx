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
import { BulkRateRequest } from "../../../../../../generated/models/BulkRateRequest";
import { RateMatter } from "../../../../../../generated/models/RateMatter";
import { waitForMilliseconds } from "../../../../../../helpers/Helpers";

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

  const [givingCic, setGivingCic] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(true);

  useEffect(() => setLoading(isFetching || givingCic), [isFetching, givingCic]);
  useEffect(
    () =>
      setDisabled(typeof cicToGive !== "number" || !membersCount || loading),
    [cicToGive, membersCount, loading]
  );

  const getMembersPage = async (
    page: number
  ): Promise<Page<CommunityMemberOverview>> => {
    return await commonApiFetch<
      Page<CommunityMemberOverview>,
      CommunityMembersQuery
    >({
      endpoint: `community-members/top`,
      params: {
        page: page,
        page_size: 100,
        sort: CommunityMembersSortOption.LEVEL,
        sort_direction: SortDirection.DESC,
        group_id: group.id,
      },
    });
  };

  const giveCicToMembers = async (body: BulkRateRequest): Promise<void> => {
    await waitForMilliseconds(2000);
  };

  const [doneMembersCount, setDoneMembersCount] = useState<number>(0);

  const onSave = async (): Promise<void> => {
    if (disabled || typeof cicToGive !== "number") {
      return;
    }
    setGivingCic(true);
    let page = 1;

    let haveNextPage = true;
    while (haveNextPage) {
      const membersPage = await getMembersPage(page);
      haveNextPage = membersPage.next !== null;
      page++;
      if (!membersPage.data.length) {
        break;
      }
      const members = membersPage.data;
      await giveCicToMembers({
        matter: RateMatter.Cic,
        category: null,
        amount: cicToGive,
        target_wallet_addresses: members.map((m) => m.detail_view_key),
      });
      setDoneMembersCount((prev) => prev + members.length);
    }
    console.log("done");
    setGivingCic(false);
  };

  return (
    <GroupCardActionWrapper
      onCancel={onCancel}
      loading={loading}
      disabled={disabled}
      addingRates={givingCic}
      membersCount={membersCount}
      doneMembersCount={doneMembersCount}
      onSave={onSave}
    >
      <GroupCardCICAllInput cicToGive={cicToGive} setCicToGive={setCicToGive} />
      <GroupCardActionStats
        membersCount={membersCount}
        loadingMembersCount={isFetching}
      />
    </GroupCardActionWrapper>
  );
}
