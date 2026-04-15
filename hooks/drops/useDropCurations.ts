"use client";

import { useAuth } from "@/components/auth/Auth";
import type { ApiWaveCuration } from "@/generated/models/ApiWaveCuration";
import { commonApiFetch } from "@/services/api/common-api";
import { getAuthJwt } from "@/services/auth/auth.utils";
import { useQuery } from "@tanstack/react-query";

export interface DropCurationMembership extends ApiWaveCuration {
  readonly drop_included: boolean;
  readonly authenticated_user_can_curate: boolean;
}

const getDropCurationsAuthScope = ({
  connectedProfileId,
  activeProfileProxyId,
  hasAuthJwt,
}: {
  readonly connectedProfileId: string | null;
  readonly activeProfileProxyId: string | null;
  readonly hasAuthJwt: boolean;
}) =>
  `${activeProfileProxyId ?? connectedProfileId ?? "anonymous"}:${
    hasAuthJwt ? "authenticated" : "anonymous"
  }`;

export const getDropCurationsQueryKey = ({
  dropId,
  connectedProfileId,
  activeProfileProxyId,
  hasAuthJwt,
}: {
  readonly dropId: string;
  readonly connectedProfileId: string | null;
  readonly activeProfileProxyId: string | null;
  readonly hasAuthJwt: boolean;
}) =>
  [
    "drop-curations",
    {
      drop_id: dropId,
      auth_scope: getDropCurationsAuthScope({
        connectedProfileId,
        activeProfileProxyId,
        hasAuthJwt,
      }),
    },
  ] as const;

export function useDropCurations({
  dropId,
  enabled = true,
}: {
  readonly dropId: string;
  readonly enabled?: boolean | undefined;
}) {
  const { connectedProfile, activeProfileProxy, fetchingProfile } = useAuth();
  const connectedProfileId = connectedProfile?.id ?? null;
  const activeProfileProxyId = activeProfileProxy?.id ?? null;
  const hasAuthJwt = Boolean(getAuthJwt());

  return useQuery<DropCurationMembership[]>({
    queryKey: getDropCurationsQueryKey({
      dropId,
      connectedProfileId,
      activeProfileProxyId,
      hasAuthJwt,
    }),
    queryFn: async () =>
      await commonApiFetch<DropCurationMembership[]>({
        endpoint: `drops/${dropId}/curations`,
      }),
    enabled: enabled && !!dropId && !fetchingProfile,
    staleTime: 60_000,
  });
}
