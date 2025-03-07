import { useRouter } from "next/router";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import UserPageDrops from "./UserPageDrops";
import { useContext, useEffect } from "react";
import { AuthContext } from "../../auth/Auth";
import { useSeizeConnectContext } from "../../auth/SeizeConnectContext";

export default function UserPageBrainWrapper({
  profile: initialProfile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const router = useRouter();
  const user = (router.query.user as string).toLowerCase();

  const { address } = useSeizeConnectContext();
  const { connectedProfile, activeProfileProxy, showWaves } =
    useContext(AuthContext);

  useEffect(() => {
    if (showWaves) {
      return;
    }
    if (connectedProfile || !address) {
      router.push(`/${user}/rep`);
    }
  }, [connectedProfile, activeProfileProxy, address, showWaves]);

  const { data: profile } = useQuery<IProfileAndConsolidations>({
    queryKey: [QueryKey.PROFILE, user.toLowerCase()],
    queryFn: async () =>
      await commonApiFetch<IProfileAndConsolidations>({
        endpoint: `profiles/${user.toLowerCase()}`,
      }),
    enabled: !!user,
    initialData: initialProfile,
  });

  if (!showWaves) {
    return null;
  }

  return <UserPageDrops profile={profile} />;
}
