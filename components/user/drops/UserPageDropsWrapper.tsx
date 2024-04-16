import { useRouter } from "next/router";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import UserPageNoProfile from "../utils/no-profile/UserPageNoProfile";
import UserPageDrops from "./UserPageDrops";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../auth/Auth";
import { useAccount } from "wagmi";
import { getCanProfileSeeDrops } from "../../../helpers/Helpers";

export default function UserPageDropsWrapper({
  profile: initialProfile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const router = useRouter();
  const user = (router.query.user as string).toLowerCase();
  const { canSeeDrops, connectedProfile } = useContext(AuthContext);
  const { address } = useAccount();
  const { data: profile } = useQuery<IProfileAndConsolidations>({
    queryKey: [QueryKey.PROFILE, user.toLowerCase()],
    queryFn: async () =>
      await commonApiFetch<IProfileAndConsolidations>({
        endpoint: `profiles/${user.toLowerCase()}`,
      }),
    enabled: !!user,
    initialData: initialProfile,
  });

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    console.log(address);
    if (!address) {
      router.push(`/${user}/rep`);
    }
    if (!connectedProfile) {
      return;
    }
    if (
      !getCanProfileSeeDrops({
        profile: connectedProfile,
      })
    ) {
      router.push(`/${user}/rep`);
    }
    setLoaded(true);
  }, [canSeeDrops, address, connectedProfile]);

  if (!profile.profile) {
    return <UserPageNoProfile profile={profile} />;
  }

  if (!loaded) {
    return <></>;
  }

  return <UserPageDrops profile={profile} />;
}
