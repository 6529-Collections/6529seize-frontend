import type { ActivityLogParams } from "@/components/profile-activity/ProfileActivityLogs";
import ProfileActivityLogs from "@/components/profile-activity/ProfileActivityLogs";

export default function UserPageCombinedActivityLog({
  initialActivityLogParams,
}: {
  readonly initialActivityLogParams: ActivityLogParams;
}) {
  return (
    <div>
      <ProfileActivityLogs
        initialParams={initialActivityLogParams}
        withFilters={true}
        withMatterFilter={true}
      >
        <h3 className="tw-mb-0 tw-whitespace-nowrap tw-text-xl tw-font-bold tw-text-iron-100">
          Activity Log
        </h3>
      </ProfileActivityLogs>
    </div>
  );
}
