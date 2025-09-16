import { QueryClient } from "@tanstack/react-query";
import { prefetchWavesOverview } from "@/helpers/stream.helpers";
import { Time } from "@/helpers/time";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { ApiWave } from "@/generated/models/ApiWave";

interface PrefetchOptions {
  readonly queryClient: QueryClient;
  readonly headers: HeadersInit;
  readonly lastFeedFetch?: string;
  readonly waveId?: string | null;
}

export async function maybePrefetchWaveOverview({
  queryClient,
  headers,
  lastFeedFetch,
  waveId,
}: PrefetchOptions) {
  const lastFetchValue = lastFeedFetch ? Number(lastFeedFetch) : null;
  const isStale =
    typeof lastFetchValue === "number" &&
    !Number.isNaN(lastFetchValue) &&
    lastFetchValue < Time.now().toMillis() - 60000;

  if (isStale) {
    await prefetchWavesOverview({
      queryClient,
      headers,
      waveId: waveId ?? null,
    });
  }
}

interface WaveMetadataOptions {
  readonly waveId?: string;
  readonly defaultTitle: string;
  readonly defaultDescription: string;
  readonly titleSuffix: string;
}

export async function buildWaveMetadata({
  waveId,
  defaultTitle,
  defaultDescription,
  titleSuffix,
}: WaveMetadataOptions) {
  let title = defaultTitle;
  let image = "";
  let description = defaultDescription;

  if (!waveId) {
    return { title, image, description };
  }

  const headers = await getAppCommonHeaders();
  const wave = await commonApiFetch<ApiWave>({
    endpoint: `waves/${waveId}`,
    headers,
  }).catch(() => null);

  if (!wave) {
    const shortUuid = `${waveId.slice(0, 8)}...${waveId.slice(-4)}`;
    return {
      title: `Wave ${shortUuid} | ${titleSuffix}`,
      image,
      description,
    };
  }

  return {
    title: `${wave.name} | ${titleSuffix}`,
    image: wave.picture ?? "",
    description: `by @${wave.author.handle} / Subscribers: ${wave.metrics.subscribers_count} / Drops: ${wave.metrics.drops_count} | ${description}`,
  };
}

export const FEED_ITEMS_COOKIE_KEY = String(QueryKey.FEED_ITEMS);
