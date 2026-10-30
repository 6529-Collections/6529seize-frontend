import QueryClientSetup from "@/components/providers/QueryClientSetup";
import {
  environmentManager,
  QueryClientProvider,
  useInfiniteQuery,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { render, renderHook, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";

describe("QueryClientSetup", () => {
  afterEach(() => jest.restoreAllMocks());

  it("isolates query data between server renders", () => {
    jest.spyOn(environmentManager, "isServer").mockReturnValue(true);
    const clients: QueryClient[] = [];
    function CaptureClient() {
      const client = useQueryClient();
      clients.push(client);
      return (
        <span>{client.getQueryData<string>(["private-data"]) ?? "empty"}</span>
      );
    }

    renderToString(
      <QueryClientSetup>
        <CaptureClient />
      </QueryClientSetup>
    );
    clients[0]!.setQueryData(["private-data"], "previous request");
    const secondHtml = renderToString(
      <QueryClientSetup>
        <CaptureClient />
      </QueryClientSetup>
    );

    expect(clients[0]).not.toBe(clients[1]);
    expect(clients[0]!.getDefaultOptions().queries?.gcTime).toBe(Infinity);
    expect(secondHtml).toContain("empty");
    expect(secondHtml).not.toContain("previous request");
    clients.forEach((client) => client.clear());
  });

  it("preserves the cache across client rerenders", () => {
    const clients: QueryClient[] = [];
    function CaptureClient() {
      clients.push(useQueryClient());
      return null;
    }
    const view = render(
      <QueryClientSetup>
        <CaptureClient />
      </QueryClientSetup>
    );
    clients[0]!.setQueryData(["public-data"], "cached");
    view.rerender(
      <QueryClientSetup>
        <CaptureClient />
      </QueryClientSetup>
    );

    expect(clients[0]).toBe(clients[1]);
    expect(clients[1]!.getQueryData(["public-data"])).toBe("cached");
    clients[0]!.clear();
  });

  describe("browser garbage collection", () => {
    const FIVE_MINUTES = 5 * 60 * 1000;
    const ONE_HOUR = 60 * 60 * 1000;

    const mountClientWithFakeTimers = () => {
      jest.useFakeTimers();
      let client: QueryClient | undefined;
      function CaptureClient() {
        client = useQueryClient();
        return null;
      }
      render(
        <QueryClientSetup>
          <CaptureClient />
        </QueryClientSetup>
      );
      return client!;
    };

    // Mounts one fresh-forever observer of `queryKey`; returns its unmount.
    const observe = (
      client: QueryClient,
      queryKey: readonly string[],
      gcTime?: number
    ) => {
      const wrapper = ({ children }: { readonly children: React.ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      );
      return renderHook(
        () =>
          useQuery({
            queryKey,
            queryFn: () => "fresh",
            initialData: "cached",
            staleTime: Infinity,
            ...(gcTime === undefined ? {} : { gcTime }),
          }),
        { wrapper }
      ).unmount;
    };

    afterEach(() => {
      jest.useRealTimers();
    });

    it("defaults to five minutes in the browser", () => {
      const client = mountClientWithFakeTimers();

      expect(client.getDefaultOptions().queries?.gcTime).toBe(FIVE_MINUTES);
      client.clear();
    });

    it("drops unused query data five minutes after it was last used", () => {
      const client = mountClientWithFakeTimers();
      client.setQueryData(["unused"], "cached");

      jest.advanceTimersByTime(FIVE_MINUTES - 1);
      expect(client.getQueryData(["unused"])).toBe("cached");

      jest.advanceTimersByTime(1);
      expect(client.getQueryData(["unused"])).toBeUndefined();
    });

    it("keeps data while a component still uses it", () => {
      const client = mountClientWithFakeTimers();
      const unmount = observe(client, ["observed-gc"]);

      jest.advanceTimersByTime(FIVE_MINUTES * 3);
      expect(client.getQueryData(["observed-gc"])).toBe("cached");

      unmount();
      jest.advanceTimersByTime(FIVE_MINUTES);
      expect(client.getQueryData(["observed-gc"])).toBeUndefined();
    });

    it("lets a per-query gcTime keep data longer", () => {
      const client = mountClientWithFakeTimers();
      const unmount = observe(client, ["long-lived"], ONE_HOUR);

      unmount();
      jest.advanceTimersByTime(FIVE_MINUTES);
      expect(client.getQueryData(["long-lived"])).toBe("cached");

      jest.advanceTimersByTime(ONE_HOUR - FIVE_MINUTES);
      expect(client.getQueryData(["long-lived"])).toBeUndefined();
    });
  });

  describe("default retry policy", () => {
    const apiError = (status: number) =>
      Object.assign(new Error(`HTTP ${status}`), { name: "ApiError", status });

    // An observer-driven query (useQuery) with instant retry delays; resolves
    // to how many times the query function ran before the query settled.
    const runObserved = async (
      error: unknown,
      options: { readonly retry?: number | false } = {}
    ) => {
      const queryFn = jest.fn().mockRejectedValue(error);
      const { result } = renderHook(
        () =>
          useQuery({
            queryKey: ["observed"],
            queryFn,
            retryDelay: 0,
            ...options,
          }),
        { wrapper: QueryClientSetup }
      );
      await waitFor(() => expect(result.current.isError).toBe(true));
      return queryFn.mock.calls.length;
    };

    // Imperative fetches resolve to the same call count; they never use
    // useQuery, so they must not inherit the observer retry default.
    const imperativeFetches: ReadonlyArray<
      readonly [
        string,
        (
          client: QueryClient,
          queryFn: () => Promise<never>
        ) => Promise<unknown>,
      ]
    > = [
      [
        "fetchQuery",
        (client, queryFn) =>
          client.fetchQuery({ queryKey: ["i"], queryFn, retryDelay: 0 }),
      ],
      [
        "prefetchQuery",
        (client, queryFn) =>
          client.prefetchQuery({ queryKey: ["i"], queryFn, retryDelay: 0 }),
      ],
      [
        "ensureQueryData",
        (client, queryFn) =>
          client.ensureQueryData({ queryKey: ["i"], queryFn, retryDelay: 0 }),
      ],
      [
        "fetchInfiniteQuery",
        (client, queryFn) =>
          client.fetchInfiniteQuery({
            queryKey: ["i"],
            queryFn,
            initialPageParam: 1,
            retryDelay: 0,
          }),
      ],
      [
        "prefetchInfiniteQuery",
        (client, queryFn) =>
          client.prefetchInfiniteQuery({
            queryKey: ["i"],
            queryFn,
            initialPageParam: 1,
            retryDelay: 0,
          }),
      ],
      [
        "ensureInfiniteQueryData",
        (client, queryFn) =>
          client.ensureInfiniteQueryData({
            queryKey: ["i"],
            queryFn,
            initialPageParam: 1,
            retryDelay: 0,
          }),
      ],
    ];
    const mountClient = () => {
      let client: QueryClient | undefined;
      function CaptureClient() {
        client = useQueryClient();
        return null;
      }
      render(
        <QueryClientSetup>
          <CaptureClient />
        </QueryClientSetup>
      );
      return client!;
    };

    it.each([400, 401, 403, 404, 425, 429])(
      "does not retry a structured %i response",
      async (status) => {
        expect(await runObserved(apiError(status))).toBe(1);
      }
    );

    it.each([
      ["a structured 500 response", apiError(500)],
      ["a structured 408 response", apiError(408)],
      ["a network failure", new TypeError("Failed to fetch")],
      ["a legacy string rejection", "Too Many Requests"],
    ])("retries %s up to three times", async (_label, error) => {
      expect(await runObserved(error)).toBe(4);
    });

    it("lets a per-query retry setting override the default", async () => {
      expect(await runObserved(apiError(500), { retry: false })).toBe(1);
      expect(await runObserved(apiError(429), { retry: 2 })).toBe(3);
    });

    it("applies the default to infinite observer queries too", async () => {
      const queryFn = jest.fn().mockRejectedValue(apiError(503));
      const { result } = renderHook(
        () =>
          useInfiniteQuery({
            queryKey: ["observed-infinite"],
            queryFn,
            initialPageParam: 1,
            getNextPageParam: () => undefined,
            retryDelay: 0,
          }),
        { wrapper: QueryClientSetup }
      );
      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(queryFn).toHaveBeenCalledTimes(4);
    });

    it.each(imperativeFetches)(
      "keeps %s failing fast on a server error",
      async (_name, run) => {
        const client = mountClient();
        const queryFn = jest.fn().mockRejectedValue(apiError(503));

        await run(client, queryFn).catch(() => undefined);

        expect(queryFn).toHaveBeenCalledTimes(1);
        client.clear();
      }
    );

    it("honours an explicit retry on an imperative fetch", async () => {
      const client = mountClient();
      const queryFn = jest.fn().mockRejectedValue(apiError(503));

      await client
        .fetchQuery({
          queryKey: ["explicit"],
          queryFn,
          retry: 2,
          retryDelay: 0,
        })
        .catch(() => undefined);

      expect(queryFn).toHaveBeenCalledTimes(3);
      client.clear();
    });

    it("keeps the server default of no retries", () => {
      jest.spyOn(environmentManager, "isServer").mockReturnValue(true);
      const clients: QueryClient[] = [];
      function CaptureClient() {
        clients.push(useQueryClient());
        return null;
      }
      renderToString(
        <QueryClientSetup>
          <CaptureClient />
        </QueryClientSetup>
      );

      expect(clients[0]!.getDefaultOptions().queries?.retry).toBe(0);
      clients[0]!.clear();
    });
  });
});
