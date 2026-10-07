"use client";

import { useContext, useEffect, useRef, useState } from "react";
import type { ApiCommunityMemberOverview } from "@/generated/models/ApiCommunityMemberOverview";
import type { ApiGroupFull } from "@/generated/models/ApiGroupFull";
import { AuthContext } from "@/components/auth/Auth";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "@/components/react-query-wrapper/ReactQueryWrapper";
import { CreditDirection } from "../GroupCard";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Page } from "@/helpers/Types";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import type { CommunityMembersQuery } from "@/app/network/page";
import { SortDirection } from "@/entities/ISort";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";

import GroupCardActionWrapper from "../GroupCardActionWrapper";
import { ApiRateMatter } from "@/generated/models/ApiRateMatter";
import type { GroupCardRateMatter } from "../GroupCard";
import GroupCardActionStats from "../utils/GroupCardActionStats";
import GroupCardVoteAllInputs from "./GroupCardVoteAllInputs";
import { ApiCommunityMembersSortOption } from "@/generated/models/ApiCommunityMembersSortOption";
import type { ApiBulkRateRequest } from "@/generated/models/ApiBulkRateRequest";
import type { ApiBulkRateResponse } from "@/generated/models/ApiBulkRateResponse";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import MobileWrapperDialog from "@/components/mobile-wrapper-dialog/MobileWrapperDialog";

export default function GroupCardVoteAll({
  matter,
  group,
  onCancel,
  viewerIdentityKey,
}: {
  readonly matter: GroupCardRateMatter;
  readonly group?: ApiGroupFull | undefined;
  readonly onCancel: () => void;
  readonly viewerIdentityKey: string | null;
}) {
  const locale = useBrowserLocale();
  const SUCCESS_LABEL: Record<GroupCardRateMatter, string> = {
    [ApiRateMatter.Cic]: t(locale, "network.groupInspection.bulkNicSuccess"),
    [ApiRateMatter.Rep]: t(locale, "network.groupInspection.bulkRepSuccess"),
  };

  // Ref to track if the component is mounted
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    return () => {
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
        viewerIdentityKey,
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
  });

  const membersCount = members?.count ?? null;

  const [doingRates, setDoingRates] = useState<boolean>(false);

  const loading = isFetching || doingRates;

  useEffect(() => {
    if (!doingRates) return;
    const preventUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    globalThis.addEventListener("beforeunload", preventUnload);
    return () => globalThis.removeEventListener("beforeunload", preventUnload);
  }, [doingRates]);

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

  const disabled = getIsDisabled();

  const bulkRateMutation = useMutation({
    mutationFn: async (body: ApiBulkRateRequest) =>
      await commonApiPost<ApiBulkRateRequest, ApiBulkRateResponse>({
        endpoint: `ratings`,
        body: body,
      }),
    onError: (error) => {
      setToast({
        type: "error",
        title: t(locale, "network.groupInspection.errorTitle"),
        description: t(locale, "network.groupInspection.errorDescription"),
        details: getToastErrorDetails(error),
      });
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
      let membersPage: Page<ApiCommunityMemberOverview>;
      try {
        membersPage = await getMembersPage(page);
      } catch (error) {
        setToast({
          type: "error",
          title: t(locale, "network.groupInspection.errorTitle"),
          description: t(locale, "network.groupInspection.errorDescription"),
          details: getToastErrorDetails(error),
        });
        setDoingRates(false);
        setDoneMembersCount(0);
        onIdentityBulkRate();
        onCancel();
        return;
      }
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
    <MobileWrapperDialog
      isOpen
      onClose={() => {
        if (!doingRates) onCancel();
      }}
      title={t(
        locale,
        matter === ApiRateMatter.Rep
          ? "network.groupInspection.bulkRep"
          : "network.groupInspection.bulkNic"
      )}
      tabletModal
      noPadding
      maxWidthClass="md:tw-max-w-md"
      headerVariant="minimal"
      headerClassName="tw-pb-5 tw-pt-4"
      headerCloseButtonClassName="!tw-size-11 focus-visible:!tw-ring-iron-300 desktop-hover:hover:!tw-text-iron-100"
      overlayClassName="tw-bg-iron-950/80"
      focusTitleOnOpen
      dismissible={!doingRates}
      preserveFocusOnEscape
    >
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
    </MobileWrapperDialog>
  );
}
