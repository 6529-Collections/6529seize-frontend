import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { getAppMetadata } from "@/components/providers/metadata";
import MessagesPageClient from "./page.client";
import { cookies } from "next/headers";
import { Time } from "@/helpers/time";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

export default async function MessagesPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ wave?: string; drop?: string }>;
}) {
  const queryClient = new QueryClient();
  const headers = await getAppCommonHeaders();
  const resolvedParams = await searchParams;
  
  // No need to prefetch feed items for messages view - it only shows direct messages
  
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MessagesPageClient />
    </HydrationBoundary>
  );
}

export async function generateMetadata() {
  const title = "Messages";
  const image = "";
  const description = "Direct Messages";
  
  return getAppMetadata({ 
    title, 
    description, 
    ...(image ? { ogImage: image } : {})
  });
}