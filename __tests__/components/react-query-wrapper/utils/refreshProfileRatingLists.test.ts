import { InfiniteQueryObserver, QueryClient } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { refreshProfileRatingLists } from "@/components/react-query-wrapper/utils/refreshProfileRatingLists";

function observeList(
  client: QueryClient,
  matter: "REP" | "NIC",
  direction: "given" | "received"
) {
  const queryKey = [QueryKey.PROFILE_RATING_LIST, { matter, direction }];
  const pages = [1, 2, 3].map((page) => ({ page, next: page < 3 }));
  client.setQueryData(queryKey, { pages, pageParams: [1, 2, 3] });
  const fetchPage = jest.fn(async ({ pageParam }: { pageParam: number }) => ({
    page: pageParam,
    next: pageParam < 3,
  }));
  const observer = new InfiniteQueryObserver(client, {
    queryKey,
    queryFn: fetchPage,
    initialPageParam: 1,
    getNextPageParam: (page) => (page.next ? page.page + 1 : undefined),
    staleTime: Infinity,
  });
  const unsubscribe = observer.subscribe(() => {});
  return { observer, fetchPage, unsubscribe };
}

it.each(["REP", "NIC"] as const)(
  "%s saves request only the first Given page and keep Load more working",
  async (matter) => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const given = observeList(client, matter, "given");
    const received = observeList(client, matter, "received");
    const other = observeList(
      client,
      matter === "REP" ? "NIC" : "REP",
      "given"
    );
    try {
      await refreshProfileRatingLists(client, matter);

      expect(
        given.fetchPage.mock.calls.map(([request]) => request.pageParam)
      ).toEqual([1]);
      expect(given.observer.getCurrentResult().data?.pages).toHaveLength(1);
      // Received keeps its existing full refresh; the other matter is untouched.
      expect(
        received.fetchPage.mock.calls.map(([request]) => request.pageParam)
      ).toEqual([1, 2, 3]);
      expect(other.fetchPage).not.toHaveBeenCalled();
      expect(other.observer.getCurrentResult().data?.pages).toHaveLength(3);

      await given.observer.fetchNextPage();
      expect(
        given.fetchPage.mock.calls.map(([request]) => request.pageParam)
      ).toEqual([1, 2]);
      expect(given.observer.getCurrentResult().data?.pages).toHaveLength(2);
    } finally {
      given.unsubscribe();
      received.unsubscribe();
      other.unsubscribe();
      client.clear();
    }
  }
);
