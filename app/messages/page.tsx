import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from "@tanstack/react-query";
import { Suspense } from "react";
import { getAppMetadata } from "@/components/providers/metadata";
import MessagesPageClient from "./page.client";

export const metadata = getAppMetadata({
  title: "Messages",
  description: "Direct Messages",
});

export default function MessagesPage({
  searchParams: _searchParams,
}: {
  readonly searchParams: Promise<{
    wave?: string | undefined;
    drop?: string | undefined;
  }>;
}) {
  const queryClient = new QueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={null}>
        <MessagesPageClient />
      </Suspense>
    </HydrationBoundary>
  );
}
