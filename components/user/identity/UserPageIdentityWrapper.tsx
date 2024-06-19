import { useRouter } from "next/router";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { ActivityLogParams } from "../../profile-activity/ProfileActivityLogs";
import { ProfileRatersParams } from "../utils/raters-table/wrapper/ProfileRatersTableWrapper";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import UserPageIdentity from "./UserPageIdentity";
import UserPageSetUpProfileWrapper from "../utils/set-up-profile/UserPageSetUpProfileWrapper";

export default function UserPageIdentityWrapper({
  profile: initialProfile,
  initialCICReceivedParams,
  initialCICGivenParams,
  initialActivityLogParams,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly initialCICReceivedParams: ProfileRatersParams;
  readonly initialCICGivenParams: ProfileRatersParams;
  readonly initialActivityLogParams: ActivityLogParams;
}) {
  const router = useRouter();
  const user = (router.query.user as string).toLowerCase();

  const { data: profile } = useQuery({
    queryKey: [QueryKey.PROFILE, user],
    queryFn: async () =>
      await commonApiFetch<IProfileAndConsolidations>({
        endpoint: `profiles/${user}`,
      }),
    enabled: !!user,
    initialData: initialProfile,
  });

  return (
    <UserPageSetUpProfileWrapper profile={profile}>
      <UserPageIdentity
        profile={profile}
        initialCICReceivedParams={initialCICReceivedParams}
        initialCICGivenParams={initialCICGivenParams}
        initialActivityLogParams={initialActivityLogParams}
      />
    </UserPageSetUpProfileWrapper>
  );
}
