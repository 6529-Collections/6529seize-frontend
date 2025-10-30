import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { prefetchWavesOverview } from "@/helpers/stream.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { ApiWave } from "@/generated/models/ApiWave";
import { getAppMetadata } from "@/components/providers/metadata";
import WavesPageClient from "./page.client";
import { Suspense } from "react";
import { Time } from "@/helpers/time";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { cookies } from "next/headers";
import { unstable_noStore as noStore } from "next/cache";
import type { Metadata } from "next";
import { formatAddress } from "@/helpers/Helpers";

type WaveRequestContext = {
  readonly waveId: string | null;
  readonly wave: ApiWave | null;
  readonly headers: Record<string, string>;
  readonly feedItemsFetchedAt: number | null;
};

type CookieStore = Awaited<ReturnType<typeof cookies>>;

async function fetchWaveContext(
  waveId: string | null,
  providedCookies?: CookieStore
): Promise<WaveRequestContext> {
  noStore();
  const cookieStore = providedCookies ?? (await cookies());
  const headers = await getAppCommonHeaders();
  const feedItemsFetchedRaw =
    cookieStore.get(String(QueryKey.FEED_ITEMS))?.value ?? null;
  const feedItemsFetchedAt =
    feedItemsFetchedRaw !== null ? Number(feedItemsFetchedRaw) : null;

  const wave =
    waveId === null
      ? null
      : await commonApiFetch<ApiWave>({
          endpoint: `waves/${waveId}`,
          headers,
        }).catch(() => null);

  return {
    waveId,
    wave,
    headers,
    feedItemsFetchedAt: Number.isFinite(feedItemsFetchedAt)
      ? feedItemsFetchedAt
      : null,
  };
}

export default async function WavesPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ wave?: string; drop?: string }>;
}) {
  noStore();
  const resolvedParams = await searchParams;
  const cookieStore = await cookies();
  const context = await fetchWaveContext(resolvedParams.wave ?? null, cookieStore);
  const queryClient = new QueryClient();

  if (context.waveId && context.wave) {
    queryClient.setQueryData([QueryKey.WAVE, { wave_id: context.waveId }], context.wave);
  }

  if (
    context.feedItemsFetchedAt !== null &&
    context.feedItemsFetchedAt < Time.now().toMillis() - 60000
  ) {
    await prefetchWavesOverview({
      queryClient,
      headers: context.headers,
      waveId: context.waveId,
    });
  }

  return (
    <Suspense fallback={null}>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <WavesPageClient />
      </HydrationBoundary>
    </Suspense>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  readonly searchParams: Promise<{ wave?: string }>;
}): Promise<Metadata> {
  noStore();
  const resolvedParams = await searchParams;
  const waveId = resolvedParams.wave ?? null;

  if (!waveId) {
    return getAppMetadata({
      title: "Waves",
      description: "Browse and explore waves",
    });
  }

  const shortUuid =
    waveId.length > 12 ? `${waveId.slice(0, 8)}...${waveId.slice(-4)}` : waveId;
  const { wave } = await fetchWaveContext(waveId);

  if (!wave) {
    return getAppMetadata({
      title: `Wave ${shortUuid} | Waves`,
      description: "Browse and explore waves",
    });
  }

  const formatCount = (value: number | null | undefined): string | null => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return null;
    }
    return new Intl.NumberFormat("en-US").format(value);
  };

  const waveName =
    typeof wave.name === "string" && wave.name.trim().length > 0
      ? wave.name.trim()
      : `Wave ${shortUuid}`;

  const authorHandle =
    wave.author?.handle && wave.author.handle.trim().length > 0
      ? `@${wave.author.handle}`
      : formatAddress(wave.author?.primary_address ?? "");

  const subscribersCount = wave.metrics?.subscribers_count;
  const dropsCount = wave.metrics?.drops_count;
  const descriptionParts: string[] = [];

  if (authorHandle) {
    descriptionParts.push(`Created by ${authorHandle}`);
  }

  const subscribers = formatCount(subscribersCount);
  if (subscribers) {
    descriptionParts.push(
      `${subscribers} ${
        subscribersCount === 1 ? "subscriber" : "subscribers"
      }`
    );
  }

  const drops = formatCount(dropsCount);
  if (drops) {
    descriptionParts.push(
      `${drops} ${dropsCount === 1 ? "drop" : "drops"} shared`
    );
  }

  const metadata: Parameters<typeof getAppMetadata>[0] = {
    title: `${waveName} | Waves`,
    description:
      descriptionParts.length > 0
        ? `${waveName} — ${descriptionParts.join(" • ")}`
        : "Browse and explore waves",
  };

  if (wave.picture) {
    metadata.ogImage = wave.picture;
    metadata.twitterCard = "summary_large_image";
  }

  return getAppMetadata(metadata);
}
