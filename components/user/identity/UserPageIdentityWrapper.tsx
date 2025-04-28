import { useRouter } from "next/router";
import { ActivityLogParams } from "../../profile-activity/ProfileActivityLogs";
import { ProfileRatersParams } from "../utils/raters-table/wrapper/ProfileRatersTableWrapper";
import UserPageIdentity from "./UserPageIdentity";
import UserPageSetUpProfileWrapper from "../utils/set-up-profile/UserPageSetUpProfileWrapper";
import { ApiIdentity } from "../../../generated/models/ApiIdentity";
import { useIdentity } from "../../../hooks/useIdentity";

export default function UserPageIdentityWrapper({
  profile: initialProfile,
  initialCICReceivedParams,
  initialCICGivenParams,
  initialActivityLogParams,
}: {
  readonly profile: ApiIdentity;
  readonly initialCICReceivedParams: ProfileRatersParams;
  readonly initialCICGivenParams: ProfileRatersParams;
  readonly initialActivityLogParams: ActivityLogParams;
}) {
  const router = useRouter();
  const user = (router.query.user as string).toLowerCase();

  const { profile } = useIdentity({
    handleOrWallet: user,
    initialProfile: initialProfile,
  });

  return (
    <UserPageSetUpProfileWrapper profile={profile ?? initialProfile}>
      <UserPageIdentity
        profile={profile ?? initialProfile}
        initialCICReceivedParams={initialCICReceivedParams}
        initialCICGivenParams={initialCICGivenParams}
        initialActivityLogParams={initialActivityLogParams}
      />
    </UserPageSetUpProfileWrapper>
  );
}
