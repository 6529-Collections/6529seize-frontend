import { useRouter } from "next/router";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import UserPageNoProfile from "../utils/no-profile/UserPageNoProfile";
import UserPageDrops from "./UserPageDrops";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../auth/Auth";

export default function UserPageDropsWrapper({
  profile: initialProfile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const router = useRouter();
  const user = (router.query.user as string).toLowerCase();
  const { canSeeDrops } = useContext(AuthContext);

  const { data: profile } = useQuery<IProfileAndConsolidations>({
    queryKey: [QueryKey.PROFILE, user.toLowerCase()],
    queryFn: async () =>
      await commonApiFetch<IProfileAndConsolidations>({
        endpoint: `profiles/${user.toLowerCase()}`,
      }),
    enabled: !!user,
    initialData: initialProfile,
  });

  useEffect(() => {
    if (!canSeeDrops) {
      router.push(`${user}/rep`);
    }
  }, [canSeeDrops]);

  if (!profile.profile) {
    return <UserPageNoProfile profile={profile} />;
  }

  return <UserPageDrops profile={profile} />;
}
