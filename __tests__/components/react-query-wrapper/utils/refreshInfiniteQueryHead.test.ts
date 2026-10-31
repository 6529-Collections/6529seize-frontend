import {
  InfiniteQueryObserver,
  QueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  isInfiniteQueryData,
  mergeInfiniteHead,
  refreshInfiniteQueryHead,
  type InfinitePageAdapter,
} from "@/components/react-query-wrapper/utils/refreshInfiniteQueryHead";

interface Row {
  readonly id: number;
}

interface Page {
  readonly rows: Row[];
  readonly page: number;
  readonly next: number | null;
}

interface FetchContext {
  readonly pageParam: number | null;
  readonly signal: AbortSignal;
}

const adapter: InfinitePageAdapter<Page, Row> = {
  getItems: (page) => page.rows,
  withItems: (page, rows) => ({ ...page, rows }),
  getKey: (row) => row.id,
};

const rows = (...ids: number[]): Row[] => ids.map((id) => ({ id }));
const page = (pageRows: Row[], pageNumber = 1, next: number | null = null) => ({
  rows: pageRows,
  page: pageNumber,
  next,
});
const idsOf = (pages: readonly Page[]) =>
  pages.map((pageData) => pageData.rows.map((row) => row.id));

describe("mergeInfiniteHead", () => {
  it("replaces a lone cached page with the fresh page for both strategies", () => {
    const fresh = page(rows(9, 8, 7));

    expect(
      mergeInfiniteHead([page(rows(5, 4, 3))], fresh, "cursor", adapter)
    ).toEqual([fresh]);
    expect(
      mergeInfiniteHead([page(rows(5, 4, 3))], fresh, "aligned", adapter)
    ).toEqual([fresh]);
  });

  it("returns null when there are no cached pages", () => {
    expect(mergeInfiniteHead([], page(rows(1)), "cursor", adapter)).toBeNull();
  });

  describe("cursor strategy", () => {
    const cached = [
      page(rows(9, 8, 7), 1, 7),
      page(rows(6, 5, 4), 2, 4),
      page(rows(3, 2, 1), 3, 1),
    ];

    it("keeps older pages and carries the cached items the fresh page no longer reaches into the next page", () => {
      const fresh = page(rows(11, 10, 9), 1, 9);

      const merged = mergeInfiniteHead(cached, fresh, "cursor", adapter);

      expect(merged).not.toBeNull();
      expect(idsOf(merged ?? [])).toEqual([
        [11, 10, 9],
        [8, 7, 6, 5, 4],
        [3, 2, 1],
      ]);
      expect(merged?.[0]).toBe(fresh);
      expect(merged?.[1]?.next).toBe(4);
      expect(merged?.[2]).toBe(cached[2]);
    });

    it("drops cached items that moved into the fresh page", () => {
      const fresh = page(rows(5, 9, 8), 1, 8);

      const merged = mergeInfiniteHead(cached, fresh, "cursor", adapter);

      expect(idsOf(merged ?? [])).toEqual([
        [5, 9, 8],
        [7, 6, 4],
        [3, 2, 1],
      ]);
    });

    it("refuses to merge when the fresh page reaches into the next cached page", () => {
      expect(
        mergeInfiniteHead(
          [page(rows(8, 7), 1, 7), page(rows(6, 5, 4), 2, 4)],
          page(rows(7, 6, 5), 1, 5),
          "cursor",
          adapter
        )
      ).toBeNull();
    });

    it("keeps the cached head when the fresh page is unchanged", () => {
      const merged = mergeInfiniteHead(
        cached,
        page(rows(9, 8, 7), 1, 7),
        "cursor",
        adapter
      );

      expect(idsOf(merged ?? [])).toEqual([
        [9, 8, 7],
        [6, 5, 4],
        [3, 2, 1],
      ]);
    });

    it("keeps one copy of an item repeated at a page boundary", () => {
      // A page boundary that repeats its cursor item caches 7 twice.
      const repeatedBoundary = [
        page(rows(9, 8, 7), 1, 7),
        page(rows(7, 6, 5), 2, 5),
      ];

      const merged = mergeInfiniteHead(
        repeatedBoundary,
        page(rows(9, 8, 7), 1, 7),
        "cursor",
        adapter
      );

      expect(idsOf(merged ?? [])).toEqual([
        [9, 8, 7],
        [6, 5],
      ]);
    });

    it("refuses to merge when the fresh page does not overlap the cache", () => {
      expect(
        mergeInfiniteHead(cached, page(rows(30, 29, 28)), "cursor", adapter)
      ).toBeNull();
    });

    it("refuses to merge when the fresh page does not end where it overlaps", () => {
      // 7 is cached, but the fresh page also reaches 1 which is not in the
      // cached head page, so items could be skipped.
      expect(
        mergeInfiniteHead(
          cached,
          page(rows(9, 7, 0), 1, 0),
          "cursor",
          adapter
        )
      ).toBeNull();
    });

    it("refuses to merge an empty fresh page", () => {
      expect(
        mergeInfiniteHead(cached, page([]), "cursor", adapter)
      ).toBeNull();
    });
  });

  describe("aligned strategy", () => {
    const cached = [page(rows(9, 8, 7), 1, 7), page(rows(6, 5, 4), 2, 4)];

    it("swaps the first page when its items are unchanged", () => {
      const fresh = page(rows(9, 8, 7), 1, 7);

      const merged = mergeInfiniteHead(cached, fresh, "aligned", adapter);

      expect(merged).toEqual([fresh, cached[1]]);
      expect(merged?.[0]).toBe(fresh);
      expect(merged?.[1]).toBe(cached[1]);
    });

    it.each([
      ["a new item", rows(10, 9, 8)],
      ["a removed item", rows(9, 7, 6)],
      ["a reordered item", rows(9, 7, 8)],
      ["a shorter page", rows(9, 8)],
    ])("refuses to merge after %s moved later pages", (_label, freshRows) => {
      expect(
        mergeInfiniteHead(cached, page(freshRows), "aligned", adapter)
      ).toBeNull();
    });
  });
});

describe("isInfiniteQueryData", () => {
  it("accepts infinite data only", () => {
    expect(isInfiniteQueryData({ pages: [], pageParams: [] })).toBe(true);
    expect(isInfiniteQueryData({ pages: [] })).toBe(false);
    expect(isInfiniteQueryData({ unread_count: 1 })).toBe(false);
    expect(isInfiniteQueryData(undefined)).toBe(false);
    expect(isInfiniteQueryData(null)).toBe(false);
  });
});

describe("refreshInfiniteQueryHead", () => {
  const QUERY_KEY = ["REFRESH_HEAD_TEST", { list: "a" }] as const;
  const PAGE_SIZE = 3;

  let queryClient: QueryClient;
  let serverIds: number[];
  let queryFn: jest.Mock<Promise<Page>, [FetchContext]>;
  let observer: InfiniteQueryObserver<
    Page,
    Error,
    InfiniteData<Page, number | null>,
    typeof QUERY_KEY,
    number | null
  >;
  let unsubscribe: () => void;

  // Newest first. A cursor is the id of the last row of the previous page.
  const readServerPage = (cursor: number | null): Page => {
    const start = cursor === null ? 0 : serverIds.indexOf(cursor) + 1;
    const pageRows = serverIds.slice(start, start + PAGE_SIZE);
    const last = pageRows.at(-1);
    const hasMore = start + PAGE_SIZE < serverIds.length;
    return page(
      pageRows.map((id) => ({ id })),
      1,
      hasMore && last !== undefined ? last : null
    );
  };

  const cachedPages = () =>
    queryClient.getQueryData<InfiniteData<Page, number | null>>(QUERY_KEY)
      ?.pages ?? [];

  const refresh = (
    strategy: "cursor" | "aligned" = "cursor",
    signal: AbortSignal = new AbortController().signal,
    queryKey: readonly unknown[] = QUERY_KEY
  ) =>
    refreshInfiniteQueryHead({
      queryClient,
      queryKey,
      strategy,
      adapter,
      signal,
    });

  const loadPages = async (count: number) => {
    await observer.refetch();
    for (let loaded = 1; loaded < count; loaded++) {
      await observer.fetchNextPage();
    }
    queryFn.mockClear();
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    serverIds = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
    queryFn = jest.fn(async ({ pageParam }: FetchContext) =>
      readServerPage(pageParam)
    );
    observer = new InfiniteQueryObserver(queryClient, {
      queryKey: QUERY_KEY,
      queryFn,
      initialPageParam: null as number | null,
      getNextPageParam: (lastPage: Page) => lastPage.next,
      enabled: false,
    });
    unsubscribe = observer.subscribe(() => undefined);
  });

  afterEach(() => {
    unsubscribe();
    queryClient.clear();
  });

  it("requests only the first page and keeps the older pages", async () => {
    await loadPages(3);
    expect(idsOf(cachedPages())).toEqual([
      [12, 11, 10],
      [9, 8, 7],
      [6, 5, 4],
    ]);

    serverIds = [14, 13, ...serverIds];
    await expect(refresh()).resolves.toBe(true);

    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(queryFn).toHaveBeenCalledWith(
      expect.objectContaining({ pageParam: null, queryKey: QUERY_KEY })
    );
    expect(idsOf(cachedPages())).toEqual([
      [14, 13, 12],
      [11, 10, 9, 8, 7],
      [6, 5, 4],
    ]);
  });

  it("keeps load-more contiguous after a first-page refresh", async () => {
    await loadPages(2);
    serverIds = [14, 13, ...serverIds];
    await refresh();
    queryFn.mockClear();

    await observer.fetchNextPage();

    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(queryFn).toHaveBeenCalledWith(
      expect.objectContaining({ pageParam: 7 })
    );
    expect(cachedPages().flatMap((pageData) => pageData.rows)).toEqual(
      rows(14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4)
    );
  });

  it("applies a change to the first page that does not move any later page", async () => {
    await loadPages(2);
    const before = cachedPages();

    await expect(refresh()).resolves.toBe(true);

    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(idsOf(cachedPages())).toEqual(idsOf(before));
  });

  it("falls back to a full refetch when too many new items arrived to connect", async () => {
    await loadPages(2);
    serverIds = [20, 19, 18, 17, ...serverIds];
    const before = cachedPages();

    await expect(refresh()).resolves.toBe(false);

    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(cachedPages()).toBe(before);
  });

  it("replaces a single cached page even when nothing connects", async () => {
    await loadPages(1);
    serverIds = [20, 19, 18, 17, ...serverIds];

    await expect(refresh()).resolves.toBe(true);

    expect(idsOf(cachedPages())).toEqual([[20, 19, 18]]);
  });

  it("only swaps an unchanged first page for aligned lists", async () => {
    await loadPages(2);
    serverIds = [14, ...serverIds];
    const before = cachedPages();

    await expect(refresh("aligned")).resolves.toBe(false);
    expect(cachedPages()).toBe(before);

    serverIds = serverIds.slice(1);
    await expect(refresh("aligned")).resolves.toBe(true);
  });

  it("starts from the first loaded page param", async () => {
    queryClient.setQueryData(QUERY_KEY, {
      pages: [page(rows(9, 8, 7), 3, 7), page(rows(6, 5, 4), 4, 4)],
      pageParams: [10, 7],
    });

    await refresh();

    expect(queryFn).toHaveBeenCalledWith(
      expect.objectContaining({ pageParam: 10 })
    );
  });

  it("asks for a full refetch when the query is not cached", async () => {
    await loadPages(2);

    await expect(refresh("cursor", undefined, ["MISSING"])).resolves.toBe(false);
    expect(queryFn).not.toHaveBeenCalled();
  });

  it("asks for a full refetch when the cached data is not an infinite list", async () => {
    await loadPages(2);
    const counterKey = [...QUERY_KEY, "counter"];
    queryClient.setQueryData(counterKey, { unread_count: 1 });

    await expect(refresh("cursor", undefined, counterKey)).resolves.toBe(false);
    expect(queryFn).not.toHaveBeenCalled();
  });

  it("leaves a fetch that is already in flight to the caller", async () => {
    await loadPages(2);
    let finishFetch!: (value: Page) => void;
    queryFn.mockImplementationOnce(
      () =>
        new Promise<Page>((resolve) => {
          finishFetch = resolve;
        })
    );
    const inFlight = observer.refetch();

    await expect(refresh()).resolves.toBe(false);
    expect(queryFn).toHaveBeenCalledTimes(1);

    finishFetch(readServerPage(null));
    await inFlight;
  });

  it("does nothing once the caller is gone", async () => {
    await loadPages(2);
    const controller = new AbortController();
    controller.abort();

    await expect(refresh("cursor", controller.signal)).resolves.toBe(true);
    expect(queryFn).not.toHaveBeenCalled();
  });

  it("discards a first page that arrives after the caller is gone", async () => {
    await loadPages(2);
    const before = cachedPages();
    const controller = new AbortController();
    let finishFetch!: (value: Page) => void;
    queryFn.mockImplementationOnce(
      () =>
        new Promise<Page>((resolve) => {
          finishFetch = resolve;
        })
    );
    serverIds = [14, 13, ...serverIds];

    const pending = refresh("cursor", controller.signal);
    controller.abort();
    finishFetch(readServerPage(null));

    await expect(pending).resolves.toBe(true);
    expect(cachedPages()).toBe(before);
  });

  it("writes nothing when the query was removed while the request was in flight", async () => {
    await loadPages(2);
    let finishFetch!: (value: Page) => void;
    queryFn.mockImplementationOnce(
      () =>
        new Promise<Page>((resolve) => {
          finishFetch = resolve;
        })
    );
    serverIds = [14, 13, ...serverIds];

    const pending = refresh();
    queryClient.removeQueries({ queryKey: QUERY_KEY });
    finishFetch(readServerPage(null));

    await expect(pending).resolves.toBe(false);
    expect(queryClient.getQueryData(QUERY_KEY)).toBeUndefined();
  });

  it("hands the first page request the abort signal of its caller", async () => {
    await loadPages(2);
    const controller = new AbortController();

    await refresh("cursor", controller.signal);

    expect(queryFn.mock.calls[0]?.[0].signal).toBe(controller.signal);
  });

  it("does not repeat a request that failed with a client error", async () => {
    await loadPages(2);
    queryFn.mockRejectedValueOnce(
      Object.assign(new Error("Too many requests"), { status: 429 })
    );
    const before = cachedPages();

    await expect(refresh()).resolves.toBe(true);

    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(cachedPages()).toBe(before);
  });

  it("asks for a full refetch, with its retry policy, after a transient failure", async () => {
    await loadPages(2);
    queryFn.mockRejectedValueOnce(new Error("Network error"));

    await expect(refresh()).resolves.toBe(false);
  });

  it("runs one more refresh for events that arrive while one is in flight", async () => {
    await loadPages(2);
    const resolvers: Array<(value: Page) => void> = [];
    queryFn.mockImplementation(
      () =>
        new Promise<Page>((resolve) => {
          resolvers.push(resolve);
        })
    );

    const first = refresh();
    await Promise.resolve();
    const second = refresh();
    const third = refresh();
    await expect(second).resolves.toBe(true);
    await expect(third).resolves.toBe(true);
    expect(queryFn).toHaveBeenCalledTimes(1);

    serverIds = [13, ...serverIds];
    resolvers[0]?.(readServerPage(null));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(queryFn).toHaveBeenCalledTimes(2);

    serverIds = [14, ...serverIds];
    resolvers[1]?.(readServerPage(null));
    await expect(first).resolves.toBe(true);

    expect(queryFn).toHaveBeenCalledTimes(2);
    expect(cachedPages()[0]?.rows[0]).toEqual({ id: 14 });
  });
});
