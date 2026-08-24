"use client";

import { useSearchParams } from "next/navigation";
import { useProfileWave } from "@/hooks/useProfileWave";
import {
  type DropCurationMembership,
  useDropCurations,
} from "./useDropCurations";

export type QuickCurationAction = Pick<
  DropCurationMembership,
  "id" | "name"
>;

interface DropCurationActionsAvailability {
  readonly showManageCurations: boolean;
  readonly quickAddCuration: QuickCurationAction | null;
  readonly quickRemoveCuration: QuickCurationAction | null;
}

export function useCanShowDropCurationsAction({
  dropId,
  waveId,
  profileIdentity,
  isTemporaryDrop,
  isWaveAdmin,
  enabled = true,
}: {
  readonly dropId: string;
  readonly waveId: string;
  readonly profileIdentity: string;
  readonly isTemporaryDrop: boolean;
  readonly isWaveAdmin: boolean;
  readonly enabled?: boolean | undefined;
}): DropCurationActionsAvailability {
  const searchParams = useSearchParams();
  const { data: curations = [] } = useDropCurations({
    dropId,
    enabled: enabled && !isTemporaryDrop,
  });
  const { data: cachedProfileWave } = useProfileWave({
    identity: profileIdentity,
    enabled: false,
  });
  const manageableCurations = curations.filter(
    (curation) => curation.authenticated_user_can_curate === true
  );
  const activeCurationId = searchParams.get("curation");
  const activeCuration = manageableCurations.find(
    (curation) => curation.id === activeCurationId
  );
  const profileCurationId =
    cachedProfileWave?.profile_wave_id === waveId
      ? cachedProfileWave.profile_curation_id
      : null;
  const preferredCuration =
    activeCuration ??
    manageableCurations.find(
      (curation) => curation.id === profileCurationId
    ) ??
    (cachedProfileWave?.profile_wave_id === waveId ||
    manageableCurations.length === 1
      ? manageableCurations[0]
      : undefined);
  const quickAddCuration = preferredCuration?.drop_included
    ? null
    : (preferredCuration ?? null);
  const quickRemoveCuration = activeCuration?.drop_included
    ? activeCuration
    : null;

  return {
    showManageCurations:
      !isTemporaryDrop &&
      (isWaveAdmin || manageableCurations.length > 0),
    quickAddCuration,
    quickRemoveCuration,
  };
}
