"use client";

import { useDropCurations } from "@/hooks/drops/useDropCurations";

export function useCurationManagementPermission({
  curationId,
  probeDropId,
  enabled = true,
}: {
  readonly curationId: string;
  readonly probeDropId: string;
  readonly enabled?: boolean | undefined;
}) {
  const isProbeReady = Boolean(probeDropId);
  const isEnabled = enabled && isProbeReady;
  const {
    data: probeCurations,
    isFetching,
    isPending,
  } = useDropCurations({
    dropId: probeDropId,
    enabled: isEnabled,
  });
  const canManageCuration =
    probeCurations?.find((curation) => curation.id === curationId)
      ?.authenticated_user_can_curate ?? false;

  return {
    canManageCuration,
    isLoading: enabled && (!isProbeReady || (isPending && isFetching)),
  };
}
