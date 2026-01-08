"use client";

import ProfileActivityLogs from "@/components/profile-activity/ProfileActivityLogs";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import SidebarLayout from "@/components/utils/sidebar/SidebarLayout";
import { useSetTitle } from "@/contexts/TitleContext";
import type { ProfileActivityLog } from "@/entities/IProfile";
import { INITIAL_ACTIVITY_LOGS_PARAMS } from "@/helpers/profile-logs.helpers";
import type { CountlessPage } from "@/helpers/Types";
import { useContext } from "react";

export default function CommunityActivityPageClient({
  logsPage,
}: {
  logsPage: CountlessPage<ProfileActivityLog>;
}) {
  useSetTitle("Activity | Network");

  const { initCommunityActivityPage } = useContext(ReactQueryWrapperContext);
  initCommunityActivityPage({
    activityLogs: {
      data: logsPage,
      params: INITIAL_ACTIVITY_LOGS_PARAMS,
    },
  });

  return (
    <SidebarLayout>
      <ProfileActivityLogs
        initialParams={INITIAL_ACTIVITY_LOGS_PARAMS}
        withFilters={true}
      >
        <h1 className="tw-block tw-float-none tw-whitespace-nowrap">
          Network Activity
        </h1>
      </ProfileActivityLogs>
    </SidebarLayout>
  );
}
