"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";
import { fetchOfficialWaves } from "@/services/api/waves-v2-api";

interface UseOfficialWavesProps {
  readonly viewerIdentityKey?: string | null | undefined;
  readonly refetchInterval?: number | undefined;
  readonly refetchIntervalInBackground?: boolean | undefined;
}

interface OfficialWavesQueryKeyParams {
  readonly viewer_identity?: string | undefined;
}

function getOfficialWavesQueryKeyParams(
  viewerIdentityKey: string | null | undefined
): OfficialWavesQueryKeyParams {
  const normalizedViewerIdentityKey =
    viewerIdentityKey?.trim().toLowerCase() ?? null;

  return normalizedViewerIdentityKey
    ? { viewer_identity: normalizedViewerIdentityKey }
    : {};
}

export function useOfficialWaves({
  viewerIdentityKey,
  refetchInterval = Infinity,
  refetchIntervalInBackground = false,
}: UseOfficialWavesProps = {}) {
  const queryKeyParams = useMemo(
    () => getOfficialWavesQueryKeyParams(viewerIdentityKey),
    [viewerIdentityKey]
  );
  const [lastErrorTimestamp, setLastErrorTimestamp] = useState<number | null>(
    null
  );
  const handleRetryFailure = useCallback(() => {
    setLastErrorTimestamp(Date.now());
  }, []);

  const query = useQuery({
    queryKey: [QueryKey.OFFICIAL_WAVES, queryKeyParams],
    queryFn: fetchOfficialWaves,
    refetchInterval,
    refetchIntervalInBackground,
    ...getDefaultQueryRetry(handleRetryFailure),
  });

  const waves = useMemo(() => query.data ?? [], [query.data]);

  const refetch = useCallback(() => {
    if (
      lastErrorTimestamp !== null &&
      Date.now() - lastErrorTimestamp < 30000
    ) {
      setTimeout(() => {
        void query.refetch().catch(() => undefined);
      }, 30000);
      return;
    }
    void query.refetch().catch(() => undefined);
  }, [lastErrorTimestamp, query]);

  return useMemo(
    () => ({
      waves,
      isFetching: query.isFetching,
      status: query.status,
      refetch,
    }),
    [waves, query.isFetching, query.status, refetch]
  );
}
