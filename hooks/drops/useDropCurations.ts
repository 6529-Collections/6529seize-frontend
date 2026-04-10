"use client";

import type { ApiWaveCuration } from "@/generated/models/ApiWaveCuration";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery } from "@tanstack/react-query";

export interface DropCurationMembership extends ApiWaveCuration {
  readonly drop_included: boolean;
  readonly authenticated_user_can_curate: boolean;
}

export const getDropCurationsQueryKey = (dropId: string) =>
  ["drop-curations", { drop_id: dropId }] as const;

export function useDropCurations({
  dropId,
  enabled = true,
}: {
  readonly dropId: string;
  readonly enabled?: boolean | undefined;
}) {
  return useQuery<DropCurationMembership[]>({
    queryKey: getDropCurationsQueryKey(dropId),
    queryFn: async () =>
      await commonApiFetch<DropCurationMembership[]>({
        endpoint: `drops/${dropId}/curations`,
      }),
    enabled: enabled && !!dropId,
    staleTime: 60_000,
  });
}
