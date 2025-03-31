import { useContext, useEffect, useState } from "react";
import { IProfileAndConsolidations } from "../../../entities/IProfile";
import ProxyList from "./list/ProxyList";
import ProxyCreate from "./create/ProxyCreate";
import CommonChangeAnimation from "../../utils/animation/CommonChangeAnimation";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ApiProfileProxy } from "../../../generated/models/ApiProfileProxy";
import { commonApiFetch } from "../../../services/api/common-api";
import { AuthContext } from "../../auth/Auth";
import { groupProfileProxies } from "../../../helpers/profile-proxy.helpers";
import { useRouter } from "next/router";
import { QueryKey } from "../../react-query-wrapper/ReactQueryWrapper";
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
  profile: initialProfile,
}: {
  readonly profile: IProfileAndConsolidations;
}) {
  const router = useRouter();
  const user = (router.query.user as string).toLowerCase();
  const [mode, setMode] = useState<ProxyMode>(ProxyMode.LIST);
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);

  const { data: profile } = useQuery({
    queryKey: [QueryKey.PROFILE, user],
    queryFn: async () =>
      await commonApiFetch<IProfileAndConsolidations>({
        endpoint: `profiles/${user}`,
      }),
    enabled: !!user,
    initialData: initialProfile,
  });

  useEffect(
    () => setMode(ProxyMode.LIST),
    [connectedProfile, user, activeProfileProxy, profile]
  );

  const getIsSelf = () =>
    !!connectedProfile?.profile?.external_id &&
    !!profile.profile?.external_id &&
    connectedProfile.profile.external_id === profile.profile.external_id &&
    !activeProfileProxy;

  const [isSelf, setIsSelf] = useState(getIsSelf());
  useEffect(
    () => setIsSelf(getIsSelf()),
    [connectedProfile, profile, activeProfileProxy]
  );

  const { data: profileProxies, isFetching } = useQuery<ApiProfileProxy[]>({
    queryKey: [
      QueryKey.PROFILE_PROFILE_PROXIES,
      { handleOrWallet: profile.profile?.handle },
    ],
    queryFn: async () =>
      await commonApiFetch<ApiProfileProxy[]>({
        endpoint: `profiles/${profile.input_identity}/proxies/`,
      }),
    enabled: !!profile.profile?.handle,
    placeholderData: keepPreviousData,
  });

  const [profileProxiesFiltered, setProfileProxiesFiltered] = useState<{
    readonly granted: ApiProfileProxy[];
    readonly received: ApiProfileProxy[];
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
        loading={isFetching}
        receivedProfileProxies={profileProxiesFiltered.received}
        grantedProfileProxies={profileProxiesFiltered.granted}
        profile={profile}
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
