import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { refetchQueryIfStale } from "@/components/react-query-wrapper/utils/refetchQueryIfStale";

const QUERY_KEY = ["SIDEBAR_TEST", { page_size: 20 }] as const;
const STALE_TIME_MS = 60_000;

let queryClient: QueryClient;
const unsubscribers: Array<() => void> = [];

const observe = ({
  queryFn,
  enabled = true,
}: {
  readonly queryFn: () => Promise<string>;
  readonly enabled?: boolean;
}) => {
  const observer = new QueryObserver(queryClient, {
    queryKey: QUERY_KEY,
    queryFn,
    enabled,
    staleTime: STALE_TIME_MS,
    refetchOnMount: false,
  });
  unsubscribers.push(observer.subscribe(() => undefined));
  return observer;
};

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
});

afterEach(() => {
  unsubscribers.splice(0).forEach((unsubscribe) => unsubscribe());
  queryClient.clear();
});

describe("refetchQueryIfStale", () => {
  it("keeps data that is still within its staleTime", async () => {
    const queryFn = jest.fn().mockResolvedValue("next");
    queryClient.setQueryData(QUERY_KEY, "fresh");
    observe({ queryFn });

    refetchQueryIfStale(queryClient, QUERY_KEY);
    await flushPromises();

    expect(queryFn).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(QUERY_KEY)).toBe("fresh");
  });

  it("refetches data past its staleTime", async () => {
    const queryFn = jest.fn().mockResolvedValue("next");
    queryClient.setQueryData(QUERY_KEY, "old", {
      updatedAt: Date.now() - STALE_TIME_MS - 1,
    });
    observe({ queryFn });

    refetchQueryIfStale(queryClient, QUERY_KEY);
    await flushPromises();

    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(QUERY_KEY)).toBe("next");
  });

  it("skips queries whose observers are disabled", async () => {
    const queryFn = jest.fn().mockResolvedValue("next");
    queryClient.setQueryData(QUERY_KEY, "old", {
      updatedAt: Date.now() - STALE_TIME_MS - 1,
    });
    observe({ queryFn, enabled: false });

    refetchQueryIfStale(queryClient, QUERY_KEY);
    await flushPromises();

    expect(queryFn).not.toHaveBeenCalled();
  });

  it("joins an in-flight request instead of cancelling it", async () => {
    let resolveRequest!: (value: string) => void;
    const signals: AbortSignal[] = [];
    const queryFn = jest.fn(
      ({ signal }: { readonly signal: AbortSignal }) =>
        new Promise<string>((resolve) => {
          signals.push(signal);
          resolveRequest = resolve;
        })
    );
    queryClient.setQueryData(QUERY_KEY, "old", {
      updatedAt: Date.now() - STALE_TIME_MS - 1,
    });
    const observer = observe({
      queryFn: queryFn as unknown as () => Promise<string>,
    });
    const inFlight = observer.refetch();

    refetchQueryIfStale(queryClient, QUERY_KEY);
    resolveRequest("next");
    await inFlight;
    await flushPromises();

    expect(queryFn).toHaveBeenCalledTimes(1);
    expect(signals[0]?.aborted).toBe(false);
    expect(queryClient.getQueryData(QUERY_KEY)).toBe("next");
  });
});
