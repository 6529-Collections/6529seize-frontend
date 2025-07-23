import { getUserProfileActivityLogs } from "@/helpers/server.helpers";
import { CountlessPage } from "@/helpers/Types";
import { ProfileActivityLog } from "@/entities/IProfile";
import CommunityActivityPageClient, {
  INITIAL_ACTIVITY_LOGS_PARAMS,
} from "./page.client";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { convertActivityLogParams } from "@/helpers/activity-logs.helper";
import { getAppMetadata } from "@/components/providers/metadata";
import { notFound } from "next/navigation";

export default async function CommunityActivityPage() {
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
    return <CommunityActivityPageClient logsPage={logsPage} />;
  } catch {
    return notFound();
  }
}

export const generateMetadata = async () => {
  return getAppMetadata({
    title: "Activity",
    description: "Network",
  });
};
