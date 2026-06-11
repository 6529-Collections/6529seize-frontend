import type { QueryClient } from "@tanstack/react-query";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { SidebarWave, SidebarWavesPage } from "@/types/waves.types";
import { QueryKey } from "../ReactQueryWrapper";

type WavesOverviewQueryData = {
  pages?: ApiWave[][] | undefined;
};

type WavesOverviewCacheData = ApiWave[] | WavesOverviewQueryData;

type WavesV2QueryData = {
  pages?: SidebarWavesPage[] | undefined;
};

type WavesV2CacheData = SidebarWave[] | WavesV2QueryData;

const updateWaveDropMetrics = (wave: ApiWave, timestamp: number): ApiWave => {
  const latestDropTimestamp = Math.max(
    timestamp,
    wave.last_drop_time,
    wave.metrics.latest_drop_timestamp
  );

  return {
    ...wave,
    last_drop_time: latestDropTimestamp,
    metrics: {
      ...wave.metrics,
      drops_count: wave.metrics.drops_count + 1,
      your_drops_count: (wave.metrics.your_drops_count ?? 0) + 1,
      latest_drop_timestamp: latestDropTimestamp,
      your_latest_drop_timestamp: latestDropTimestamp,
    },
  };
};

const updateWaveInArray = (
  waves: ApiWave[],
  waveId: string,
  timestamp: number
): { waves: ApiWave[]; didUpdate: boolean } => {
  let didUpdate = false;

  const updatedWaves = waves.map((wave) => {
    if (wave.id !== waveId) {
      return wave;
    }

    didUpdate = true;
    return updateWaveDropMetrics(wave, timestamp);
  });

  return { waves: updatedWaves, didUpdate };
};

const hasWaveInArray = (waves: ApiWave[], waveId: string): boolean =>
  waves.some((wave) => wave.id === waveId);

const hasWaveInCacheData = (
  data: WavesOverviewCacheData | undefined,
  waveId: string
): boolean => {
  if (!data) {
    return false;
  }

  if (Array.isArray(data)) {
    return hasWaveInArray(data, waveId);
  }

  return data.pages?.some((page) => hasWaveInArray(page, waveId)) ?? false;
};

const updateWavesOverviewCacheData = (
  oldData: WavesOverviewCacheData | undefined,
  waveId: string,
  timestamp: number
): WavesOverviewCacheData | undefined => {
  if (!oldData) {
    return oldData;
  }

  if (Array.isArray(oldData)) {
    const { waves, didUpdate } = updateWaveInArray(oldData, waveId, timestamp);
    return didUpdate ? waves : oldData;
  }

  if (!oldData.pages || oldData.pages.length === 0) {
    return oldData;
  }

  const pageUpdates = oldData.pages.map((page) =>
    updateWaveInArray(page, waveId, timestamp)
  );

  if (!pageUpdates.some(({ didUpdate }) => didUpdate)) {
    return oldData;
  }

  return {
    ...oldData,
    pages: pageUpdates.map(({ waves }) => waves),
  };
};

const updateSidebarWaveDropMetrics = (
  wave: SidebarWave,
  timestamp: number
): SidebarWave => ({
  ...wave,
  totalDropsCount: wave.totalDropsCount + 1,
  latestDropTimestamp: Math.max(timestamp, wave.latestDropTimestamp ?? 0),
});

const updateSidebarWaveInArray = (
  waves: SidebarWave[],
  waveId: string,
  timestamp: number
): { waves: SidebarWave[]; didUpdate: boolean } => {
  let didUpdate = false;

  const updatedWaves = waves.map((wave) => {
    if (wave.id !== waveId) {
      return wave;
    }

    didUpdate = true;
    return updateSidebarWaveDropMetrics(wave, timestamp);
  });

  return { waves: updatedWaves, didUpdate };
};

const hasSidebarWaveInArray = (waves: SidebarWave[], waveId: string): boolean =>
  waves.some((wave) => wave.id === waveId);

const hasSidebarWaveInCacheData = (
  data: WavesV2CacheData | undefined,
  waveId: string
): boolean => {
  if (!data) {
    return false;
  }

  if (Array.isArray(data)) {
    return hasSidebarWaveInArray(data, waveId);
  }

  return (
    data.pages?.some((page) => hasSidebarWaveInArray(page.waves, waveId)) ??
    false
  );
};

const updateWavesV2CacheData = (
  oldData: WavesV2CacheData | undefined,
  waveId: string,
  timestamp: number
): WavesV2CacheData | undefined => {
  if (!oldData) {
    return oldData;
  }

  if (Array.isArray(oldData)) {
    const { waves, didUpdate } = updateSidebarWaveInArray(
      oldData,
      waveId,
      timestamp
    );
    return didUpdate ? waves : oldData;
  }

  if (!oldData.pages || oldData.pages.length === 0) {
    return oldData;
  }

  const pageUpdates = oldData.pages.map((page) => {
    const update = updateSidebarWaveInArray(page.waves, waveId, timestamp);
    return {
      page,
      ...update,
    };
  });

  if (!pageUpdates.some(({ didUpdate }) => didUpdate)) {
    return oldData;
  }

  return {
    ...oldData,
    pages: pageUpdates.map(({ page, waves }) => ({
      ...page,
      waves,
    })),
  };
};

const updateSidebarWaveQueryCaches = async ({
  queryClient,
  queryKey,
  waveId,
  timestamp,
}: {
  readonly queryClient: QueryClient;
  readonly queryKey: QueryKey;
  readonly waveId: string;
  readonly timestamp: number;
}) => {
  const queries = queryClient.getQueriesData<WavesV2CacheData>({
    queryKey: [queryKey],
  });

  for (const [cacheQueryKey, data] of queries) {
    if (!hasSidebarWaveInCacheData(data, waveId)) {
      continue;
    }

    await queryClient.cancelQueries({ queryKey: cacheQueryKey });

    queryClient.setQueryData<WavesV2CacheData | undefined>(
      cacheQueryKey,
      (oldData) => updateWavesV2CacheData(oldData, waveId, timestamp),
      {
        updatedAt: timestamp,
      }
    );
  }
};

export const increaseWavesOverviewDropsCount = async (
  queryClient: QueryClient,
  waveId: string
) => {
  const timestamp = Date.now();
  const overviewQueries = queryClient.getQueriesData<WavesOverviewCacheData>({
    queryKey: [QueryKey.WAVES_OVERVIEW],
  });

  for (const [queryKey, data] of overviewQueries) {
    if (!hasWaveInCacheData(data, waveId)) {
      continue;
    }

    await queryClient.cancelQueries({ queryKey });

    queryClient.setQueryData<WavesOverviewCacheData | undefined>(
      queryKey,
      (oldData) => updateWavesOverviewCacheData(oldData, waveId, timestamp),
      {
        updatedAt: timestamp,
      }
    );
  }

  await updateSidebarWaveQueryCaches({
    queryClient,
    queryKey: QueryKey.WAVES_V2,
    waveId,
    timestamp,
  });
  await updateSidebarWaveQueryCaches({
    queryClient,
    queryKey: QueryKey.OFFICIAL_WAVES,
    waveId,
    timestamp,
  });
  await updateSidebarWaveQueryCaches({
    queryClient,
    queryKey: QueryKey.WAVE_SUBWAVES,
    waveId,
    timestamp,
  });
};
