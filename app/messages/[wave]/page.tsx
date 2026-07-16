import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from "@tanstack/react-query";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getAppMetadata } from "@/components/providers/metadata";
import { getWaveRouteWithSearchParams } from "@/helpers/navigation.helpers";
import { getWaveQueryKey } from "@/services/api/wave-query";
import {
  fetchWaveContext,
  isApiWaveDirectMessage,
  type WavesSearchParams,
} from "@/app/waves/waves-page.shared";
import MessagesPageClient from "../page.client";
import WaveServerFeedSeed, {
  WaveServerFeedSeedGate,
} from "@/components/waves/WaveServerFeedSeed";
import { fetchServerWaveFeedSeed } from "@/app/waves/wave-feed-seed.server";

export const metadata = getAppMetadata({
  title: "Messages | Brain",
  description: "Direct Messages",
});

export default async function MessageWavePage({
  params,
  searchParams,
}: {
  readonly params: Promise<{ wave: string }>;
  readonly searchParams: Promise<WavesSearchParams>;
}) {
  const [{ wave }, resolvedParams] = await Promise.all([params, searchParams]);
  const context = await fetchWaveContext(wave);

  if (context.wave && !isApiWaveDirectMessage(context.wave)) {
    redirect(
      getWaveRouteWithSearchParams({
        waveId: wave,
        searchParams: resolvedParams,
        isDirectMessage: false,
      })
    );
  }

  const queryClient = new QueryClient();
  if (context.wave) {
    queryClient.setQueryData(getWaveQueryKey(wave), context.wave);
  }
  const initialFeedPromise = context.wave
    ? fetchServerWaveFeedSeed({
        headers: context.headers,
        routeFamily: "/messages/[wave]",
        waveId: wave,
      })
    : null;

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {initialFeedPromise && context.wave ? (
        <WaveServerFeedSeedGate waveId={wave}>
          <Suspense fallback={null}>
            <WaveServerFeedSeed
              promise={initialFeedPromise}
              wave={context.wave}
              waveId={wave}
            />
          </Suspense>
          <Suspense fallback={null}>
            <MessagesPageClient />
          </Suspense>
        </WaveServerFeedSeedGate>
      ) : (
        <Suspense fallback={null}>
          <MessagesPageClient />
        </Suspense>
      )}
    </HydrationBoundary>
  );
}
