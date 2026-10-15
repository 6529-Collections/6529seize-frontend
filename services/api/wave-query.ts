import { QueryKey } from "@/components/react-query-wrapper/query-keys";

export const getWaveQueryKey = (waveId: string | null) =>
  [QueryKey.WAVE, { wave_id: waveId }] as const;

export const getWaveDecisionsQueryKey = (waveId: string, pageSize: number) =>
  [QueryKey.WAVE_DECISIONS, { waveId, pageSize }] as const;
