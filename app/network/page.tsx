import { FullPageRequest } from "@/helpers/Types";
import SidebarLayout from "@/components/utils/sidebar/SidebarLayout";
import CommunityMembers from "@/components/community/CommunityMembers";
import { CommunityMembersSortOption } from "@/enums";
import { getAppMetadata } from "@/components/providers/metadata";

export interface CommunityMembersQuery
  extends FullPageRequest<CommunityMembersSortOption> {
  group_id?: string;
}

export default function CommunityPage() {
  return (
    <SidebarLayout>
      <CommunityMembers />
    </SidebarLayout>
  );
}

export const generateMetadata = async () => {
  return getAppMetadata({
    title: "Network",
    description: "Network",
    twitterCard: "summary_large_image",
  });
};
