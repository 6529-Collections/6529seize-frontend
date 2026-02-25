"use client";

import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { useContext, useEffect, useRef, useState } from "react";

import type { CommunityMembersQuery } from "@/app/network/page";
import { AuthContext } from "@/components/auth/Auth";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import { SortDirection } from "@/entities/ISort";
import type { ApiBulkRateRequest } from "@/generated/models/ApiBulkRateRequest";
import type { ApiBulkRateResponse } from "@/generated/models/ApiBulkRateResponse";
import type { ApiCommunityMemberOverview } from "@/generated/models/ApiCommunityMemberOverview";
import { ApiCommunityMembersSortOption } from "@/generated/models/ApiCommunityMembersSortOption";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { ApiRateMatter } from "@/generated/models/ApiRateMatter";
import type { Page } from "@/helpers/Types";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";

import { CreditDirection } from "../GroupCard";
import GroupCardActionWrapper from "../GroupCardActionWrapper";
import GroupCardActionStats from "../utils/GroupCardActionStats";

import GroupCardVoteAllInputs from "./GroupCardVoteAllInputs";


export default function GroupCardVoteAll({
  matter,
  group,
  onCancel,
}: {
  readonly matter: ApiRateMatter;
  readonly group?: ApiGroupFull | undefined;
  readonly onCancel: () => void;
}) {
  const SUCCESS_LABEL: Record<ApiRateMatter, string> = {
    [ApiRateMatter.Cic]: "NIC distributed.",
    [ApiRateMatter.Rep]: "Rep distributed.",
  };

  // Ref to track if the component is mounted
  const isMounted = useRef(true);

  useEffect(() => {
    // Component did mount logic

    return () => {
      // Component will unmount logic
      isMounted.current = false;
    };
  }, []);

  const [category, setCategory] = useState<string | null>(null);
  const { setToast, requestAuth } = useContext(AuthContext);
  const { onIdentityBulkRate } = useContext(ReactQueryWrapperContext);
  const [amountToAdd, setAmountToAdd] = useState<number | null>(null);
  const [creditDirection, setCreditDirection] = useState<CreditDirection>(
    CreditDirection.ADD
  );

  const { data: members, isFetching } = useQuery<
    Page<ApiCommunityMemberOverview>
  >({
    queryKey: [
      QueryKey.COMMUNITY_MEMBERS_TOP,
      {
        page: 1,
        pageSize: 1,
        sort: ApiCommunityMembersSortOption.Level,
        sortDirection: SortDirection.DESC,
        groupId: group?.id ?? null,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<
        Page<ApiCommunityMemberOverview>,
        CommunityMembersQuery
      >({
        endpoint: `community-members/top`,
        params: {
          page: 1,
          page_size: 1,
          sort: ApiCommunityMembersSortOption.Level,
          sort_direction: SortDirection.DESC,
          group_id: group?.id,
        },
      }),
    placeholderData: keepPreviousData,
  });

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

  const getIsDisabled = (): boolean => {
    if (typeof amountToAdd !== "number") {
      return true;
    }

    if (!membersCount) {
      return true;
    }

    if (loading) {
      return true;
    }

    if (matter === ApiRateMatter.Rep && !category) {
      return true;
    }
    return false;
  };

  const [disabled, setDisabled] = useState<boolean>(getIsDisabled());

  useEffect(
    () => setLoading(isFetching || doingRates),
    [isFetching, doingRates]
  );
  useEffect(
    () => setDisabled(getIsDisabled()),
    [amountToAdd, membersCount, loading, category]
  );

  const bulkRateMutation = useMutation({
    mutationFn: async (body: ApiBulkRateRequest) =>
      await commonApiPost<ApiBulkRateRequest, ApiBulkRateResponse>({
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
  ): Promise<Page<ApiCommunityMemberOverview>> => {
    return await commonApiFetch<
      Page<ApiCommunityMemberOverview>,
      CommunityMembersQuery
    >({
      endpoint: `community-members/top`,
      params: {
        page: page,
        page_size: 100,
        sort: ApiCommunityMembersSortOption.Level,
        sort_direction: SortDirection.DESC,
        group_id: group?.id,
      },
    });
  };

  const [doneMembersCount, setDoneMembersCount] = useState<number>(0);

  const onSave = async (): Promise<void> => {
    if (disabled || typeof amountToAdd !== "number") {
      return;
    }
    const { success } = await requestAuth();
    if (!success) {
      return;
    }
    setDoingRates(true);
    let page = 1;

    let haveNextPage = true;
    while (haveNextPage && isMounted.current) {
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
          amount_to_add:
            creditDirection === CreditDirection.ADD
              ? amountToAdd
              : -amountToAdd,
          target_wallet_addresses: members.map((m) => m.wallet.toLowerCase()),
        });
        setDoneMembersCount((prev) => prev + members.length);
      } catch {
        setDoingRates(false);
        setDoneMembersCount(0);
        onIdentityBulkRate();
        onCancel();
        return;
      }
    }
    if (!isMounted.current) return;
    setToast({
      message: SUCCESS_LABEL[matter],
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
      matter={matter}
      onSave={onSave}
    >
      {group && (
        <GroupCardVoteAllInputs
          matter={matter}
          category={category}
          setCategory={setCategory}
          group={group}
          amountToAdd={amountToAdd}
          creditDirection={creditDirection}
          setCreditDirection={setCreditDirection}
          setAmountToAdd={setAmountToAdd}
        />
      )}
      <GroupCardActionStats
        matter={matter}
        membersCount={membersCount}
        loadingMembersCount={isFetching}
      />
    </GroupCardActionWrapper>
  );
}
