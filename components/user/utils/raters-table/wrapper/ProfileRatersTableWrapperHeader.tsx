import { ProfileRatersTableType } from "./ProfileRatersTableWrapper";
import UserTableHeaderWrapper from "../../UserTableHeaderWrapper";
import ProfileName, {
  ProfileNameType,
} from "../../../../profile-activity/ProfileName";

export default function ProfileRatersTableWrapperHeader({
  type,
}: {
  readonly type: ProfileRatersTableType;
}) {
  return (
    <UserTableHeaderWrapper>
      {type === ProfileRatersTableType.CIC_RECEIVED && (
        <div>
          CIC Ratings of{" "}
          <span>
            <ProfileName type={ProfileNameType.POSSESSION} />
          </span>
        </div>
      )}
      {type === ProfileRatersTableType.REP_RECEIVED && (
        <div>
          Who&apos;s Repping <ProfileName type={ProfileNameType.DEFAULT} />
        </div>
      )}
      {type === ProfileRatersTableType.REP_GIVEN && (
        <div>
          Who&apos;s <ProfileName type={ProfileNameType.DEFAULT} /> Repping
        </div>
      )}
    </UserTableHeaderWrapper>
  );
}
