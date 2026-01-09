import CommunityMembers from "@/components/community/CommunityMembers";
import NetworkPageLayout from "@/components/network/NetworkPageLayout";
import { getAppMetadata } from "@/components/providers/metadata";
import type { ApiCommunityMembersSortOption } from "@/generated/models/ApiCommunityMembersSortOption";
import type { FullPageRequest } from "@/helpers/Types";

export interface CommunityMembersQuery extends FullPageRequest<ApiCommunityMembersSortOption> {
  group_id?: string | undefined;
}

export default function CommunityPage() {
  return (
    <NetworkPageLayout>
      <CommunityMembers />
    </NetworkPageLayout>
  );
}

export const generateMetadata = async () => {
  return getAppMetadata({
    title: "Network",
    description: "Network",
    twitterCard: "summary_large_image",
  });
};
