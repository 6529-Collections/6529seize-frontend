import { useContext, useEffect, useState, type JSX } from "react";
import { ApiIdentity } from "../../../generated/models/ApiIdentity";
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
import { useIdentity } from "../../../hooks/useIdentity";
export enum ProxyMode {
  LIST = "LIST",
  CREATE = "CREATE",
}

enum ProxyAction {
  ALLOCATE_REP = "ALLOCATE_REP",
  ALLOCATE_CATEGORY_REP = "ALLOCATE_CATEGORY_REP",
  ALLOCATE_CIC = "ALLOCATE_CIC",
}

export default function UserPageProxy({
  profile: initialProfile,
}: {
  readonly profile: ApiIdentity;
}) {
  const router = useRouter();
  const user = (router.query.user as string).toLowerCase();
  const [mode, setMode] = useState<ProxyMode>(ProxyMode.LIST);
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);

  const { profile } = useIdentity({
    handleOrWallet: user,
    initialProfile: initialProfile,
  });

  useEffect(
    () => setMode(ProxyMode.LIST),
    [connectedProfile, user, activeProfileProxy, profile]
  );

  const getIsSelf = () =>
    !!connectedProfile?.id &&
    !!profile?.id &&
    connectedProfile.id === profile.id &&
    !activeProfileProxy;

  const [isSelf, setIsSelf] = useState(getIsSelf());
  useEffect(
    () => setIsSelf(getIsSelf()),
    [connectedProfile, profile, activeProfileProxy]
  );

  const { data: profileProxies, isFetching } = useQuery<ApiProfileProxy[]>({
    queryKey: [
      QueryKey.PROFILE_PROFILE_PROXIES,
      { handleOrWallet: profile?.handle },
    ],
    queryFn: async () =>
      await commonApiFetch<ApiProfileProxy[]>({
        endpoint: `profiles/${profile?.query}/proxies/`,
      }),
    enabled: !!profile?.handle,
    placeholderData: keepPreviousData,
  });

  const [profileProxiesFiltered, setProfileProxiesFiltered] = useState<{
    readonly granted: ApiProfileProxy[];
    readonly received: ApiProfileProxy[];
  }>(
    groupProfileProxies({
      profileProxies: profileProxies ?? [],
      onlyActive: !isSelf,
      profileId: profile?.id ?? null,
    })
  );

  useEffect(() => {
    setProfileProxiesFiltered(
      groupProfileProxies({
        profileProxies: profileProxies ?? [],
        onlyActive: !isSelf,
        profileId: profile?.id ?? null,
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
        profile={profile ?? initialProfile}
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
