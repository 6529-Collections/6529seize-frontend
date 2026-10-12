"use client";

import {
  environmentManager,
  focusManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Capacitor } from "@capacitor/core";
import { shouldRetryQuery } from "@/components/react-query-wrapper/utils/query-utils";
import {
  getNativeAppActivity,
  subscribeNativeAppActivity,
} from "@/services/app-activity/native-app-activity";
import { useEffect, useState } from "react";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10000,
        refetchOnWindowFocus: false,
        // Keep the server default of no retries; in the browser, retry up to
        // three times but never repeat a request that failed with a 4xx.
        // Queries that set their own `retry` still take precedence.
        retry: environmentManager.isServer() ? 0 : shouldRetryQuery,
        // Server caches die with the request; do not retain them with GC timers.
        gcTime: environmentManager.isServer() ? Infinity : 1000 * 60 * 60 * 24,
      },
    },
  });
}

export default function QueryClientSetup({
  children,
}: {
  readonly children: React.ReactNode;
}) {
  // A server render must not share cached data with another request.
  const [queryClient] = useState(createQueryClient);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const syncFocus = () => focusManager.setFocused(getNativeAppActivity());
    const unsubscribe = subscribeNativeAppActivity(syncFocus);
    syncFocus();
    return () => {
      unsubscribe();
      focusManager.setFocused(undefined);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
