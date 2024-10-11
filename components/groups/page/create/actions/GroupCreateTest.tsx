import { useContext, useEffect, useState } from "react";
import { ApiCreateGroup } from "../../../../../generated/models/ApiCreateGroup";
import CircleLoader from "../../../../distribution-plan-tool/common/CircleLoader";
import { AuthContext } from "../../../../auth/Auth";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import {
  commonApiFetch,
  commonApiPost,
} from "../../../../../services/api/common-api";
import { ApiGroupFull } from "../../../../../generated/models/ApiGroupFull";
import { CommunityMembersQuery } from "../../../../../pages/network/index";
import { SortDirection } from "../../../../../entities/ISort";
import { Page } from "../../../../../helpers/Types";
import { CommunityMemberOverview } from "../../../../../entities/IProfile";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";
import { CommunityMembersSortOption } from "../../../../../enums";

export default function GroupCreateTest({
  groupConfig,
  disabled,
}: {
  readonly groupConfig: ApiCreateGroup;
  readonly disabled: boolean;
}) {
  const { requestAuth, setToast, connectedProfile } = useContext(AuthContext);

  const [mutating, setMutating] = useState<boolean>(false);
  const createNewFilterMutation = useMutation({
    mutationFn: async (body: ApiCreateGroup) =>
      await commonApiPost<ApiCreateGroup, ApiGroupFull>({
        endpoint: `groups`,
        body,
      }),
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
    },
    onSettled: () => {
      setMutating(false);
    },
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
    if (mutating) {
      return;
    }
    setMutating(true);
    const { success } = await requestAuth();
    if (!success) {
      setMutating(false);
      return;
    }
    setParams((prev) => ({
      ...prev,
      group_id: undefined,
    }));

    const response = await createNewFilterMutation.mutateAsync({
      name: groupConfig.name.length
        ? groupConfig.name
        : `${connectedProfile?.profile?.handle} Test Run`,
      group: groupConfig.group,
    });
    if (response) {
      setParams((prev) => ({
        ...prev,
        group_id: response.id,
      }));
    }
  };

  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => setLoading(isFetching || mutating), [isFetching, mutating]);
  return (
    <div className="tw-flex tw-items-center tw-space-x-4">
      <button
        type="button"
        disabled={disabled}
        onClick={onTest}
        className={`${
          disabled
            ? "tw-opacity-70 tw-text-iron-500"
            : "tw-text-iron-400 hover:tw-bg-iron-800 hover:tw-text-iron-300"
        } tw-border tw-border-solid tw-border-iron-950 tw-ring-1 tw-ring-iron-700 tw-rounded-lg tw-bg-iron-950 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-shadow-sm hover:tw-border-iron-800 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out`}
      >
        <div className="tw-flex tw-items-center tw-gap-x-3">
          {loading && <CircleLoader />}
          <span>Test</span>
        </div>
      </button>
      {!!members && (
        <div className="tw-self-center">
          <div className="tw-text-sm tw-flex tw-items-center tw-gap-x-2">
            <svg
              className="tw-size-5 tw-flex-shrink-0 tw-text-iron-300"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              aria-hidden="true"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"
              />
            </svg>
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
