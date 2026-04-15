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
  const { data: probeCurations = [] } = useDropCurations({
    dropId: probeDropId,
    enabled: enabled && Boolean(probeDropId),
  });

  return (
    probeCurations.find((curation) => curation.id === curationId)
      ?.authenticated_user_can_curate ?? false
  );
}
