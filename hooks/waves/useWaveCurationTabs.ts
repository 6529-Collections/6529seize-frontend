"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useWaveCurations } from "./useWaveCurations";

interface UseWaveCurationTabsProps {
  readonly waveId: string;
  readonly enabled?: boolean | undefined;
}

export function useWaveCurationTabs({
  waveId,
  enabled = true,
}: UseWaveCurationTabsProps) {
  const pathname = usePathname();
  const router = useRouter();
  // react-doctor-disable-next-line react-doctor/nextjs-no-use-search-params-without-suspense -- Tab owners render inside MyStreamWave or BrainMobile Suspense boundaries.
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const activeCurationId = searchParams.get("curation");
  const curationsQuery = useWaveCurations({ waveId, enabled });
  const { isSuccess, refetch } = curationsQuery;
  const activeCurationIsAvailable =
    curationsQuery.data?.some((curation) => curation.id === activeCurationId) ??
    false;

  useEffect(() => {
    if (
      !enabled ||
      !waveId ||
      !isSuccess ||
      activeCurationId === null ||
      activeCurationIsAvailable
    ) {
      return;
    }

    let cancelled = false;
    // A cached list can predate a shared link. Confirm missing IDs with the
    // server, sharing any in-flight request, before changing navigation.
    void refetch({ cancelRefetch: false }).then((result) => {
      if (
        cancelled ||
        !result.isSuccess ||
        result.data.some((curation) => curation.id === activeCurationId)
      ) {
        return;
      }

      const params = new URLSearchParams(queryString);
      params.delete("curation");
      const nextQuery = params.toString();
      // react-doctor-disable-next-line react-doctor/nextjs-no-client-side-redirect -- Reconcile a confirmed unavailable curation in viewer-owned URL state.
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [
    activeCurationId,
    activeCurationIsAvailable,
    enabled,
    isSuccess,
    pathname,
    queryString,
    refetch,
    router,
    waveId,
  ]);

  return curationsQuery;
}
