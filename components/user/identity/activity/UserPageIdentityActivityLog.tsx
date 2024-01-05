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
    <div>
      <UserTableHeaderWrapper>
        <span>
          <ProfileName type={ProfileNameType.POSSESSION} />
        </span>{" "}
        CIC Activity Log
      </UserTableHeaderWrapper>
      <div className="tw-mt-4 tw-bg-iron-900 tw-border tw-border-iron-800 tw-border-solid tw-rounded-xl">
        <ProfileActivityLogs
          initialParams={initialActivityLogParams}
          withFilters={true}
        />
      </div>
    </div>
  );
}
