"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveMetadata } from "@/generated/models/ApiWaveMetadata";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { WaveSubmissionExperience } from "@/helpers/waves/wave-submission-experience.helpers";
import {
  getApproveWaveTabLabelsFromMetadata,
  getWaveSubmissionButtonLabelFromMetadata,
  getWaveSubmissionButtonLabelOverrideFromMetadata,
  getWaveOutcomeVisibilityFromMetadata,
} from "@/helpers/waves/wave-metadata.helpers";
import { fetchWaveMetadata } from "@/services/api/waves-v2-api";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useWaveMetadata(
  waveId: string | null | undefined,
  { enabled = true }: { readonly enabled?: boolean | undefined } = {}
) {
  return useQuery<ApiWaveMetadata[]>({
    queryKey: [QueryKey.WAVE_METADATA, { wave_id: waveId }],
    queryFn: async () => {
      if (!waveId) {
        throw new Error("Cannot fetch wave metadata without a wave id");
      }

      return await fetchWaveMetadata({ waveId });
    },
    enabled: Boolean(enabled && waveId),
    staleTime: 60000,
  });
}

export function useApproveWaveCustomTabLabels(wave: ApiWave) {
  const isApproveWave = wave.wave.type === ApiWaveType.Approve;
  const { data } = useWaveMetadata(wave.id, { enabled: isApproveWave });

  return useMemo(
    () => getApproveWaveTabLabelsFromMetadata(isApproveWave ? data : null),
    [data, isApproveWave]
  );
}

export function useWaveOutcomeVisibility(
  wave: ApiWave | null | undefined
): boolean {
  const isCompetitionWave =
    wave?.wave.type === ApiWaveType.Rank ||
    wave?.wave.type === ApiWaveType.Approve;
  const { data } = useWaveMetadata(wave?.id, {
    enabled: isCompetitionWave,
  });

  return useMemo(() => {
    if (!isCompetitionWave) {
      return true;
    }

    if (data === undefined) {
      return false;
    }

    return getWaveOutcomeVisibilityFromMetadata(data);
  }, [data, isCompetitionWave]);
}

export function useWaveSubmissionButtonLabel({
  enabled = true,
  submissionExperience,
  waveId,
}: {
  readonly enabled?: boolean | undefined;
  readonly submissionExperience: WaveSubmissionExperience;
  readonly waveId: string | null | undefined;
}): string {
  const { data } = useWaveMetadata(waveId, {
    enabled: Boolean(enabled && waveId),
  });

  return useMemo(
    () =>
      getWaveSubmissionButtonLabelFromMetadata({
        metadata: data,
        submissionExperience,
      }),
    [data, submissionExperience]
  );
}

export function useWaveSubmissionButtonLabelOverride({
  enabled = true,
  waveId,
}: {
  readonly enabled?: boolean | undefined;
  readonly waveId: string | null | undefined;
}): string | null {
  const { data } = useWaveMetadata(waveId, {
    enabled: Boolean(enabled && waveId),
  });

  return useMemo(
    () => getWaveSubmissionButtonLabelOverrideFromMetadata(data),
    [data]
  );
}
