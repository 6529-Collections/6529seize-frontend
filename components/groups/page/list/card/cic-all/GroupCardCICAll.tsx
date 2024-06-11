import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { GroupFull } from "../../../../../../generated/models/GroupFull";
import GroupCardActionStats from "../utils/GroupCardActionStats";

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
import { Page } from "../../../../../../helpers/Types";
import { useContext, useEffect, useState } from "react";
import GroupCardActionWrapper from "../GroupCardActionWrapper";
import { BulkRateRequest } from "../../../../../../generated/models/BulkRateRequest";
import { RateMatter } from "../../../../../../generated/models/RateMatter";
import { BulkRateResponse } from "../../../../../../generated/models/BulkRateResponse";
import { AuthContext } from "../../../../../auth/Auth";
import GroupCardActionNumberInput from "../utils/GroupCardActionNumberInput";

export default function GroupCardCICAll({
  group,
  onCancel,
}: {
  readonly group: GroupFull;
  readonly onCancel: () => void;
}) {
  const matter = RateMatter.Cic;
  const category = null;
  const { onIdentityBulkRate } = useContext(ReactQueryWrapperContext);
  const { setToast, requestAuth } = useContext(AuthContext);
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
      setDisabled(typeof amountToGive !== "number" || !membersCount || loading),
    [amountToGive, membersCount, loading]
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
      message: "CIC distributed.",
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
      <div className="tw-w-full xl:tw-max-w-[17.156rem]">
        <GroupCardActionNumberInput
          label="CIC"
          componentId={`${group.id}_cic`}
          amount={amountToGive}
          setAmount={setAmountToGive}
        />
      </div>
      <GroupCardActionStats
        matter={matter}
        membersCount={membersCount}
        loadingMembersCount={isFetching}
      />
    </GroupCardActionWrapper>
  );
}
