import { QueryClient } from "@tanstack/react-query";
import { Drop } from "../../../generated/models/Drop";
import { QueryKey } from "../ReactQueryWrapper";
import { WaveDropsFeed } from "../../../generated/models/WaveDropsFeed";

type DropsQueryData = {
  pages?: WaveDropsFeed[];
};

type DropsQueryParams = {
  limit: number;
  waveId: string;
  dropId: string | null;
};

const getDropsQueryKey = (params: DropsQueryParams) =>
  [QueryKey.DROPS, params] as const;

const updateQueryData = (
  oldData: DropsQueryData | undefined,
  drop: Drop
): DropsQueryData | undefined => {
  if (!oldData?.pages || oldData.pages.length === 0) {
    return oldData;
  }
  const pages: WaveDropsFeed[] = JSON.parse(JSON.stringify(oldData.pages));
  if (pages[0]) {
    pages[0].drops.unshift(drop);
    return { ...oldData, pages };
  }
  return oldData;
};

const updateDropsQuery = (
  queryClient: QueryClient,
  queryParams: DropsQueryParams,
  drop: Drop
) => {
  const queryKey = getDropsQueryKey(queryParams);
  queryClient.cancelQueries({ queryKey });
  queryClient.setQueryData<DropsQueryData | undefined>(queryKey, (oldData) =>
    updateQueryData(oldData, drop)
  );
};

export const addDropToDrops = (
  queryClient: QueryClient,
  { drop }: { readonly drop: Drop }
): void => {
  const baseQueryParams: Omit<DropsQueryParams, "dropId"> = {
    limit: 50,
    waveId: drop.wave.id,
  };
  updateDropsQuery(queryClient, { ...baseQueryParams, dropId: null }, drop);
};
