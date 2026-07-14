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
  const { wave } = await params;
  const resolvedParams = await searchParams;
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

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={null}>
        <MessagesPageClient />
      </Suspense>
    </HydrationBoundary>
  );
}
