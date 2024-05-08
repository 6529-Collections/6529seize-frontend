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
import { Time } from "../../../helpers/time";

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

  const getProxies = (): ProfileProxy[] => {
    if (!profileProxies) {
      return [];
    }
    if (isSelf) {
      return profileProxies.filter((p) => !!p.actions.length);
    }
    const now = Time.currentMillis();
    return profileProxies
      .map((p) => ({
        ...p,
        actions: p.actions.filter((a) => {
          if (a.start_time && a.start_time > now) {
            return false;
          }
          if (a.end_time && a.end_time < now) {
            return false;
          }
          return a.is_active;
        }),
      }))
      .filter((p) => !!p.actions.length);
  };

  const [profileProxiesFiltered, setProfileProxiesFiltered] = useState<
    ProfileProxy[]
  >(getProxies());
  useEffect(
    () => setProfileProxiesFiltered(getProxies()),
    [profileProxies, isSelf]
  );

  const getGrantedProxies = (): ProfileProxy[] =>
    profileProxiesFiltered.filter(
      (p) => p.created_by.id === profile.profile?.external_id
    );

  const getReceivedProxies = (): ProfileProxy[] =>
    profileProxiesFiltered.filter(
      (p) => p.granted_to.id === profile.profile?.external_id
    );

  const [grantedProfileProxies, setGrantedProfileProxies] = useState<
    ProfileProxy[]
  >(getGrantedProxies());

  const [receivedProfileProxies, setReceivedProfileProxies] = useState<
    ProfileProxy[]
  >(getReceivedProxies());

  useEffect(() => {
    setGrantedProfileProxies(getGrantedProxies());
    setReceivedProfileProxies(getReceivedProxies());
  }, [profileProxiesFiltered]);

  const components: Record<ProxyMode, JSX.Element> = {
    [ProxyMode.LIST]: (
      <ProxyList
        isSelf={isSelf}
        receivedProfileProxies={receivedProfileProxies}
        grantedProfileProxies={grantedProfileProxies}
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
