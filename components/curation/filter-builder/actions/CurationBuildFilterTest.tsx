import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import {
  CurationFilterRequest,
  CurationFilterResponse,
  GeneralFilter,
} from "../../../../helpers/filters/Filters.types";
import {
  commonApiFetch,
  commonApiPost,
} from "../../../../services/api/common-api";
import { useContext, useState } from "react";
import { AuthContext } from "../../../auth/Auth";
import { useDispatch } from "react-redux";
import { setActiveCurationFilterId } from "../../../../store/curationFilterSlice";
import { Page } from "../../../../helpers/Types";
import { CommunityMemberOverview } from "../../../../entities/IProfile";
import { QueryKey } from "../../../react-query-wrapper/ReactQueryWrapper";
import {
  CommunityMembersQuery,
  CommunityMembersSortOption,
} from "../../../../pages/community";
import { SortDirection } from "../../../../entities/ISort";

export default function CurationBuildFilterTest({
  filters,
  name,
}: {
  readonly filters: GeneralFilter;
  readonly name: string;
}) {
  const { requestAuth, setToast, connectedProfile } = useContext(AuthContext);
  const dispatch = useDispatch();
  const [mutating, setMutating] = useState<boolean>(false);
  const createNewFilterMutation = useMutation({
    mutationFn: async (body: CurationFilterRequest) =>
      await commonApiPost<CurationFilterRequest, CurationFilterResponse>({
        endpoint: `community-members-curation`,
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
    curation_criteria_id: undefined,
  });

  const {
    isLoading,
    isFetching,
    data: members,
  } = useQuery<Page<CommunityMemberOverview>>({
    queryKey: [QueryKey.COMMUNITY_MEMBERS_TOP, params],
    queryFn: async () =>
      await commonApiFetch<
        Page<CommunityMemberOverview>,
        CommunityMembersQuery
      >({
        endpoint: `community-members/top`,
        params: params,
      }),
    placeholderData: keepPreviousData,
    enabled: !!params.curation_criteria_id,
  });

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
      curation_criteria_id: undefined,
    }));
    const response = await createNewFilterMutation.mutateAsync({
      name,
      criteria: filters,
    });
    if (response) {
      dispatch(setActiveCurationFilterId(response.id));
      setParams((prev) => ({
        ...prev,
        curation_criteria_id: response.id,
      }));
    }
  };

  return (
    <div>
      <button type="button" onClick={onTest} className="tw-bg-iron-900 tw-px-4 tw-py-2.5 tw-text-sm tw-font-semibold tw-text-white tw-border tw-border-solid tw-border-iron-700 tw-rounded-lg  tw-transition tw-duration-300 tw-ease-out hover:tw-bg-iron-800 hover:tw-border-iron-700">Test</button>
      {members?.count && <div>Members: {members.count}</div>}
    </div>
  );
}
