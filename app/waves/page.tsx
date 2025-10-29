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
  "use cache: private";
  noStore();
  const resolvedParams = await searchParams;
  const cookieStore = await cookies();
  const context = await fetchWaveContext(resolvedParams.wave ?? null, cookieStore);
  const queryClient = new QueryClient();

  if (context.waveId) {
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
  "use cache: private";
  noStore();
  const resolvedParams = await searchParams;
  const waveId = resolvedParams.wave ?? null;

  if (!waveId) {
    return getAppMetadata({
      title: "Waves",
      description: "Browse and explore waves",
    });
  }

  const shortUuid = `${waveId.slice(0, 8)}...${waveId.slice(-4)}`;

  return getAppMetadata({
    title: `Wave ${shortUuid} | Waves`,
    description: "Browse and explore waves",
  });
}
