import { QueryClient } from "@tanstack/react-query";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { ApiWaveDropsFeed } from "../../../generated/models/ApiWaveDropsFeed";
import { wait } from "../../../helpers/Helpers";
import { QueryKey } from "../ReactQueryWrapper";

const profileDropChangeMutation = ({
  oldData,
  drop,
}: {
  oldData:
    | {
        pages: ApiDrop[][];
      }
    | undefined;
  drop: ApiDrop;
}) => {
  if (!oldData) {
    return oldData;
  }
  return {
    ...oldData,
    pages: oldData.pages.map((page) => {
      return page.map((d) => {
        if (d.id === drop.id) {
          return drop;
        }
        return d;
      });
    }),
  };
};

const dropsDropChangeMutation = ({
  oldData,
  drop,
}: {
  oldData:
    | {
        pages: ApiWaveDropsFeed[];
      }
    | ApiWaveDropsFeed
    | undefined;
  drop: ApiDrop;
}) => {
  if (!oldData) {
    return oldData;
  }

  // Handle infinite query data structure
  if ("pages" in oldData) {
    return {
      ...oldData,
      pages: oldData.pages.map((page) => ({
        ...page,
        drops: page.drops.map((d) => (d.id === drop.id ? drop : d)),
      })),
    };
  }

  // Handle regular query data structure
  return {
    ...oldData,
    drops: oldData.drops.map((d) => (d.id === drop.id ? drop : d)),
  };
};

const invalidateQueries = ({
  key,
  values,
  queryClient,
}: {
  key: QueryKey;
  values: (string | Record<string, any>)[];
  queryClient: QueryClient;
}) => {
  for (const value of values) {
    queryClient.invalidateQueries({
      queryKey: [key, value],
    });
  }
};

export const changeDropInCache = async (
  queryClient: QueryClient,
  drop: ApiDrop,
  giverHandle: string | null
) => {
  queryClient.setQueryData(
    [
      QueryKey.PROFILE_DROPS,
      {
        handleOrWallet: drop.author.handle.toLowerCase(),
        context_profile: giverHandle,
      },
    ],
    (
      oldData:
        | {
            pages: ApiDrop[][];
          }
        | undefined
    ) => profileDropChangeMutation({ oldData, drop })
  );
  queryClient.setQueriesData(
    {
      queryKey: [QueryKey.DROPS],
    },
    (oldData: any) => dropsDropChangeMutation({ oldData, drop })
  );

  await wait(500);
  const queriesToInvalidate = [
    { key: QueryKey.DROP_DISCUSSION, values: [{ drop_id: drop.id }] },
    { key: QueryKey.DROPS_LEADERBOARD, values: [{ waveId: drop.wave.id }] },
    { key: QueryKey.WAVE, values: [{ wave_id: drop.wave.id }] },
    { key: QueryKey.DROP, values: [{ drop_id: drop.id }] },
    { key: QueryKey.WAVE_LOGS, values: [{ waveId: drop.wave.id }] },
    { key: QueryKey.WAVE_VOTERS, values: [{ waveId: drop.wave.id }] },
  ];

  // Invalidate specified queries
  queriesToInvalidate.forEach(({ key, values }) => {
    invalidateQueries({ key, values, queryClient });
  });

  // Invalidate simple query keys
  const simpleQueryKeys = [
    QueryKey.DROPS,
    QueryKey.FEED_ITEMS,
    QueryKey.IDENTITY_NOTIFICATIONS,
  ];

  simpleQueryKeys.forEach((key) => {
    queryClient.invalidateQueries({ queryKey: [key] });
  });
};
