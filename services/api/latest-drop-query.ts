import { queryOptions } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { ApiMemesExtendedData } from "@/generated/models/ApiMemesExtendedData";
import type { ApiWave } from "@/generated/models/ApiWave";
import { commonApiFetch } from "@/services/api/common-api";
import {
  fetchWaveDecisionsV2,
  getWaveDecisionsPageParams,
} from "@/services/api/wave-decisions-v2-api";
import { getWaveDecisionsQueryKey } from "@/services/api/wave-query";

// Requests behind the home Latest Drop. The home page starts them on the
// server and the browser queries adopt them, so both sides share these.

export const fetchMemesLatest = (signal?: AbortSignal) =>
  commonApiFetch<ApiMemesExtendedData>({
    endpoint: "memes_latest",
    ...(signal ? { signal } : {}),
  });

export const memesLatestQueryOptions = queryOptions({
  queryKey: [QueryKey.MEMES_LATEST],
  queryFn: () => fetchMemesLatest(),
});

/** The Memes wave, as `useWaveById` requests it. */
export const fetchMemesWave = (waveId: string, signal?: AbortSignal) =>
  commonApiFetch<ApiWave>({
    endpoint: `waves/${waveId}`,
    errorMode: "structured",
    ...(signal ? { signal } : {}),
  });

/** The next mint is the winner of the Memes wave's newest decision. */
export const NEXT_MINT_DECISIONS_PAGE_SIZE = 1;
export const NEXT_MINT_DECISIONS_PAGE = 1;

export const getNextMintDecisionsQueryKey = (waveId: string) =>
  getWaveDecisionsQueryKey(waveId, NEXT_MINT_DECISIONS_PAGE_SIZE);

export const fetchNextMintDecisions = (waveId: string, signal?: AbortSignal) =>
  fetchWaveDecisionsV2({
    waveId,
    params: getWaveDecisionsPageParams(
      NEXT_MINT_DECISIONS_PAGE,
      NEXT_MINT_DECISIONS_PAGE_SIZE
    ),
    signal,
  });
