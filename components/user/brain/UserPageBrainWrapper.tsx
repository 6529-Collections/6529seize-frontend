import { useRouter } from "next/router";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import UserPageDrops from "./UserPageDrops";
import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../auth/Auth";
import { useAccount } from "wagmi";

export default function UserPageBrainWrapper({
  profile: initialProfile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const router = useRouter();
  const user = (router.query.user as string).toLowerCase();

  const { address } = useAccount();
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const getShowDrops = () =>
    !!(
      !!connectedProfile?.profile?.handle &&
      connectedProfile.level >= 50 &&
      !activeProfileProxy &&
      !!address
    ) || connectedProfile?.profile?.handle === "simo";

  const [showDrops, setShowDrops] = useState(getShowDrops());
  useEffect(() => {
    const showDrops = getShowDrops();
    if (showDrops) {
      setShowDrops(true);
      return;
    }
    if (connectedProfile || !address) {
      router.push(`${user}/rep`);
    }
  }, [connectedProfile, activeProfileProxy, address]);

  const { data: profile } = useQuery<IProfileAndConsolidations>({
    queryKey: [QueryKey.PROFILE, user.toLowerCase()],
    queryFn: async () =>
      await commonApiFetch<IProfileAndConsolidations>({
        endpoint: `profiles/${user.toLowerCase()}`,
      }),
    enabled: !!user,
    initialData: initialProfile,
  });

  if (!showDrops) {
    return null;
  }

  return <UserPageDrops profile={profile} />;
}
