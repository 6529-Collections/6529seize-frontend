import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from "@tanstack/react-query";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAppMetadata } from "@/components/providers/metadata";
import {
  getWaveRouteWithSearchParams,
  type RouteSearchParams,
} from "@/helpers/navigation.helpers";
import MessagesPageClient from "./page.client";

export const metadata = getAppMetadata({
  title: "Messages",
  description: "Direct Messages",
});

type MessageSearchParams = RouteSearchParams;

const getFirstSearchParamValue = (
  searchParams: MessageSearchParams,
  key: string
): string | null => {
  const value = searchParams[key];
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return typeof value === "string" ? value : null;
};

export default async function MessagesPage({
  searchParams,
}: {
  readonly searchParams: Promise<MessageSearchParams>;
}) {
  const resolvedParams = await searchParams;
  const legacyWaveId = getFirstSearchParamValue(resolvedParams, "wave");

  if (legacyWaveId) {
    redirect(
      getWaveRouteWithSearchParams({
        waveId: legacyWaveId,
        searchParams: resolvedParams,
        isDirectMessage: true,
      })
    );
  }

  const queryClient = new QueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={null}>
        <MessagesPageClient />
      </Suspense>
    </HydrationBoundary>
  );
}
