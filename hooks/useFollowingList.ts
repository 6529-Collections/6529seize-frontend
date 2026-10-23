import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { fetchFollowingPage } from "@/services/api/following";

export function useFollowingCount(identityId: string) {
  return useQuery({
    queryKey: [QueryKey.IDENTITY_FOLLOWING, identityId, "count"],
    // The existing endpoint has a minimum page size of one, but its count is
    // the full total. Cache only that total, not the unused profile row.
    queryFn: async ({ signal }) =>
      (await fetchFollowingPage(1, signal, 1)).count,
    staleTime: 60_000,
    gcTime: 0,
  });
}

export default function useFollowingList(identityId: string, enabled = true) {
  const query = useInfiniteQuery({
    queryKey: [QueryKey.IDENTITY_FOLLOWING, identityId, "list"],
    enabled,
    queryFn: ({ pageParam, signal }) => fetchFollowingPage(pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
    // Private data is kept only while its own-profile owner is mounted.
    staleTime: 60_000,
    gcTime: 0,
  });
  const following = Array.from(
    new Map(
      query.data?.pages.flatMap((page) =>
        page.data.map((row) => [row.identity.id, row] as const)
      )
    ).values()
  );

  return {
    ...query,
    following,
    count:
      query.isError && !query.isFetchNextPageError
        ? undefined
        : query.data?.pages[0]?.count,
    onBottomIntersection: (visible: boolean) => {
      if (
        enabled &&
        visible &&
        query.hasNextPage &&
        !query.isFetching &&
        !query.isError
      ) {
        void query.fetchNextPage({ cancelRefetch: false });
      }
    },
  };
}
