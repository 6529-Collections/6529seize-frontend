"use client";

import { AuthContext } from "@/components/auth/Auth";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import CommonChangeAnimation from "@/components/utils/animation/CommonChangeAnimation";
import { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import { groupProfileProxies } from "@/helpers/profile-proxy.helpers";
import { useIdentity } from "@/hooks/useIdentity";
import { commonApiFetch } from "@/services/api/common-api";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useParams } from "next/navigation";
import { useContext, useEffect, useMemo, useState, type JSX } from "react";
import ProxyCreate from "./create/ProxyCreate";
import ProxyList from "./list/ProxyList";
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
  const params = useParams();
  const user = (params?.user as string)?.toLowerCase();
  const [mode, setMode] = useState<ProxyMode>(ProxyMode.LIST);
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);

  const { profile } = useIdentity({
    handleOrWallet: user,
    initialProfile: initialProfile,
  });

  useEffect(
    () => setMode(ProxyMode.LIST),
    [connectedProfile?.id, user, activeProfileProxy?.id, profile?.id]
  );

  const getIsSelf = () =>
    !!connectedProfile?.id &&
    !!profile?.id &&
    connectedProfile.id === profile.id &&
    !activeProfileProxy;

  const [isSelf, setIsSelf] = useState(getIsSelf());
  useEffect(
    () => setIsSelf(getIsSelf()),
    [connectedProfile?.id, profile?.id, activeProfileProxy?.id]
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

  const profileProxiesFiltered = useMemo(
    () =>
      groupProfileProxies({
        profileProxies: profileProxies ?? [],
        onlyActive: !isSelf,
        profileId: profile?.id ?? null,
      }),
    [profileProxies, isSelf, profile?.id]
  );

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
