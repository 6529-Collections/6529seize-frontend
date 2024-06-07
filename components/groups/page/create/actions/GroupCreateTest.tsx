import { useContext, useEffect, useState } from "react";
import { CreateGroup } from "../../../../../generated/models/CreateGroup";
import CircleLoader from "../../../../distribution-plan-tool/common/CircleLoader";
import { AuthContext } from "../../../../auth/Auth";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import {
  commonApiFetch,
  commonApiPost,
} from "../../../../../services/api/common-api";
import { GroupFull } from "../../../../../generated/models/GroupFull";
import {
  CommunityMembersQuery,
  CommunityMembersSortOption,
} from "../../../../../pages/community";
import { SortDirection } from "../../../../../entities/ISort";
import { Page } from "../../../../../helpers/Types";
import { CommunityMemberOverview } from "../../../../../entities/IProfile";
import { QueryKey } from "../../../../react-query-wrapper/ReactQueryWrapper";

export default function GroupCreateTest({
  groupConfig,
  disabled,
}: {
  readonly groupConfig: CreateGroup;
  readonly disabled: boolean;
}) {
  const { requestAuth, setToast, connectedProfile } = useContext(AuthContext);

  const [mutating, setMutating] = useState<boolean>(false);
  const createNewFilterMutation = useMutation({
    mutationFn: async (body: CreateGroup) =>
      await commonApiPost<CreateGroup, GroupFull>({
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
    <div className="tw-inline-flex tw-items-center tw-space-x-3">
      <button
        type="button"
        disabled={disabled}
        onClick={onTest}
        className="tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg tw-bg-iron-950 tw-px-3.5 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-iron-300 tw-shadow-sm hover:tw-bg-iron-900 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-iron-700 tw-transition tw-duration-300 tw-ease-out"
      >
        <div className="tw-flex tw-items-center tw-gap-x-3">
          {loading && <CircleLoader />}
          <span>Test</span>
        </div>
      </button>
      {!!members && <div>{members.count} members</div>}
    </div>
  );
}
