"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { subscribeToDeviceGrantChanges } from "@/lib/device-signing/device-key-store";
import type { QueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

export function useDeviceGrantChangeInvalidation(
  queryClient: QueryClient
): void {
  useEffect(
    () =>
      subscribeToDeviceGrantChanges(({ address, saved }) => {
        if (saved) {
          void queryClient.invalidateQueries({
            queryKey: [QueryKey.DEVICE_GRANTS, address],
            exact: true,
          });
        }
      }),
    [queryClient]
  );
}
