import { useRouter } from "next/router";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import UserPageGroups from "./UserPageGroups";
import UserPageSetUpProfileWrapper from "../utils/set-up-profile/UserPageSetUpProfileWrapper";

export default function UserPageGroupsWrapper({
  profile: initialProfile,
}: {
  readonly profile: IProfileAndConsolidations;
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
      <UserPageGroups profile={profile} />
    </UserPageSetUpProfileWrapper>
  );
}
