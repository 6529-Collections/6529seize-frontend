import { QueryClient } from "@tanstack/react-query";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { QueryKey } from "../ReactQueryWrapper";
import { ApiWaveDropsFeed } from "../../../generated/models/ApiWaveDropsFeed";
import { ApiDropType } from "../../../generated/models/ApiDropType";

type DropsQueryData = {
  pages?: ApiWaveDropsFeed[];
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
  drop: ApiDrop
): DropsQueryData | undefined => {
  if (!oldData?.pages || oldData.pages.length === 0) {
    return oldData;
  }
  const pages: ApiWaveDropsFeed[] = JSON.parse(JSON.stringify(oldData.pages));
  if (pages[0]) {
    pages[0].drops.unshift({
      ...drop,
      drop_type: ApiDropType.Chat,
    });
    return { ...oldData, pages };
  }
  return oldData;
};

const updateDropsQuery = (
  queryClient: QueryClient,
  queryParams: DropsQueryParams,
  drop: ApiDrop
) => {
  const queryKey = getDropsQueryKey(queryParams);
  queryClient.cancelQueries({ queryKey });
  queryClient.setQueryData<DropsQueryData | undefined>(
    queryKey,
    (oldData) => updateQueryData(oldData, drop),
    {
      updatedAt: Date.now(),
    }
  );
};

export const addDropToDrops = (
  queryClient: QueryClient,
  { drop }: { readonly drop: ApiDrop }
): void => {
  const baseQueryParams: Omit<DropsQueryParams, "dropId"> = {
    limit: 50,
    waveId: drop.wave.id,
  };
  updateDropsQuery(queryClient, { ...baseQueryParams, dropId: null }, drop);
};
