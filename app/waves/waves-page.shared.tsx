import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from "@tanstack/react-query";
import { cache } from "react";
import { cookies } from "next/headers";
import type { Metadata } from "next";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getAppMetadata } from "@/components/providers/metadata";
import WavesPageClient from "./page.client";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { prefetchWavesOverview } from "@/helpers/stream.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import type { ApiWave } from "@/generated/models/ApiWave";
import { Time } from "@/helpers/time";
import { formatAddress } from "@/helpers/Helpers";
import { formatCount } from "@/helpers/format.helpers";
import { DROP_CLOSE_COOKIE_NAME } from "@/helpers/drop-close-navigation.helpers";

export type WavesSearchParams = Record<string, string | string[] | undefined>;

type WaveRequestContext = {
  readonly waveId: string | null;
  readonly wave: ApiWave | null;
  readonly headers: Record<string, string>;
  readonly feedItemsFetchedAt: number | null;
};

type CookieStore = Awaited<ReturnType<typeof cookies>>;

export const getFirstSearchParamValue = (
  searchParams: WavesSearchParams,
  key: string
): string | null => {
  const value = searchParams[key];
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return typeof value === "string" ? value : null;
};

const fetchWaveCached = cache(
  async (
    waveId: string | null,
    headersKey: string
  ): Promise<ApiWave | null> => {
    if (waveId === null) return null;
    let headers: Record<string, string> = {};
    try {
      headers = headersKey
        ? (JSON.parse(headersKey) as Record<string, string>)
        : {};
    } catch {
      headers = {};
    }
    try {
      return await commonApiFetch<ApiWave>({
        endpoint: `waves/${waveId}`,
        headers,
      });
    } catch (error) {
      console.warn("Failed to fetch wave", { waveId, error });
      return null;
    }
  }
);

async function fetchWaveContext(
  waveId: string | null,
  providedCookies?: CookieStore
): Promise<WaveRequestContext> {
  const cookieStore = providedCookies ?? (await cookies());
  const headers = await getAppCommonHeaders();
  const headersKey = JSON.stringify(headers);
  const feedItemsFetchedRaw = cookieStore.get(
    String(QueryKey.FEED_ITEMS)
  )?.value;
  const feedItemsFetchedAt = Number.parseInt(feedItemsFetchedRaw ?? "", 10);

  const wave = await fetchWaveCached(waveId, headersKey);

  return {
    waveId,
    wave,
    headers,
    feedItemsFetchedAt: Number.isFinite(feedItemsFetchedAt)
      ? feedItemsFetchedAt
      : null,
  };
}

export async function renderWavesPageContent({
  waveId,
  searchParams,
}: {
  waveId: string | null;
  searchParams: WavesSearchParams;
}) {
  const cookieStore = await cookies();
  const context = await fetchWaveContext(waveId, cookieStore);
  const queryClient = new QueryClient();

  if (context.waveId && context.wave) {
    queryClient.setQueryData(
      [QueryKey.WAVE, { wave_id: context.waveId }],
      context.wave
    );
  }

  const hasDrop = Boolean(getFirstSearchParamValue(searchParams, "drop"));
  const hasRecentDropCloseNavigation =
    cookieStore.get(DROP_CLOSE_COOKIE_NAME)?.value === "1";
  const shouldPrefetch =
    !hasDrop &&
    !hasRecentDropCloseNavigation &&
    (context.feedItemsFetchedAt === null ||
      context.feedItemsFetchedAt < Time.now().toMillis() - 60000);

  if (shouldPrefetch) {
    try {
      await prefetchWavesOverview({
        queryClient,
        headers: context.headers,
        waveId: context.waveId,
      });
    } catch (error) {
      console.warn("Waves overview prefetch failed", {
        waveId: context.waveId,
        error,
      });
    }
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WavesPageClient />
    </HydrationBoundary>
  );
}

export async function buildWavesMetadata(
  waveId: string | null
): Promise<Metadata> {
  if (waveId === null) {
    return getAppMetadata({
      title: "Waves",
      description: "Browse and explore waves",
    });
  }

  const shortUuid =
    waveId.length > 12 ? `${waveId.slice(0, 8)}...${waveId.slice(-4)}` : waveId;
  const metadataHeaders = await getAppCommonHeaders();
  const metadataHeadersKey = JSON.stringify(metadataHeaders);
  const wave = await fetchWaveCached(waveId, metadataHeadersKey);

  if (wave === null) {
    return getAppMetadata({
      title: `Wave ${shortUuid} | Waves`,
      description: "Browse and explore waves",
    });
  }

  const waveName =
    typeof wave.name === "string" && wave.name.trim().length > 0
      ? wave.name.trim()
      : `Wave ${shortUuid}`;

  const authorHandle =
    wave.author.handle && wave.author.handle.trim().length > 0
      ? `@${wave.author.handle}`
      : formatAddress(wave.author.primary_address);

  const subscribersCount = wave.metrics.subscribers_count;
  const dropsCount = wave.metrics.drops_count;
  const subscribers = formatCount(subscribersCount);
  const drops = formatCount(dropsCount);
  const descriptionParts = [
    authorHandle && `Created by ${authorHandle}`,
    subscribers &&
      `${subscribers} ${subscribersCount === 1 ? "subscriber" : "subscribers"}`,
    drops && `${drops} ${dropsCount === 1 ? "drop" : "drops"} shared`,
  ].filter((part): part is string => typeof part === "string");

  const metadata: Parameters<typeof getAppMetadata>[0] = {
    title: `${waveName} | Waves`,
    description:
      descriptionParts.length > 0
        ? `${waveName} — ${descriptionParts.join(" • ")}`
        : "Browse and explore waves",
  };

  return getAppMetadata(
    wave.picture
      ? {
          ...metadata,
          ogImage: wave.picture,
          twitterCard: "summary_large_image",
        }
      : metadata
  );
}
