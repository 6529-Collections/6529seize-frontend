import { useContext, useEffect, useState } from "react";
import { GroupFull } from "../../../../../../generated/models/GroupFull";
import RepCategorySearch, {
  RepCategorySearchSize,
} from "../../../../../utils/input/rep-category/RepCategorySearch";
import GroupCardActionFooter from "../utils/GroupCardActionFooter";
import GroupCardActionStats from "../utils/GroupCardActionStats";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { Page } from "../../../../../../helpers/Types";
import { CommunityMemberOverview } from "../../../../../../entities/IProfile";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "../../../../../react-query-wrapper/ReactQueryWrapper";
import {
  CommunityMembersQuery,
  CommunityMembersSortOption,
} from "../../../../../../pages/community";
import { SortDirection } from "../../../../../../entities/ISort";
import {
  commonApiFetch,
  commonApiPost,
} from "../../../../../../services/api/common-api";
import GroupCardActionWrapper from "../GroupCardActionWrapper";
import { RateMatter } from "../../../../../../generated/models/RateMatter";
import { AuthContext } from "../../../../../auth/Auth";
import GroupCardRepAllInputs from "./GroupCardRepAllInputs";
import { BulkRateRequest } from "../../../../../../generated/models/BulkRateRequest";
import { BulkRateResponse } from "../../../../../../generated/models/BulkRateResponse";

export default function GroupCardRepAll({
  group,
  onCancel,
}: {
  readonly group: GroupFull;
  readonly onCancel: () => void;
}) {
  const matter = RateMatter.Rep;
  const [category, setCategory] = useState<string | null>(null);
  const { setToast, requestAuth } = useContext(AuthContext);
  const { onIdentityBulkRate } = useContext(ReactQueryWrapperContext);
  const [amountToGive, setAmountToGive] = useState<number | null>(null);
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

  const [doingRates, setDoingRates] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(true);

  useEffect(
    () => setLoading(isFetching || doingRates),
    [isFetching, doingRates]
  );
  useEffect(
    () =>
      setDisabled(
        typeof amountToGive !== "number" ||
          !membersCount ||
          loading ||
          !category
      ),
    [amountToGive, membersCount, loading, category]
  );

  const bulkRateMutation = useMutation({
    mutationFn: async (body: BulkRateRequest) =>
      await commonApiPost<BulkRateRequest, BulkRateResponse>({
        endpoint: `ratings`,
        body: body,
      }),
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
      throw error;
    },
  });

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

  const [doneMembersCount, setDoneMembersCount] = useState<number>(0);

  const onSave = async (): Promise<void> => {
    if (disabled || typeof amountToGive !== "number") {
      return;
    }
    const { success } = await requestAuth();
    if (!success) {
      return;
    }
    setDoingRates(true);
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
      try {
        await bulkRateMutation.mutateAsync({
          matter,
          category,
          amount: amountToGive,
          target_wallet_addresses: members.map((m) => m.wallet.toLowerCase()),
        });
        setDoneMembersCount((prev) => prev + members.length);
      } catch {
        haveNextPage = false;
        setDoingRates(false);
        setDoneMembersCount(0);
        onIdentityBulkRate();
        onCancel();

        return;
      }
    }
    setToast({
      message: "Rep distributed.",
      type: "success",
    });
    setDoingRates(false);
    setDoneMembersCount(0);
    onIdentityBulkRate();
    onCancel();
  };
  return (
    <GroupCardActionWrapper
      onCancel={onCancel}
      loading={loading}
      disabled={disabled}
      addingRates={doingRates}
      membersCount={membersCount}
      doneMembersCount={doneMembersCount}
      onSave={onSave}
    >
      <GroupCardRepAllInputs
        category={category}
        setCategory={setCategory}
        group={group}
        amountToGive={amountToGive}
        setAmountToGive={setAmountToGive}
      />
      <GroupCardActionStats
        matter={matter}
        membersCount={membersCount}
        loadingMembersCount={isFetching}
      />
    </GroupCardActionWrapper>
  );
}
