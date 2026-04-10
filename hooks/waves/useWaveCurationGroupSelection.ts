"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { useWaveCurationGroups } from "./useWaveCurationGroups";

interface UseWaveCurationGroupSelectionProps {
  readonly wave: ApiWave;
}

export function useWaveCurationGroupSelection({
  wave,
}: UseWaveCurationGroupSelectionProps) {
  const searchParams = useSearchParams();
  const {
    data: curationGroups = [],
    isLoading: isLoadingCurationGroups,
    isError: isCurationGroupsError,
  } = useWaveCurationGroups({
    waveId: wave.id,
    enabled: wave.wave.type !== ApiWaveType.Chat,
  });

  const rawCuratedByGroupId = searchParams.get("curated_by_group");

  const curationGroupIdSet = useMemo(
    () => new Set(curationGroups.map((group) => group.id)),
    [curationGroups]
  );

  const curatedByGroupId = useMemo(() => {
    if (!rawCuratedByGroupId) {
      return undefined;
    }

    if (isCurationGroupsError) {
      return undefined;
    }

    if (isLoadingCurationGroups) {
      return rawCuratedByGroupId;
    }

    return curationGroupIdSet.has(rawCuratedByGroupId)
      ? rawCuratedByGroupId
      : undefined;
  }, [
    rawCuratedByGroupId,
    isCurationGroupsError,
    isLoadingCurationGroups,
    curationGroupIdSet,
  ]);

  return {
    curatedByGroupId,
    curationGroups,
  };
}
