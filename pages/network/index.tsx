import { FullPageRequest } from "../../helpers/Types";
import SidebarLayout from "../../components/utils/sidebar/SidebarLayout";
import CommunityMembers from "../../components/community/CommunityMembers";
import { useSelector } from "react-redux";
import { selectActiveGroupId } from "../../store/groupSlice";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ApiGroupFull } from "../../generated/models/ApiGroupFull";
import { QueryKey } from "../../components/react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../services/api/common-api";
import { useSetTitle } from "../../contexts/TitleContext";
import { CommunityMembersSortOption } from "../../enums";

export interface CommunityMembersQuery
  extends FullPageRequest<CommunityMembersSortOption> {
  group_id?: string;
}

export default function CommunityPage() {
  useSetTitle("Network");

  const activeGroupId = useSelector(selectActiveGroupId);
  useQuery<ApiGroupFull>({
    queryKey: [QueryKey.GROUP, activeGroupId],
    queryFn: async () =>
      await commonApiFetch<ApiGroupFull>({
        endpoint: `groups/${activeGroupId}`,
      }),
    placeholderData: keepPreviousData,
    enabled: !!activeGroupId,
  });

  return (
    <SidebarLayout>
      <CommunityMembers />
    </SidebarLayout>
  );
}

CommunityPage.metadata = {
  title: "Network",
  description: "Network",
  twitterCard: "summary_large_image",
};
