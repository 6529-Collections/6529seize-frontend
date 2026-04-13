"use client";

import { useDropCurations } from "./useDropCurations";

export function useCanShowDropCurationsAction({
  dropId,
  isTemporaryDrop,
  isWaveAdmin,
  enabled = true,
}: {
  readonly dropId: string;
  readonly isTemporaryDrop: boolean;
  readonly isWaveAdmin: boolean;
  readonly enabled?: boolean | undefined;
}) {
  const shouldCheckCurations = enabled && !isTemporaryDrop && !isWaveAdmin;
  const { data: curations = [] } = useDropCurations({
    dropId,
    enabled: shouldCheckCurations,
  });

  const hasManageableCurations = curations.some(
    (curation) => curation.authenticated_user_can_curate === true
  );

  return !isTemporaryDrop && (isWaveAdmin || hasManageableCurations);
}
