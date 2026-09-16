"use client";

import {
  environmentManager,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { useState } from "react";

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 10000,
        refetchOnWindowFocus: false,
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

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
