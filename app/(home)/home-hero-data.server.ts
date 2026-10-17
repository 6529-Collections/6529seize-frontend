import "next/dist/compiled/server-only";

import type { HomeHeroData } from "@/components/home/now-minting/HomeHeroSeed";
import type { ApiSeizeSettingsResponse } from "@/contexts/SeizeSettingsContext";
import { resolveMemesWaveId } from "@/helpers/seize-settings.helpers";
import { createFetchDeadline } from "@/lib/fetch/fetchDeadline";
import { SSR_API_TIMEOUT_MS } from "@/lib/fetch/ssrFetch";
import { commonApiFetch } from "@/services/api/common-api";
import {
  fetchMemesLatest,
  fetchMemesWave,
  fetchNextMintDecisions,
} from "@/services/api/latest-drop-query";

// A failed request resolves to null, so the browser makes it itself.
async function orNull<T>(request: Promise<T>): Promise<T | null> {
  try {
    return await request;
  } catch {
    return null;
  }
}

/**
 * Starts the requests behind the home Latest Drop without waiting for them,
 * so the page shell streams first. The newest Meme and the settings start
 * together; the Memes wave and its newest decision start together as soon as
 * the settings name the wave. One SSR API deadline covers all of them.
 */
export function startHomeHeroData(): HomeHeroData {
  const deadline = createFetchDeadline(
    undefined,
    SSR_API_TIMEOUT_MS,
    () =>
      new DOMException(
        `The home page data did not load within ${SSR_API_TIMEOUT_MS}ms.`,
        "TimeoutError"
      )
  );
  const { signal } = deadline;

  const latestMeme = orNull(fetchMemesLatest(signal));
  const settings = orNull(
    commonApiFetch<ApiSeizeSettingsResponse>({ endpoint: "settings", signal })
  );
  const memesWaveId = settings.then((value) =>
    value ? resolveMemesWaveId(value.memes_wave_id) : null
  );
  const memesWave = memesWaveId.then((waveId) =>
    waveId ? orNull(fetchMemesWave(waveId, signal)) : null
  );
  const nextMintDecisions = memesWaveId.then((waveId) =>
    waveId ? orNull(fetchNextMintDecisions(waveId, signal)) : null
  );

  void Promise.all([latestMeme, memesWave, nextMintDecisions]).finally(
    deadline.dispose
  );

  return { latestMeme, settings, memesWave, nextMintDecisions };
}
