import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import {
  commonApiFetch,
  commonApiPost,
} from "../../../../services/api/common-api";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../../auth/Auth";
import { useDispatch } from "react-redux";
import { setActiveGroupId } from "../../../../store/groupSlice";
import { Page } from "../../../../helpers/Types";
import { CommunityMemberOverview } from "../../../../entities/IProfile";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "../../../react-query-wrapper/ReactQueryWrapper";
import {
  CommunityMembersQuery,
  CommunityMembersSortOption,
} from "../../../../pages/community";
import { SortDirection } from "../../../../entities/ISort";
import CircleLoader from "../../../distribution-plan-tool/common/CircleLoader";
import { GroupDescription } from "../../../../generated/models/GroupDescription";
import { GroupFull } from "../../../../generated/models/GroupFull";
import { CreateGroup } from "../../../../generated/models/CreateGroup";

export default function GroupBuildTest({
  groupDescription,
  name,
  disabled,
  onTestRunMembersCount,
}: {
  readonly groupDescription: GroupDescription;
  readonly name: string;
  readonly disabled: boolean;
  readonly onTestRunMembersCount: (count: number | null) => void;
}) {
  const { requestAuth, setToast, connectedProfile } = useContext(AuthContext);
  const dispatch = useDispatch();
  const { onGroupChanged } = useContext(ReactQueryWrapperContext);
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
      name: name.length
        ? name
        : `${connectedProfile?.profile?.handle} Test Run`,
      group: groupDescription,
    });
    if (response) {
      dispatch(setActiveGroupId(response.id));
      onGroupChanged({ groupId: response.id });
      setParams((prev) => ({
        ...prev,
        group_id: response.id,
      }));
    }
  };

  useEffect(() => onTestRunMembersCount(members?.count ?? null), [members]);

  const [loading, setLoading] = useState<boolean>(false);
  useEffect(() => setLoading(isFetching || mutating), [isFetching, mutating]);

  return (
    <button
      disabled={disabled}
      type="button"
      onClick={onTest}
      className={`${
        disabled
          ? "tw-text-iron-400 tw-opacity-60"
          : "tw-text-white hover:tw-bg-iron-800 hover:tw-border-iron-700"
      } tw-bg-iron-900 tw-w-[4rem] tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold  tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg  tw-transition tw-duration-300 tw-ease-out `}
    >
      {loading ? <CircleLoader /> : "Test"}
    </button>
  );
}
