import { useContext, useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import ProxyList from "./list/ProxyList";
import ProxyCreate from "./create/ProxyCreate";
import CommonChangeAnimation from "../../utils/animation/CommonChangeAnimation";
import { useQuery } from "@tanstack/react-query";
import { ProfileProxy } from "../../../generated/models/ProfileProxy";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "../../../services/api/common-api";
import { AuthContext } from "../../auth/Auth";
import { groupProfileProxies } from "../../../helpers/profile-proxy.helpers";

export enum ProxyMode {
  LIST = "LIST",
  CREATE = "CREATE",
}

export enum ProxyAction {
  ALLOCATE_REP = "ALLOCATE_REP",
  ALLOCATE_CATEGORY_REP = "ALLOCATE_CATEGORY_REP",
  ALLOCATE_CIC = "ALLOCATE_CIC",
}

export default function UserPageProxy({
  profile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const [mode, setMode] = useState<ProxyMode>(ProxyMode.LIST);
  const { connectedProfile } = useContext(AuthContext);

  const getIsSelf = () =>
    connectedProfile?.profile?.external_id === profile.profile?.external_id;

  const [isSelf, setIsSelf] = useState(getIsSelf());
  useEffect(() => setIsSelf(getIsSelf()), [connectedProfile, profile]);

  const { data: profileProxies } = useQuery<ProfileProxy[]>({
    queryKey: [
      QueryKey.PROFILE_PROFILE_PROXIES,
      { handleOrWallet: profile.profile?.handle },
    ],
    queryFn: async () =>
      await commonApiFetch<ProfileProxy[]>({
        endpoint: `profiles/${profile.profile?.handle}/proxies/`,
      }),
    enabled: !!profile.profile?.handle,
  });

  const [profileProxiesFiltered, setProfileProxiesFiltered] = useState<{
    readonly granted: ProfileProxy[];
    readonly received: ProfileProxy[];
  }>(
    groupProfileProxies({
      profileProxies: profileProxies ?? [],
      onlyActive: !isSelf,
      profileId: profile.profile?.external_id ?? null,
    })
  );

  useEffect(() => {
    setProfileProxiesFiltered(
      groupProfileProxies({
        profileProxies: profileProxies ?? [],
        onlyActive: !isSelf,
        profileId: profile.profile?.external_id ?? null,
      })
    );
  }, [profileProxies, isSelf, profile]);

  const components: Record<ProxyMode, JSX.Element> = {
    [ProxyMode.LIST]: (
      <ProxyList
        isSelf={isSelf}
        receivedProfileProxies={profileProxiesFiltered.received}
        grantedProfileProxies={profileProxiesFiltered.granted}
        onModeChange={setMode}
      />
    ),
    [ProxyMode.CREATE]: (
      <ProxyCreate
        onModeChange={setMode}
        profileProxies={profileProxies ?? []}
      />
    ),
  };

  return (
    <div className="tailwind-scope">
      <CommonChangeAnimation>{components[mode]}</CommonChangeAnimation>
    </div>
  );
}
