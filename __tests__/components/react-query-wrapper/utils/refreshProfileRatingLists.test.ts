import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiProfileProxy } from "@/generated/models/ApiProfileProxy";
import { InfiniteQueryObserver, QueryClient } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { refreshProfileRatingLists } from "@/components/react-query-wrapper/utils/refreshProfileRatingLists";

function observeList(
  client: QueryClient,
  matter: "REP" | "NIC",
  direction: "given" | "received",
  identity = direction === "given" ? "owner" : "recipient",
  category: string | null = null,
  orderBy: "rating" | "last_modified" = "rating"
) {
  const queryKey = [
    QueryKey.PROFILE_RATING_LIST,
    { matter, direction, identity, category, orderBy },
  ];
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

const owner = {
  handle: "Owner",
  query: "0xOwner",
  primary_wallet: "0xOwner",
  display: "Owner",
} as ApiIdentity;
const recipient = {
  handle: "Recipient",
  query: "0xRecipient",
  display: "Recipient",
} as ApiIdentity;
const scope = {
  targetProfiles: [recipient],
  connectedProfile: owner,
  profileProxy: null,
};

it.each(["REP", "NIC"] as const)(
  "%s saves request only the first Given page and keep Load more working",
  async (matter) => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    const given = observeList(client, matter, "given");
    const recent = observeList(
      client,
      matter,
      "given",
      "owner",
      null,
      "last_modified"
    );
    const received = observeList(client, matter, "received");
    const other = observeList(
      client,
      matter === "REP" ? "NIC" : "REP",
      "given"
    );
    const alias = observeList(client, matter, "given", "0xOWNER", "Art");
    const unrelatedGiven = observeList(client, matter, "given", "someone-else");
    const unrelatedReceived = observeList(
      client,
      matter,
      "received",
      "someone-else"
    );
    try {
      await refreshProfileRatingLists(client, matter, scope);

      expect(
        given.fetchPage.mock.calls.map(([request]) => request.pageParam)
      ).toEqual([1]);
      expect(given.observer.getCurrentResult().data?.pages).toHaveLength(1);
      expect(
        recent.fetchPage.mock.calls.map(([request]) => request.pageParam)
      ).toEqual([1]);
      expect(recent.observer.getCurrentResult().data?.pages).toHaveLength(1);
      expect(
        alias.fetchPage.mock.calls.map(([request]) => request.pageParam)
      ).toEqual([1]);
      for (const unrelated of [unrelatedGiven, unrelatedReceived]) {
        expect(unrelated.fetchPage).not.toHaveBeenCalled();
        expect(unrelated.observer.getCurrentResult().data?.pages).toHaveLength(
          3
        );
      }
      // The recipient's Received list keeps its full refresh; the other matter is untouched.
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
      alias.unsubscribe();
      unrelatedGiven.unsubscribe();
      unrelatedReceived.unsubscribe();
      given.unsubscribe();
      recent.unsubscribe();
      received.unsubscribe();
      other.unsubscribe();
      client.clear();
    }
  }
);

it("refreshes the proxy grantor's Given lists without resetting the delegate's lists", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const grantor = observeList(client, "REP", "given", "0xGRANTOR");
  const delegate = observeList(client, "REP", "given", "owner");
  try {
    await refreshProfileRatingLists(client, "REP", {
      ...scope,
      profileProxy: {
        created_by: {
          id: "grantor-id",
          handle: "grantor",
          primary_address: "0xGrantor",
        },
      } as ApiProfileProxy,
    });
    expect(
      grantor.fetchPage.mock.calls.map(([request]) => request.pageParam)
    ).toEqual([1]);
    expect(delegate.fetchPage).not.toHaveBeenCalled();
    expect(delegate.observer.getCurrentResult().data?.pages).toHaveLength(3);
  } finally {
    grantor.unsubscribe();
    delegate.unsubscribe();
    client.clear();
  }
});

it("matches a wallet rater when no connected profile is available", async () => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const given = observeList(client, "NIC", "given", "0xRATER");
  try {
    await refreshProfileRatingLists(client, "NIC", {
      ...scope,
      connectedProfile: null,
      rater: "0xrater",
    });
    expect(
      given.fetchPage.mock.calls.map(([request]) => request.pageParam)
    ).toEqual([1]);
  } finally {
    given.unsubscribe();
    client.clear();
  }
});
