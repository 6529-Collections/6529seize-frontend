import type {
  InfiniteData,
  Query,
  QueryClient,
  QueryKey,
} from "@tanstack/react-query";
import { shouldRetryQuery } from "./query-utils";

/** How a page of an infinite list exposes the items that identify it. */
export interface InfinitePageAdapter<TPage, TItem> {
  readonly getItems: (page: TPage) => readonly TItem[];
  readonly withItems: (page: TPage, items: TItem[]) => TPage;
  readonly getKey: (item: TItem) => string | number;
}

/**
 * `cursor`: each page continues from the last item of the previous one, so
 * pages stay valid when newer items arrive (serial-number and id cursors).
 * `aligned`: pages are fixed offsets (`page` numbers), so newer or removed
 * items shift every later page; only an unchanged first page is safe to swap.
 * Any inserted, removed or reordered item in the first page therefore falls
 * back to the full refetch; the saving there is the events that leave the first
 * page as it was, such as updates for other drops in the same wave.
 */
export type InfiniteHeadStrategy = "cursor" | "aligned";

export const isInfiniteQueryData = (
  data: unknown
): data is InfiniteData<unknown> =>
  typeof data === "object" &&
  data !== null &&
  Array.isArray((data as { pages?: unknown }).pages) &&
  Array.isArray((data as { pageParams?: unknown }).pageParams);

const hasSameKeys = <TItem>(
  left: readonly TItem[],
  right: readonly TItem[],
  getKey: (item: TItem) => string | number
): boolean =>
  left.length === right.length &&
  left.every((item, index) => getKey(item) === getKey(right[index] as TItem));

// Items are matched by key, so a key is assumed to name one item in the list
// (serial numbers and ids are unique). A key found in both the fresh first page
// and a later cached page is the same item seen twice, for example a page
// boundary that repeats its cursor item, so only the fresh copy is kept.
const mergeCursorHead = <TPage, TItem>(
  pages: readonly TPage[],
  head: TPage,
  adapter: InfinitePageAdapter<TPage, TItem>
): TPage[] | null => {
  const [cachedHead, nextPage, ...olderPages] = pages;
  if (cachedHead === undefined || nextPage === undefined) {
    return null;
  }

  const headItems = adapter.getItems(head);
  const lastHeadItem = headItems.at(-1);
  if (lastHeadItem === undefined) {
    return null;
  }

  const headKeys = new Set(headItems.map(adapter.getKey));
  const cachedItems = adapter.getItems(cachedHead);
  const overlapIndex = cachedItems.findLastIndex((item) =>
    headKeys.has(adapter.getKey(item))
  );
  const overlapItem = cachedItems[overlapIndex];
  // The fresh page has to meet the cached page where it ends, otherwise items
  // between the two could be skipped.
  if (
    overlapItem === undefined ||
    adapter.getKey(overlapItem) !== adapter.getKey(lastHeadItem)
  ) {
    return null;
  }

  const withoutHead = (items: readonly TItem[]) =>
    items.filter((item) => !headKeys.has(adapter.getKey(item)));
  const withoutHeadItems = (page: TPage): TPage => {
    const items = adapter.getItems(page);
    const kept = withoutHead(items);
    return kept.length === items.length ? page : adapter.withItems(page, kept);
  };
  // Cached items the fresh page no longer reaches continue straight into the
  // following page, which keeps the page count and every later cursor intact.
  return [
    head,
    adapter.withItems(nextPage, [
      ...cachedItems.slice(overlapIndex + 1),
      ...withoutHead(adapter.getItems(nextPage)),
    ]),
    ...olderPages.map(withoutHeadItems),
  ];
};

/**
 * Pure merge of a freshly fetched first page into the cached pages. Returns
 * `null` when the cached pages cannot be kept consistent with the fresh page.
 */
export const mergeInfiniteHead = <TPage, TItem>(
  pages: readonly TPage[],
  head: TPage,
  strategy: InfiniteHeadStrategy,
  adapter: InfinitePageAdapter<TPage, TItem>
): TPage[] | null => {
  const [cachedHead, ...olderPages] = pages;
  if (cachedHead === undefined) {
    return null;
  }
  // Later pages are read from the end of this one, so a lone page is always
  // replaceable.
  if (olderPages.length === 0) {
    return [head];
  }
  if (strategy === "cursor") {
    return mergeCursorHead(pages, head, adapter);
  }
  return hasSameKeys(
    adapter.getItems(head),
    adapter.getItems(cachedHead),
    adapter.getKey
  )
    ? [head, ...olderPages]
    : null;
};

interface RunningRefresh {
  /** Counts the refresh requests received, including the one being run. */
  requests: number;
}

// One refresh per query at a time; events that arrive meanwhile run once more
// afterwards instead of stacking requests or cancelling the one in flight. The
// map is keyed by the `Query` object, so it never mixes clients and entries go
// away with the query. A refresh that outlives its query writes nothing: the
// result is merged into whatever the cache holds under the key when the
// request settles, and a removed query is not recreated.
const runningRefreshes = new WeakMap<Query, RunningRefresh>();

// A read through a function keeps the compiler from assuming the signal stays
// unaborted across the awaits below.
const isAborted = (signal: AbortSignal): boolean => signal.aborted;

const readInitialPageParam = (query: Query): unknown =>
  (query.options as { readonly initialPageParam?: unknown }).initialPageParam;

async function refreshOnce<TPage, TItem>({
  queryClient,
  query,
  strategy,
  adapter,
  signal,
}: {
  readonly queryClient: QueryClient;
  readonly query: Query;
  readonly strategy: InfiniteHeadStrategy;
  readonly adapter: InfinitePageAdapter<TPage, TItem>;
  readonly signal: AbortSignal;
}): Promise<boolean> {
  const queryFn = query.options.queryFn;
  const cached = query.state.data;
  if (typeof queryFn !== "function" || !isInfiniteQueryData(cached)) {
    return false;
  }

  let head: TPage;
  try {
    head = (await queryFn({
      client: queryClient,
      queryKey: query.queryKey,
      signal,
      meta: query.options.meta,
      pageParam: cached.pageParams[0] ?? readInitialPageParam(query),
    })) as TPage;
  } catch (error) {
    // A request that was aborted or that failed with a client error would
    // fail the same way again, so only transient failures fall back to the
    // full refetch and its retry policy.
    return signal.aborted || !shouldRetryQuery(0, error);
  }
  if (signal.aborted) {
    return true;
  }

  const current = queryClient.getQueryData<InfiniteData<TPage>>(query.queryKey);
  const pages = current
    ? mergeInfiniteHead(current.pages, head, strategy, adapter)
    : null;
  if (!current || !pages) {
    return false;
  }
  queryClient.setQueryData(query.queryKey, { ...current, pages });
  return true;
}

/**
 * Refreshes only the newest page of a loaded infinite list.
 *
 * `refetch()` and `invalidateQueries()` replay every loaded page one request
 * at a time, and realtime events can arrive every second. This runs the query's
 * own `queryFn` for the first page only and merges that page into the cached
 * pages, so older pages, the scroll position and load-more keep working. Older
 * pages are not re-read: drops and notifications already change in place
 * through their own realtime handlers, and mounting, focusing or reconnecting
 * still refetches every page.
 *
 * Resolves `true` when the list is up to date or a refresh for it is already
 * under way, and `false` when the caller should run a full refetch instead
 * (nothing cached, the merge cannot be proven safe, or a transient failure). A
 * fetch that is already in flight also answers `false`, so the caller's own
 * rules for in-flight requests apply unchanged.
 */
export async function refreshInfiniteQueryHead<TPage, TItem>({
  queryClient,
  queryKey,
  strategy,
  adapter,
  signal,
}: {
  readonly queryClient: QueryClient;
  readonly queryKey: QueryKey;
  readonly strategy: InfiniteHeadStrategy;
  readonly adapter: InfinitePageAdapter<TPage, TItem>;
  readonly signal: AbortSignal;
}): Promise<boolean> {
  if (isAborted(signal)) {
    return true;
  }
  const query = queryClient.getQueryCache().find({ queryKey, exact: true });
  if (
    !query ||
    query.state.fetchStatus === "fetching" ||
    !isInfiniteQueryData(query.state.data)
  ) {
    return false;
  }

  const running = runningRefreshes.get(query);
  if (running) {
    running.requests += 1;
    return true;
  }

  const refresh: RunningRefresh = { requests: 1 };
  runningRefreshes.set(query, refresh);
  try {
    let handled: boolean;
    let serviced: number;
    do {
      serviced = refresh.requests;
      handled = await refreshOnce({
        queryClient,
        query,
        strategy,
        adapter,
        signal,
      });
    } while (handled && refresh.requests !== serviced && !isAborted(signal));
    return handled;
  } finally {
    runningRefreshes.delete(query);
  }
}
