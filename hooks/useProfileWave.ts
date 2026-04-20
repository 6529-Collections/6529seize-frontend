"use client";

import {
  getProfileWave,
  type ApiProfileWaveResponse,
} from "@/services/api/profile-wave-api";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export const getProfileWaveQueryKey = (identity: string) =>
  ["profile-wave", identity.toLowerCase()] as const;

export function useProfileWave({
  identity,
  initialProfileWave,
  enabled = true,
}: {
  readonly identity: string | null | undefined;
  readonly initialProfileWave?: ApiProfileWaveResponse | undefined;
  readonly enabled?: boolean | undefined;
}) {
  const normalizedIdentity = useMemo(
    () => identity?.trim().toLowerCase() ?? "",
    [identity]
  );

  return useQuery<ApiProfileWaveResponse>({
    queryKey: getProfileWaveQueryKey(normalizedIdentity),
    queryFn: async ({ signal }) =>
      await getProfileWave({
        identity: normalizedIdentity,
        signal,
      }),
    enabled: enabled && normalizedIdentity.length > 0,
    staleTime: 60 * 1000,
    ...(initialProfileWave !== undefined
      ? { initialData: initialProfileWave, initialDataUpdatedAt: 0 }
      : {}),
  });
}
