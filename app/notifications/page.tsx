import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from "@tanstack/react-query";
import { getAppMetadata } from "@/components/providers/metadata";
import NotificationsPageClient from "./page.client";
import { cookies } from "next/headers";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { prefetchAuthenticatedNotifications } from "@/helpers/stream.helpers";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { Time } from "@/helpers/time";
import type { Metadata } from "next";

export default async function NotificationsPage() {
  const queryClient = new QueryClient();
  const headers = await getAppCommonHeaders();
  const cookieStore = await cookies();

  const notificationsFetched = cookieStore.get(
    String(QueryKey.IDENTITY_NOTIFICATIONS)
  )?.value;

  if (
    !notificationsFetched ||
    +notificationsFetched < Time.now().toMillis() - 60000
  ) {
    await prefetchAuthenticatedNotifications({
      queryClient,
      headers,
    });
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NotificationsPageClient />
    </HydrationBoundary>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return getAppMetadata({
    title: "Notifications | My Stream",
    description: "Brain",
  });
}
