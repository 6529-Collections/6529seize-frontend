import ProfileActivityLogs, {
  ActivityLogParams,
} from "@/components/profile-activity/ProfileActivityLogs";
import ProfileName, {
  ProfileNameType,
} from "@/components/profile-activity/ProfileName";
import UserTableHeaderWrapper from "../utils/UserTableHeaderWrapper";

export default function UserPageRepActivityLog({
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
        Rep Activity Log
      </UserTableHeaderWrapper>
      <div className="tw-mt-2 lg:tw-mt-4">
        <div className="tw-bg-iron-900 tw-border tw-border-iron-800 tw-border-solid tw-rounded-xl">
          <ProfileActivityLogs
            initialParams={initialActivityLogParams}
            withFilters={false}
          />
        </div>
      </div>
    </div>
  );
}
