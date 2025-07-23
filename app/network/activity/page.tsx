import { getUserProfileActivityLogs } from "@/helpers/server.helpers";
import { CountlessPage } from "@/helpers/Types";
import { ProfileActivityLog } from "@/entities/IProfile";
import { convertActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import SidebarLayout from "@/components/utils/sidebar/SidebarLayout";
import CommunityActivityPageClient, {
  INITIAL_ACTIVITY_LOGS_PARAMS,
} from "./page.client";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";

export const metadata = {
  title: "Activity",
  description: "Network",
};

export default async function CommunityActivityPage() {
  let logsPage: CountlessPage<ProfileActivityLog>;

  try {
    const headers = await getAppCommonHeaders();
    logsPage = await getUserProfileActivityLogs({
      headers,
      params: convertActivityLogParams({
        params: INITIAL_ACTIVITY_LOGS_PARAMS,
        disableActiveGroup: true,
      }),
    });
  } catch (e) {
    // Next.js App Router doesn't support redirecting from within page.tsx.
    // You need to handle fallback inside the component instead.
    return (
      <SidebarLayout>
        <h1>Error loading activity logs</h1>
      </SidebarLayout>
    );
  }

  return <CommunityActivityPageClient logsPage={logsPage} />;
}
