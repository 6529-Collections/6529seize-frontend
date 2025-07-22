"use client";

import { useContext } from "react";
import { useSetTitle } from "@/contexts/TitleContext";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import SidebarLayout from "@/components/utils/sidebar/SidebarLayout";
import ProfileActivityLogs from "@/components/profile-activity/ProfileActivityLogs";
import { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import { CountlessPage } from "@/helpers/Types";
import { ProfileActivityLog } from "@/entities/IProfile";
import { FilterTargetType } from "@/components/utils/CommonFilterTargetSelect";
import { getProfileLogTypes } from "@/helpers/profile-logs.helpers";

export const INITIAL_ACTIVITY_LOGS_PARAMS: ActivityLogParams = {
  page: 1,
  pageSize: 50,
  logTypes: getProfileLogTypes({ logTypes: [] }),
  matter: null,
  targetType: FilterTargetType.ALL,
  handleOrWallet: null,
  groupId: null,
};

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
        withFilters={true}>
        <h1 className="tw-block tw-float-none tw-whitespace-nowrap">
          <span className="font-lightest">Network</span> Activity
        </h1>
      </ProfileActivityLogs>
    </SidebarLayout>
  );
}
