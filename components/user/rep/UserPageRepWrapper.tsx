import { ActivityLogParams } from "../../profile-activity/ProfileActivityLogs";
import { ProfileRatersParams } from "../utils/raters-table/wrapper/ProfileRatersTableWrapper";
import { useRouter } from "next/router";
import UserPageRep from "./UserPageRep";
import UserPageSetUpProfileWrapper from "../utils/set-up-profile/UserPageSetUpProfileWrapper";
import { ApiIdentity } from "../../../generated/models/ApiIdentity";
import { useIdentity } from "../../../hooks/useIdentity";
export default function UserPageRepWrapper({
  profile: initialProfile,
  initialRepReceivedParams,
  initialRepGivenParams,
  initialActivityLogParams,
}: {
  readonly profile: ApiIdentity;
  readonly initialRepReceivedParams: ProfileRatersParams;
  readonly initialRepGivenParams: ProfileRatersParams;
  readonly initialActivityLogParams: ActivityLogParams;
}) {
  const router = useRouter();
  const user = (router.query.user as string).toLowerCase();

  const { profile } = useIdentity({
    handleOrWallet: user,
    initialProfile,
  });

  return (
    <UserPageSetUpProfileWrapper profile={profile ?? initialProfile}>
      <UserPageRep
        profile={profile ?? initialProfile}
        initialRepReceivedParams={initialRepReceivedParams}
        initialRepGivenParams={initialRepGivenParams}
        initialActivityLogParams={initialActivityLogParams}
      />
    </UserPageSetUpProfileWrapper>
  );
}
