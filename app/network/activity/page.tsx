import { getUserProfileActivityLogs } from "@/helpers/server.helpers";
import { CountlessPage } from "@/helpers/Types";
import { ProfileActivityLog } from "@/entities/IProfile";
import SidebarLayout from "@/components/utils/sidebar/SidebarLayout";
import CommunityActivityPageClient, {
  INITIAL_ACTIVITY_LOGS_PARAMS,
} from "./page.client";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { convertActivityLogParams } from "@/helpers/activity-logs.helper";

export const metadata = {
  title: "Activity",
  description: "Network",
};

export default async function CommunityActivityPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  try {
    const headers = await getAppCommonHeaders();
    const logsPage: CountlessPage<ProfileActivityLog> =
      await getUserProfileActivityLogs({
        headers,
        params: convertActivityLogParams({
          params: INITIAL_ACTIVITY_LOGS_PARAMS,
          disableActiveGroup: true,
        }),
      });

    // Put ReactQueryWrapper inside client component
    return (
      <SidebarLayout>
        <CommunityActivityPageClient logsPage={logsPage} />
      </SidebarLayout>
    );
  } catch (e) {
    console.log("i am an error", e);
    // Handle redirect manually
    return <div>Not found</div>; // or redirect using a notFound() call if appropriate
  }
}
