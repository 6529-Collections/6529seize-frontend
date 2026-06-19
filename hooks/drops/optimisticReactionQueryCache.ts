import type { ApiDropContextProfileContext } from "@/generated/models/ApiDropContextProfileContext";
import type { QueryClient, QueryKey } from "@tanstack/react-query";

type OptimisticRollback = (() => void) | null;

export const EMPTY_DROP_CONTEXT_PROFILE_CONTEXT: ApiDropContextProfileContext =
  {
    rating: 0,
    min_rating: 0,
    max_rating: 0,
    reaction: null,
    boosted: false,
    bookmarked: false,
    curatable: false,
    curated: false,
  };

export const applyOptimisticReactionQueryCacheUpdate = ({
  isTargetQueryKey,
  queryClient,
  updateData,
}: {
  readonly isTargetQueryKey: (queryKey: QueryKey) => boolean;
  readonly queryClient: QueryClient;
  readonly updateData: (data: unknown) => unknown;
}): OptimisticRollback => {
  const matchingQueries = queryClient.getQueryCache().findAll({
    predicate: (query) => isTargetQueryKey(query.queryKey),
  });

  if (matchingQueries.length === 0) {
    return null;
  }

  const snapshots: Array<{
    readonly queryKey: QueryKey;
    readonly data: unknown;
  }> = [];

  for (const query of matchingQueries) {
    const currentData = query.state.data;
    const nextData = updateData(currentData);

    if (nextData === currentData) {
      continue;
    }

    snapshots.push({
      queryKey: query.queryKey,
      data: currentData,
    });
    queryClient.setQueryData(query.queryKey, nextData);
  }

  if (snapshots.length === 0) {
    return null;
  }

  return () => {
    for (const snapshot of snapshots) {
      queryClient.setQueryData(snapshot.queryKey, snapshot.data);
    }
  };
};
