import { useQuery } from "@tanstack/react-query";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { ActivityLogParams } from "../../profile-activity/ProfileActivityLogs";
import { ProfileRatersParams } from "../utils/raters-table/wrapper/ProfileRatersTableWrapper";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { useRouter } from "next/router";
import { commonApiFetch } from "../../../services/api/common-api";
import UserPageRep from "./UserPageRep";
import UserPageSetUpProfileWrapper from "../utils/set-up-profile/UserPageSetUpProfileWrapper";

export default function UserPageRepWrapper({
  profile: initialProfile,
  initialRepReceivedParams,
  initialRepGivenParams,
  initialActivityLogParams,
}: {
  readonly profile: IProfileAndConsolidations;
  readonly initialRepReceivedParams: ProfileRatersParams;
  readonly initialRepGivenParams: ProfileRatersParams;
  readonly initialActivityLogParams: ActivityLogParams;
}) {
  const router = useRouter();
  const user = (router.query.user as string).toLowerCase();

  const { data: profile } = useQuery<IProfileAndConsolidations>({
    queryKey: [QueryKey.PROFILE, user.toLowerCase()],
    queryFn: async () =>
      await commonApiFetch<IProfileAndConsolidations>({
        endpoint: `profiles/${user.toLowerCase()}`,
      }),
    enabled: !!user,
    initialData: initialProfile,
  });

  return (
    <UserPageSetUpProfileWrapper profile={profile}>
      <UserPageRep
        profile={profile}
        initialRepReceivedParams={initialRepReceivedParams}
        initialRepGivenParams={initialRepGivenParams}
        initialActivityLogParams={initialActivityLogParams}
      />
    </UserPageSetUpProfileWrapper>
  );
}
