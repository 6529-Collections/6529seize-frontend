import { useInfiniteQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { fetchFollowingPage } from "@/services/api/following";

export default function useFollowingList(identityId: string) {
  const query = useInfiniteQuery({
    queryKey: [QueryKey.IDENTITY_FOLLOWING, identityId],
    queryFn: ({ pageParam, signal }) => fetchFollowingPage(pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.next ? lastPage.page + 1 : undefined,
    // Private data is kept only while its own-profile owner is mounted.
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
      if (visible && query.hasNextPage && !query.isFetching && !query.isError) {
        void query.fetchNextPage({ cancelRefetch: false });
      }
    },
  };
}
