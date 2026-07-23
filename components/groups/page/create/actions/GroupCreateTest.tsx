"use client";

import { useContext, useState } from "react";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import { AuthContext } from "@/components/auth/Auth";
import Button from "@/components/utils/button/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { commonApiFetch } from "@/services/api/common-api";
import type { CommunityMembersQuery } from "@/app/network/page";
import { SortDirection } from "@/entities/ISort";
import type { Page } from "@/helpers/Types";
import type { ApiCommunityMemberOverview } from "@/generated/models/ApiCommunityMemberOverview";
import { ApiCommunityMembersSortOption } from "@/generated/models/ApiCommunityMembersSortOption";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useGroupMutations } from "@/hooks/groups/useGroupMutations";

export default function GroupCreateTest({
  groupConfig,
  disabled,
}: {
  readonly groupConfig: ApiCreateGroup;
  readonly disabled: boolean;
}) {
  const { requestAuth, setToast, connectedProfile } = useContext(AuthContext);
  const { runTest, isTesting } = useGroupMutations({
    requestAuth,
  });

  const [params, setParams] = useState<CommunityMembersQuery>({
    page: 1,
    page_size: 1,
    sort: ApiCommunityMembersSortOption.Level,
    sort_direction: SortDirection.DESC,
    group_id: undefined,
  });

  const { isFetching, data: members } = useQuery<
    Page<ApiCommunityMemberOverview>
  >({
    queryKey: [
      QueryKey.COMMUNITY_MEMBERS_TOP,
      {
        page: params.page,
        pageSize: params.page_size,
        sort: params.sort,
        sortDirection: params.sort_direction,
        groupId: params.group_id,
      },
    ],
    queryFn: async () =>
      await commonApiFetch<
        Page<ApiCommunityMemberOverview>,
        CommunityMembersQuery
      >({
        endpoint: `community-members/top`,
        params: params,
      }),
    placeholderData: keepPreviousData,
    enabled: !!params.group_id,
  });

  const onTest = async (): Promise<void> => {
    if (isTesting || disabled) {
      return;
    }
    setParams((prev: CommunityMembersQuery) => ({
      ...prev,
      group_id: undefined,
    }));

    const result = await runTest({
      payload: groupConfig,
      nameFallback: `${connectedProfile?.handle ?? "Group"} Test Run`,
    });

    if (!result.ok) {
      if (result.reason !== "auth") {
        setToast({
          type: "error",
          title: "Couldn't test this group.",
          description: "Please check the group setup and try again.",
          details: result.error,
        });
      }
      return;
    }

    setParams((prev: CommunityMembersQuery) => ({
      ...prev,
      group_id: result.group.id,
    }));
  };

  const loading = isFetching || isTesting;
  return (
    <div className="tw-flex tw-items-center tw-space-x-4">
      <Button
        disabled={disabled || isTesting}
        onClick={onTest}
        loading={loading}
        variant="tertiary"
        size="md"
      >
        Test
      </Button>
      {!!members && (
        <div className="tw-self-center">
          <div className="tw-flex tw-items-center tw-gap-x-2 tw-text-sm">
            <FontAwesomeIcon
              icon={faUsers}
              className="tw-size-5 tw-flex-shrink-0 tw-text-iron-300"
              aria-hidden="true"
            />
            <div className="tw-inline-flex tw-items-center tw-gap-x-1.5">
              <span className="tw-font-normal tw-text-iron-400">
                Members count:
              </span>
              <span className="tw-font-medium tw-text-primary-400">
                {members.count}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
