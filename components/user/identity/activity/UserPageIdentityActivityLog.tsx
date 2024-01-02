import ProfileActivityLogs, {
  ActivityLogParams,
} from "../../../profile-activity/ProfileActivityLogs";
import ProfileName, {
  ProfileNameType,
} from "../../../profile-activity/ProfileName";
import UserTableHeaderWrapper from "../../utils/UserTableHeaderWrapper";

export default function UserPageIdentityActivityLog({
  initialActivityLogParams,
}: {
  readonly initialActivityLogParams: ActivityLogParams;
}) {
  return (
    <div className="tw-bg-iron-900 tw-border tw-border-white/5 tw-border-solid tw-rounded-xl">
      <UserTableHeaderWrapper>
        <span>
          <ProfileName type={ProfileNameType.POSSESSION} />
        </span>{" "}
        CIC Activity Log
      </UserTableHeaderWrapper>
      <ProfileActivityLogs
        initialParams={initialActivityLogParams}
        withFilters={true}
      />
    </div>
  );
}
