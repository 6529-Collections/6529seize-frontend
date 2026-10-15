"use client";

import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { useLayoutEffect } from "react";

import { shouldRetryQuery } from "@/components/react-query-wrapper/utils/query-utils";
import {
  useSeizeSettingsSeed,
  type ApiSeizeSettingsResponse,
} from "@/contexts/SeizeSettingsContext";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveDecisionsPage } from "@/generated/models/ApiWaveDecisionsPage";
import { resolveMemesWaveId } from "@/helpers/seize-settings.helpers";
import {
  fetchMemesLatest,
  fetchMemesWave,
  fetchNextMintDecisions,
  getNextMintDecisionsQueryKey,
  memesLatestQueryOptions,
  NEXT_MINT_DECISIONS_PAGE,
} from "@/services/api/latest-drop-query";
import { getWaveQueryKey } from "@/services/api/wave-query";

/** The server's requests for this page view; each is null if it failed. */
export type HomeHeroData = {
  readonly latestMeme: Promise<ApiMemesExtendedData | null>;
  readonly settings: Promise<ApiSeizeSettingsResponse | null>;
  readonly memesWave: Promise<ApiWave | null>;
  readonly nextMintDecisions: Promise<ApiWaveDecisionsPage | null>;
};

// The server's result, or this browser's own request when the server failed.
async function serverOr<T>(
  server: Promise<T | null>,
  request: () => Promise<T>
): Promise<T> {
  return (await server) ?? (await request());
}

function adoptNextMintQueries(
  queryClient: QueryClient,
  waveId: string,
  data: HomeHeroData
) {
  void queryClient.prefetchQuery({
    queryKey: getWaveQueryKey(waveId),
    queryFn: () => serverOr(data.memesWave, () => fetchMemesWave(waveId)),
    retry: shouldRetryQuery,
  });
  void queryClient.prefetchInfiniteQuery({
    queryKey: getNextMintDecisionsQueryKey(waveId),
    queryFn: () =>
      serverOr(data.nextMintDecisions, () => fetchNextMintDecisions(waveId)),
    initialPageParam: NEXT_MINT_DECISIONS_PAGE,
    retry: shouldRetryQuery,
  });
}

/**
 * Starts the browser queries behind the Latest Drop from the requests the
 * server already made for this page, so the browser does not repeat them.
 */
export default function HomeHeroSeed({
  data,
}: {
  readonly data: HomeHeroData;
}) {
  const queryClient = useQueryClient();
  const seedSeizeSettings = useSeizeSettingsSeed();

  // Layout effects run before the passive effects in which query subscribers
  // start their mount fetch, so the Latest Drop joins these requests.
  useLayoutEffect(() => {
    void queryClient.prefetchQuery({
      ...memesLatestQueryOptions,
      queryFn: () => serverOr(data.latestMeme, () => fetchMemesLatest()),
      retry: shouldRetryQuery,
    });

    let active = true;
    const adoptSettings = async () => {
      const settings = await data.settings;
      if (!active || !settings) return;
      const waveId = resolveMemesWaveId(settings.memes_wave_id);
      // Before the settings arrive, the Latest Drop has no wave to query.
      if (waveId) adoptNextMintQueries(queryClient, waveId, data);
      seedSeizeSettings?.(settings);
    };
    void adoptSettings();

    return () => {
      active = false;
    };
  }, [data, queryClient, seedSeizeSettings]);

  return null;
}
