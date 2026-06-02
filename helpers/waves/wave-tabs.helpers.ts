import { MyStreamWaveTab } from "@/types/waves.types";

export const WAVE_TAB_QUERY_PARAM = "tab";

export const getWaveTabFromParam = (
  value: string | null | undefined
): MyStreamWaveTab | null => {
  const normalized = value?.trim().toUpperCase();

  if (!normalized) {
    return null;
  }

  return Object.values(MyStreamWaveTab).includes(normalized as MyStreamWaveTab)
    ? (normalized as MyStreamWaveTab)
    : null;
};
