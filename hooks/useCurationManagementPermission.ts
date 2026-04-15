"use client";

import { useDropCurations } from "@/hooks/drops/useDropCurations";

export function useCurationManagementPermission({
  curationId,
  probeDropId,
}: {
  readonly curationId: string;
  readonly probeDropId: string;
}) {
  const { data: probeCurations = [] } = useDropCurations({
    dropId: probeDropId,
    enabled: Boolean(probeDropId),
  });

  return (
    probeCurations.find((curation) => curation.id === curationId)
      ?.authenticated_user_can_curate ?? false
  );
}
