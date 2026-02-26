import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { cookies } from "next/headers";

import { getAppMetadata } from "@/components/providers/metadata";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { prefetchAuthenticatedNotifications } from "@/helpers/stream.helpers";
import { Time } from "@/helpers/time";

import NotificationsPageClient from "./page.client";

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
