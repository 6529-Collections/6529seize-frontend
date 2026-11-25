import { QueryKey } from "@/components/react-query-wrapper/query-keys";

export const getWaveQueryKey = (waveId: string | null, viewerKey?: string) =>
  [
    QueryKey.WAVE,
    { wave_id: waveId, ...(viewerKey ? { viewerKey } : {}) },
  ] as const;
