import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { prefetchWavesOverview } from "@/helpers/stream.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { ApiWave } from "@/generated/models/ApiWave";
import { getAppMetadata } from "@/components/providers/metadata";
import WavesPageClient from "./page.client";
import { cookies } from "next/headers";
import { Time } from "@/helpers/time";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

export default async function WavesPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ wave?: string; drop?: string }>;
}) {
  const queryClient = new QueryClient();
  const headers = await getAppCommonHeaders();
  const cookieStore = await cookies();
  const resolvedParams = await searchParams;
  
  const feedItemsFetched = cookieStore.get(String(QueryKey.FEED_ITEMS))?.value;
  
  if (feedItemsFetched && +feedItemsFetched < Time.now().toMillis() - 60000) {
    const waveId = resolvedParams.wave ?? null;
    await prefetchWavesOverview({ queryClient, headers, waveId });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WavesPageClient />
    </HydrationBoundary>
  );
}

export async function generateMetadata({
  searchParams,
}: {
  readonly searchParams: Promise<{ wave?: string }>;
}) {
  const resolvedParams = await searchParams;
  let title = "Waves";
  let image = "";
  let description = "Browse and explore waves";

  if (resolvedParams.wave) {
    const headers = await getAppCommonHeaders();
    const wave = await commonApiFetch<ApiWave>({
      endpoint: `waves/${resolvedParams.wave}`,
      headers,
    }).catch(() => null);

    if (wave) {
      title = `${wave.name} | Waves`;
      image = wave.picture ?? "";
      description = `by @${wave.author.handle} / Subscribers: ${wave.metrics.subscribers_count} / Drops: ${wave.metrics.drops_count} | ${description}`;
    } else {
      const id = resolvedParams.wave;
      const shortUuid = `${id.slice(0, 8)}...${id.slice(-4)}`;
      title = `Wave ${shortUuid} | Waves`;
    }
  }
  
  return getAppMetadata({ 
    title, 
    description, 
    ...(image ? { ogImage: image } : {})
  });
}
