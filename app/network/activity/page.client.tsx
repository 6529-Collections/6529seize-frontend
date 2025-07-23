"use client";

import { useContext } from "react";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useSetTitle } from "@/contexts/TitleContext";
import ProfileActivityLogs, {
  ActivityLogParams,
} from "@/components/profile-activity/ProfileActivityLogs";
import { CountlessPage } from "@/helpers/Types";
import { ProfileActivityLog } from "@/entities/IProfile";
import { getProfileLogTypes } from "@/helpers/profile-logs.helpers";
import { FilterTargetType } from "@/components/utils/CommonFilterTargetSelect";
import SidebarLayout from "@/components/utils/sidebar/SidebarLayout";

export const INITIAL_ACTIVITY_LOGS_PARAMS: ActivityLogParams = {
  page: 1,
  pageSize: 50,
  logTypes: getProfileLogTypes({
    logTypes: [],
  }),
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
