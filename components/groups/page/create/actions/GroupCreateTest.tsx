"use client";

import { useContext, useState } from "react";
import type { ApiCreateGroup } from "@/generated/models/ApiCreateGroup";
import CircleLoader from "@/components/distribution-plan-tool/common/CircleLoader";
import { AuthContext } from "@/components/auth/Auth";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { faUsers } from "@fortawesome/free-solid-svg-icons";
import { commonApiFetch } from "@/services/api/common-api";
import type { CommunityMembersQuery } from "@/app/network/page";
import { SortDirection } from "@/entities/ISort";
import type { Page } from "@/helpers/Types";
import type { CommunityMemberOverview } from "@/entities/IProfile";
import { CommunityMembersSortOption } from "@/enums";
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
    sort: CommunityMembersSortOption.LEVEL,
    sort_direction: SortDirection.DESC,
    group_id: undefined,
  });

  const { isFetching, data: members } = useQuery<Page<CommunityMemberOverview>>(
    {
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
          Page<CommunityMemberOverview>,
          CommunityMembersQuery
        >({
          endpoint: `community-members/top`,
          params: params,
        }),
      placeholderData: keepPreviousData,
      enabled: !!params.group_id,
    }
  );

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
          message: result.error,
          type: "error",
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
      <button
        type="button"
        disabled={disabled || isTesting}
        onClick={onTest}
        className={`${
          disabled
            ? "tw-opacity-70 tw-text-iron-500"
            : "tw-text-iron-400 hover:tw-bg-iron-800 hover:tw-text-iron-300"
        } tw-border tw-border-solid tw-border-iron-950 tw-ring-1 tw-ring-iron-700 tw-rounded-lg tw-bg-iron-950 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-shadow-sm hover:tw-border-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out`}>
        <div className="tw-flex tw-items-center tw-gap-x-3">
          {loading && <CircleLoader />}
          <span>Test</span>
        </div>
      </button>
      {!!members && (
        <div className="tw-self-center">
          <div className="tw-text-sm tw-flex tw-items-center tw-gap-x-2">
            <FontAwesomeIcon
              icon={faUsers}
              className="tw-size-5 tw-flex-shrink-0 tw-text-iron-300"
              aria-hidden="true"
            />
            <div className="tw-inline-flex tw-items-center tw-gap-x-1.5">
              <span className="tw-text-iron-400 tw-font-normal">
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
