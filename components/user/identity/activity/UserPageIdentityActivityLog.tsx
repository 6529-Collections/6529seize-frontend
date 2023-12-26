import ProfileActivityLogs, {
  ActivityLogParams,
} from "../../../profile-activity/ProfileActivityLogs";
import ProfileActivityLogsHeader from "../../../profile-activity/ProfileActivityLogsHeader";

export default function UserPageIdentityActivityLog({
  initialActivityLogParams,
}: {
  readonly initialActivityLogParams: ActivityLogParams;
}) {
  return (
    <div className="tw-bg-iron-900 tw-border tw-border-white/5 tw-border-solid tw-rounded-xl">
      <ProfileActivityLogsHeader subTitle="CIC"/>
      <ProfileActivityLogs
        initialParams={initialActivityLogParams}
        withFilters={true}
      />
    </div>
  );
}
