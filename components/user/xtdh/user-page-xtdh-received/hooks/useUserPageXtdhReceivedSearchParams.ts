'use client';

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { UpdateParamsHandler } from "./useUserPageXtdhReceivedFilters";

/**
 * Centralises reading & writing URL search params while preventing scroll jumps.
 */
export function useUserPageXtdhReceivedSearchParams(): {
  readonly searchParams: ReturnType<typeof useSearchParams>;
  readonly handleUpdateParams: UpdateParamsHandler;
} {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const handleUpdateParams = useCallback<UpdateParamsHandler>(
    (updater) => {
      if (!pathname) return;
      const params = new URLSearchParams(searchParams?.toString() ?? "");
      updater(params);
      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams]
  );

  return { searchParams, handleUpdateParams };
}
