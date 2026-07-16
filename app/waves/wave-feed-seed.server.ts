import "next/dist/compiled/server-only";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import { fetchWaveDropsFeedV2 } from "@/services/api/wave-drops-v2-api";
import {
  SERVER_WAVE_FEED_SEED_LIMIT,
  SERVER_WAVE_FEED_SEED_REQUEST_LIMIT,
  type ServerWaveFeedSeedDrop,
  type ServerWaveFeedSeedResult,
} from "@/contexts/wave/server-wave-feed-seed";
import {
  getServerRouteAuthCohort,
  SERVER_ROUTE_SPAN_NAMES,
  traceServerRouteData,
} from "@/utils/monitoring/serverRouteTelemetry";

const stripRepeatedWave = (
  drop: ServerWaveFeedSeedDrop & Partial<Pick<ApiDrop, "wave">>
): ServerWaveFeedSeedDrop => {
  const { wave: _wave, ...seedDrop } = drop;
  return seedDrop;
};

export async function fetchServerWaveFeedSeed({
  headers,
  routeFamily,
  waveId,
}: {
  readonly headers: Record<string, string>;
  readonly routeFamily: "/messages/[wave]" | "/waves/[wave]";
  readonly waveId: string;
}): Promise<ServerWaveFeedSeedResult> {
  try {
    return await traceServerRouteData(
      {
        name: SERVER_ROUTE_SPAN_NAMES.wavesInitialFeedFetch,
        routeFamily,
        dataPath: "wave_initial_feed",
        authCohort: getServerRouteAuthCohort(headers),
      },
      async () => {
        const feed = await fetchWaveDropsFeedV2({
          waveId,
          limit: SERVER_WAVE_FEED_SEED_REQUEST_LIMIT,
          headers,
        });
        const seedDrops = feed.drops.slice(0, SERVER_WAVE_FEED_SEED_LIMIT);

        return {
          ok: true,
          waveId,
          drops: seedDrops.map(stripRepeatedWave),
          hasNextPage: feed.drops.length > SERVER_WAVE_FEED_SEED_LIMIT,
        };
      }
    );
  } catch {
    return { ok: false, waveId };
  }
}
