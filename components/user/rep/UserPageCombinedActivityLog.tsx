import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import ProfileActivityLogs from "@/components/profile-activity/ProfileActivityLogs";
import UserTableHeaderWrapper from "../utils/UserTableHeaderWrapper";

export default function UserPageCombinedActivityLog({
  initialActivityLogParams,
}: {
  readonly initialActivityLogParams: ActivityLogParams;
}) {
  return (
    <div>
      <UserTableHeaderWrapper>Activity Log</UserTableHeaderWrapper>
      <div className="tw-mt-2 lg:tw-mt-4">
        <div className="tw-bg-iron-950 tw-border tw-border-iron-800 tw-border-solid tw-rounded-xl">
          <ProfileActivityLogs
            initialParams={initialActivityLogParams}
            withFilters={true}
            withMatterFilter={true}
          />
        </div>
      </div>
    </div>
  );
}
