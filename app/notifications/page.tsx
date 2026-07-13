import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from "@tanstack/react-query";
import { getAppMetadata } from "@/components/providers/metadata";
import NotificationsPageClient from "./page.client";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { prefetchNotificationsPageData } from "@/helpers/notifications.server";
import type { Metadata } from "next";

export default async function NotificationsPage() {
  const queryClient = new QueryClient();
  const headers = await getAppCommonHeaders();

  try {
    await prefetchNotificationsPageData({
      queryClient,
      headers,
    });
  } catch (error) {
    console.warn("Notifications prefetch failed", { error });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NotificationsPageClient />
    </HydrationBoundary>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Notifications | My Stream | Brain",
    description: "Brain",
  });
}
