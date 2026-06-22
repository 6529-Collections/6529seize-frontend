import {
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiWave } from "@/generated/models/ApiWave";
import { mapApiWaveToSidebarWave } from "@/services/api/waves-v2-api";
import type { SidebarWave } from "@/types/waves.types";

const WAVE_LIST_QUERY_KEYS = [
  QueryKey.WAVES_V2,
  QueryKey.WAVES,
  QueryKey.WAVES_PUBLIC,
  QueryKey.WAVES_OVERVIEW,
  QueryKey.WAVES_OVERVIEW_PUBLIC,
  QueryKey.OFFICIAL_WAVES,
  QueryKey.WAVE_SUBWAVES,
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isApiWave = (value: unknown): value is ApiWave =>
  isRecord(value) &&
  typeof value["id"] === "string" &&
  isRecord(value["metrics"]) &&
  isRecord(value["wave"]);

const isSidebarWave = (value: unknown): value is SidebarWave =>
  isRecord(value) &&
  typeof value["id"] === "string" &&
  typeof value["name"] === "string" &&
  typeof value["totalDropsCount"] === "number";

const findWavePreviewInData = (
  data: unknown,
  waveId: string
): SidebarWave | undefined => {
  if (isSidebarWave(data) && data.id === waveId) {
    return data;
  }

  if (isApiWave(data) && data.id === waveId) {
    return mapApiWaveToSidebarWave(data);
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      const wavePreview = findWavePreviewInData(item, waveId);
      if (wavePreview) {
        return wavePreview;
      }
    }
  }

  if (!isRecord(data)) {
    return undefined;
  }

  const pages = data["pages"];
  if (Array.isArray(pages)) {
    for (const page of pages) {
      const wavePreview = findWavePreviewInData(page, waveId);
      if (wavePreview) {
        return wavePreview;
      }
    }
  }

  const waves = data["waves"];
  if (Array.isArray(waves)) {
    for (const wave of waves) {
      const wavePreview = findWavePreviewInData(wave, waveId);
      if (wavePreview) {
        return wavePreview;
      }
    }
  }

  return undefined;
};

const findCachedWavePreview = (
  queryClient: QueryClient,
  waveId: string
): SidebarWave | undefined => {
  for (const queryKey of WAVE_LIST_QUERY_KEYS) {
    const queries = queryClient.getQueriesData({
      queryKey: [queryKey],
    });

    for (const [, data] of queries) {
      const wavePreview = findWavePreviewInData(data, waveId);
      if (wavePreview) {
        return wavePreview;
      }
    }
  }

  return undefined;
};

export function useCachedWavePreviewById(waveId: string | null) {
  const queryClient = useQueryClient();
  const wavePreview = waveId
    ? findCachedWavePreview(queryClient, waveId)
    : undefined;

  return { wavePreview };
}
