'use client';

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import type { UpdateXtdhReceivedParamsHandler } from "./useXtdhUserReceivedFilters";

/**
 * Centralises reading & writing URL search params while preventing scroll jumps.
 */
export function useXtdhUserReceivedSearchParams(): {
  readonly searchParams: ReturnType<typeof useSearchParams>;
  readonly handleUpdateParams: UpdateXtdhReceivedParamsHandler;
} {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const handleUpdateParams = useCallback<UpdateXtdhReceivedParamsHandler>(
    (updater) => {
      if (!pathname) return;
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      updater(params);
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  return { searchParams, handleUpdateParams };
}

