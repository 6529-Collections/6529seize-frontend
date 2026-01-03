import { QueryClient, dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getAppMetadata } from "@/components/providers/metadata";
import MessagesPageClient from "./page.client";

export default async function MessagesPage({
  searchParams: _searchParams,
}: {
  readonly searchParams: Promise<{ wave?: string | undefined; drop?: string | undefined }>;
}) {
  const queryClient = new QueryClient();
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
