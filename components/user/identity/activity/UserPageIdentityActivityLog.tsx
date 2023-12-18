import {
  IProfileAndConsolidations,
  ProfileActivityLog,
} from "../../../../entities/IProfile";
import UserPageIdentityActivityLogHeader from "./UserPageIdentityActivityLogHeader";

import { Page } from "../../../../helpers/Types";
import { useRouter } from "next/router";
import ProfileActivityLogs from "../../../profile-activity/ProfileActivityLogs";

const PAGE_SIZE = 10;

export default function UserPageIdentityActivityLog({
  profile,
  profileActivityLogs: initialPageActivityLogs,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly profileActivityLogs: Page<ProfileActivityLog>;
}) {
  const router = useRouter();
  const user = (router.query.user as string).toLowerCase();

  return (
    <div className="tw-bg-iron-900 tw-border tw-border-white/5 tw-border-solid tw-rounded-xl">
      <UserPageIdentityActivityLogHeader profile={profile} />
      <ProfileActivityLogs
        user={user}
        initialLogs={initialPageActivityLogs}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
