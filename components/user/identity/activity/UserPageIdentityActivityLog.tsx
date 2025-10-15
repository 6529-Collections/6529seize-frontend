import ProfileActivityLogs, {
  ActivityLogParams,
} from "@/components/profile-activity/ProfileActivityLogs";
import ProfileName from "@/components/profile-activity/ProfileName";
import { ProfileNameType } from "@/components/profile-activity/profileName.types";
import UserTableHeaderWrapper from "@/components/user/utils/UserTableHeaderWrapper";
import { CountlessPage } from "@/helpers/Types";
import { ProfileActivityLog } from "@/entities/IProfile";

export default function UserPageIdentityActivityLog({
  initialActivityLogParams,
  initialActivityLogData,
}: {
  readonly initialActivityLogParams: ActivityLogParams;
  readonly initialActivityLogData: CountlessPage<ProfileActivityLog>;
}) {
  return (
    <div>
      <UserTableHeaderWrapper>
        <span>
          <ProfileName type={ProfileNameType.POSSESSION} />
        </span>{" "}
        NIC Activity Log
      </UserTableHeaderWrapper>
      <div className="tw-mt-4 tw-bg-iron-900 tw-border tw-border-iron-800 tw-border-solid tw-rounded-xl">
        <ProfileActivityLogs
          initialParams={initialActivityLogParams}
          withFilters={true}
          initialData={initialActivityLogData}
        />
      </div>
    </div>
  );
}
