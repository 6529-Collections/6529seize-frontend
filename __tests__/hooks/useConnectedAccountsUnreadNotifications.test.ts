import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useConnectedAccountsUnreadNotifications } from "@/hooks/useConnectedAccountsUnreadNotifications";
import type { ConnectedWalletAccount } from "@/services/auth/auth.utils";
import { setNotificationRealtimeState } from "@/services/notifications/notification-realtime-state";

type CapturedQueryOptions = {
  readonly queryKey: readonly unknown[];
  readonly refetchInterval: (query: {
    readonly state: { readonly error: unknown };
  }) => number | false;
  readonly retry: (failureCount: number, error: unknown) => boolean;
};

const commonApiFetchMock = jest.fn();
const isAuthJwtUsableMock = jest.fn();
const mockCapturedQueries: CapturedQueryOptions[][] = [];

jest.mock("@tanstack/react-query", () => {
  const actual = jest.requireActual("@tanstack/react-query");
  return {
    ...actual,
    useQueries: (
      options: { readonly queries: CapturedQueryOptions[] },
      client?: unknown
    ) => {
      mockCapturedQueries.push(options.queries);
      return actual.useQueries(options, client);
    },
  };
});

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: (...args: unknown[]) => commonApiFetchMock(...args),
}));

jest.mock("@/services/auth/auth.utils", () => ({
  isAuthJwtUsable: (...args: unknown[]) => isAuthJwtUsableMock(...args),
}));

const ACCOUNT_A: ConnectedWalletAccount = {
  address: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
  refreshToken: "refresh-token-a",
  role: null,
  jwt: "jwt-a",
  profileId: "profile-a",
  profileHandle: "alice",
};
const ACCOUNT_B: ConnectedWalletAccount = {
  address: "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
  refreshToken: "refresh-token-b",
  role: null,
  jwt: "jwt-b",
  profileId: "profile-b",
  profileHandle: "bob",
};
const ADDRESS_A = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const ADDRESS_B = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

type FetchParams = {
  readonly headers: { readonly Authorization: string };
  readonly signal: AbortSignal;
};

const requestsWithToken = (jwt: string): FetchParams[] =>
  commonApiFetchMock.mock.calls
    .map(([params]) => params as FetchParams)
    .filter((params) => params.headers.Authorization === `Bearer ${jwt}`);

const latestQueries = (): CapturedQueryOptions[] =>
  mockCapturedQueries.at(-1) ?? [];

const latestQueryFor = (address: string): CapturedQueryOptions => {
  const query = latestQueries().find(
    (options) =>
      (options.queryKey[1] as { readonly account?: unknown }).account ===
      address
  );
  if (!query) {
    throw new Error(`No unread query for ${address}`);
  }
  return query;
};

const flush = async (ms = 0): Promise<void> => {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
};

describe("useConnectedAccountsUnreadNotifications", () => {
  let queryClient: QueryClient;

  const renderUnreadCounts = (
    initialAccounts: readonly ConnectedWalletAccount[]
  ) =>
    renderHook(
      ({ accounts }) => useConnectedAccountsUnreadNotifications(accounts),
      {
        initialProps: { accounts: initialAccounts },
        wrapper: ({ children }: { readonly children: ReactNode }) =>
          createElement(QueryClientProvider, { client: queryClient }, children),
      }
    );

  beforeEach(() => {
    jest.useFakeTimers();
    setNotificationRealtimeState(false);
    mockCapturedQueries.length = 0;
    commonApiFetchMock.mockReset();
    commonApiFetchMock.mockImplementation((params: FetchParams) =>
      Promise.resolve({
        unread_count: params.headers.Authorization === "Bearer jwt-a" ? 4 : 2,
        notifications: [],
      })
    );
    isAuthJwtUsableMock.mockReset();
    isAuthJwtUsableMock.mockReturnValue(true);
    // Mirror the app's QueryClient defaults that affect refetch timing.
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { staleTime: 10_000, gcTime: Number.POSITIVE_INFINITY },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
    setNotificationRealtimeState(false);
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("keeps one query per account, separate from active identity notifications", async () => {
    const { result, unmount } = renderUnreadCounts([ACCOUNT_A, ACCOUNT_B]);
    await flush();

    expect(
      queryClient
        .getQueryCache()
        .findAll({
          queryKey: [QueryKey.CONNECTED_ACCOUNT_UNREAD_NOTIFICATIONS],
        })
        .map((query) => query.queryKey)
    ).toEqual([
      [
        QueryKey.CONNECTED_ACCOUNT_UNREAD_NOTIFICATIONS,
        { account: ADDRESS_A, version: "v2" },
      ],
      [
        QueryKey.CONNECTED_ACCOUNT_UNREAD_NOTIFICATIONS,
        { account: ADDRESS_B, version: "v2" },
      ],
    ]);
    expect(
      queryClient
        .getQueryCache()
        .findAll({ queryKey: [QueryKey.IDENTITY_NOTIFICATIONS] })
    ).toHaveLength(0);
    expect(result.current).toEqual({ [ADDRESS_A]: 4, [ADDRESS_B]: 2 });
    unmount();
  });

  it("uses the five-minute reconciliation poll only for accounts the socket confirmed", () => {
    setNotificationRealtimeState(true, ["profile-a"]);
    const { unmount } = renderUnreadCounts([ACCOUNT_A, ACCOUNT_B]);
    const idleQuery = { state: { error: undefined } };

    expect(latestQueryFor(ADDRESS_A).refetchInterval(idleQuery)).toBe(300_000);
    expect(latestQueryFor(ADDRESS_B).refetchInterval(idleQuery)).toBe(30_000);

    act(() => {
      setNotificationRealtimeState(true, ["profile-a", "profile-b"]);
    });
    expect(latestQueryFor(ADDRESS_B).refetchInterval(idleQuery)).toBe(300_000);

    act(() => {
      setNotificationRealtimeState(false);
    });
    expect(latestQueryFor(ADDRESS_A).refetchInterval(idleQuery)).toBe(30_000);
    expect(latestQueryFor(ADDRESS_B).refetchInterval(idleQuery)).toBe(30_000);
    expect(
      latestQueryFor(ADDRESS_A).refetchInterval({
        state: { error: { status: 401 } },
      })
    ).toBe(false);
    unmount();
  });

  it("does not create queries for accounts without usable JWTs", async () => {
    isAuthJwtUsableMock.mockReturnValue(false);
    const { result, unmount } = renderUnreadCounts([
      ACCOUNT_A,
      { ...ACCOUNT_B, jwt: null },
    ]);
    await flush(60_000);

    expect(latestQueries()).toHaveLength(0);
    expect(commonApiFetchMock).not.toHaveBeenCalled();
    expect(result.current).toEqual({});
    unmount();
  });

  it("retries transient failures but never terminal auth or other client errors", () => {
    const { unmount } = renderUnreadCounts([ACCOUNT_A]);
    const { retry } = latestQueryFor(ADDRESS_A);

    expect(retry(0, { status: 401 })).toBe(false);
    expect(retry(0, { status: 403 })).toBe(false);
    expect(retry(0, { status: 400 })).toBe(false);
    expect(retry(0, { status: 404 })).toBe(false);
    expect(retry(0, { status: 429 })).toBe(false);
    expect(retry(0, { status: 408 })).toBe(true);
    expect(retry(0, { status: 503 })).toBe(true);
    expect(retry(3, { status: 503 })).toBe(false);
    unmount();
  });

  it("sends each account's request with its own token and abort signal", async () => {
    const { unmount } = renderUnreadCounts([ACCOUNT_A, ACCOUNT_B]);
    await flush();

    const [requestA] = requestsWithToken("jwt-a");
    const [requestB] = requestsWithToken("jwt-b");
    expect(commonApiFetchMock).toHaveBeenCalledTimes(2);
    expect(requestA).toEqual(
      expect.objectContaining({
        endpoint: "v2/notifications",
        params: { limit: "1" },
        cache: "no-store",
      })
    );
    expect(requestA?.signal).toBeInstanceOf(AbortSignal);
    expect(requestB?.signal).toBeInstanceOf(AbortSignal);
    expect(requestA?.signal).not.toBe(requestB?.signal);
    unmount();
  });

  it("keeps an account's last count through transient failures", async () => {
    const { result, unmount } = renderUnreadCounts([ACCOUNT_A]);
    await flush();
    expect(result.current).toEqual({ [ADDRESS_A]: 4 });

    commonApiFetchMock.mockRejectedValue({ status: 503 });
    act(() => {
      void queryClient.invalidateQueries({
        queryKey: [QueryKey.CONNECTED_ACCOUNT_UNREAD_NOTIFICATIONS],
      });
    });
    await flush(10_000);

    expect(commonApiFetchMock).toHaveBeenCalledTimes(5);
    expect(result.current).toEqual({ [ADDRESS_A]: 4 });
    unmount();
  });

  it("stops polling only the account that failed auth until it gets a new token", async () => {
    commonApiFetchMock.mockImplementation((params: FetchParams) =>
      params.headers.Authorization === "Bearer jwt-a"
        ? Promise.reject({ status: 403 })
        : Promise.resolve({ unread_count: 2, notifications: [] })
    );
    const { result, rerender, unmount } = renderUnreadCounts([
      ACCOUNT_A,
      ACCOUNT_B,
    ]);
    await flush();
    await flush(60_000);

    expect(requestsWithToken("jwt-a")).toHaveLength(1);
    expect(requestsWithToken("jwt-b")).toHaveLength(3);
    expect(result.current).toEqual({ [ADDRESS_B]: 2 });

    rerender({
      accounts: [{ ...ACCOUNT_A, jwt: "jwt-a-after-reauth" }, ACCOUNT_B],
    });
    await flush();

    expect(requestsWithToken("jwt-a-after-reauth")).toHaveLength(1);
    expect(result.current).toEqual({ [ADDRESS_A]: 2, [ADDRESS_B]: 2 });
    unmount();
  });

  it("checks the token again right before each request", async () => {
    isAuthJwtUsableMock.mockReturnValueOnce(true).mockReturnValue(false);
    const { result, unmount } = renderUnreadCounts([ACCOUNT_A]);
    await flush();

    expect(commonApiFetchMock).not.toHaveBeenCalled();
    expect(result.current).toEqual({});
    unmount();
  });

  it("does not refetch accounts that stay connected when another account is added", async () => {
    const { result, rerender, unmount } = renderUnreadCounts([ACCOUNT_A]);
    await flush();

    rerender({ accounts: [ACCOUNT_A, ACCOUNT_B] });
    await flush();

    expect(requestsWithToken("jwt-a")).toHaveLength(1);
    expect(requestsWithToken("jwt-b")).toHaveLength(1);
    expect(result.current).toEqual({ [ADDRESS_A]: 4, [ADDRESS_B]: 2 });
    unmount();
  });

  it("returns the same counts object while the counts are unchanged", async () => {
    const accounts = [ACCOUNT_A, ACCOUNT_B];
    const { result, rerender, unmount } = renderUnreadCounts(accounts);
    await flush();
    const firstCounts = result.current;

    rerender({ accounts });
    act(() => {
      void queryClient.invalidateQueries({
        queryKey: [QueryKey.CONNECTED_ACCOUNT_UNREAD_NOTIFICATIONS],
      });
    });
    await flush();

    expect(commonApiFetchMock).toHaveBeenCalledTimes(4);
    expect(result.current).toBe(firstCounts);
    unmount();
  });
});
