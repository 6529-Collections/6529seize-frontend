export const cache = "force-no-store";

import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { prefetchWavesOverview } from "@/helpers/stream.helpers";
import { commonApiFetch } from "@/services/api/common-api";
import { ApiWave } from "@/generated/models/ApiWave";
import { getAppMetadata } from "@/components/providers/metadata";
import WavesPageClient from "./page.client";
import type { Metadata } from "next";
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
  const waveId = resolvedParams.wave ?? null;

  if (waveId) {
    await queryClient.prefetchQuery({
      queryKey: [QueryKey.WAVE, { wave_id: waveId }],
      queryFn: async () =>
        await commonApiFetch<ApiWave>({
          endpoint: `waves/${waveId}`,
          headers,
        }),
      staleTime: 60000,
    });
  }

  const feedItemsFetched = cookieStore.get(String(QueryKey.FEED_ITEMS))?.value;

  if (feedItemsFetched && +feedItemsFetched < Time.now().toMillis() - 60000) {
    await prefetchWavesOverview({ queryClient, headers, waveId });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WavesPageClient />
    </HydrationBoundary>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Waves",
    description: "Browse and explore waves",
  });
}
