import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { useConnectedAccountsUnreadNotifications } from "@/hooks/useConnectedAccountsUnreadNotifications";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";

const commonApiFetchMock = jest.fn();
let activeJwt = "active-jwt-before-terminal";

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: (...args: unknown[]) => commonApiFetchMock(...args),
}));

jest.mock("@/services/auth/auth.utils", () => ({
  getAuthJwt: () => activeJwt,
  isAuthJwtUsable: (jwt: string | null | undefined) => Boolean(jwt),
}));

const createWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { readonly children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

const flushQueryWork = async (): Promise<void> => {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await jest.advanceTimersByTimeAsync(0);
    await Promise.resolve();
  });
};

const getAuthorizationHeader = (call: readonly unknown[]): string | null => {
  const params = call[0] as
    | { readonly headers?: Readonly<Record<string, string>> }
    | undefined;
  return params?.headers?.Authorization ?? null;
};

describe("notification terminal auth polling", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.useFakeTimers();
    commonApiFetchMock.mockReset();
    activeJwt = "active-jwt-before-terminal";
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          gcTime: Number.POSITIVE_INFINITY,
        },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it("deduplicates observers, stops all terminal timers, and resumes after reauth", async () => {
    commonApiFetchMock.mockImplementation(() => {
      if (activeJwt === "active-jwt-before-terminal") {
        return Promise.reject({ status: 403 });
      }
      return Promise.resolve({ unread_count: 3 });
    });

    const { rerender, result, unmount } = renderHook(
      () => {
        const first = useUnreadNotifications("alice");
        const second = useUnreadNotifications("alice");
        return { first, second };
      },
      { wrapper: createWrapper(queryClient) }
    );
    await flushQueryWork();

    expect(commonApiFetchMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(120_000);
    });
    expect(commonApiFetchMock).toHaveBeenCalledTimes(1);

    activeJwt = "active-jwt-after-reauth";
    rerender();
    await flushQueryWork();

    expect(commonApiFetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.first.haveUnreadNotifications).toBe(true);
    expect(result.current.second.haveUnreadNotifications).toBe(true);
    unmount();
  });

  it("retries transient failures and keeps the timer active after recovery", async () => {
    commonApiFetchMock
      .mockRejectedValueOnce({ status: 503 })
      .mockResolvedValue({ unread_count: 1 });

    const { result, unmount } = renderHook(
      () => useUnreadNotifications("alice"),
      { wrapper: createWrapper(queryClient) }
    );
    await flushQueryWork();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1);
    });

    expect(commonApiFetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.haveUnreadNotifications).toBe(true);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(30_000);
    });
    expect(commonApiFetchMock).toHaveBeenCalledTimes(3);
    unmount();
  });

  it("keeps account failures isolated and retries only after that token changes", async () => {
    const accountA = {
      address: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      refreshToken: "refresh-a",
      role: null,
      jwt: "jwt-a-before-terminal",
      profileId: null,
      profileHandle: "alice",
    };
    const accountB = {
      address: "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
      refreshToken: "refresh-b",
      role: null,
      jwt: "jwt-b",
      profileId: null,
      profileHandle: "bob",
    };
    commonApiFetchMock.mockImplementation(
      (params: { readonly headers?: Readonly<Record<string, string>> }) => {
        const authorization = params.headers?.Authorization;
        if (authorization === "Bearer jwt-a-before-terminal") {
          return Promise.reject({ status: 403 });
        }
        return Promise.resolve({ unread_count: 1 });
      }
    );

    const { rerender, unmount } = renderHook(
      ({ accounts }) => useConnectedAccountsUnreadNotifications(accounts),
      {
        initialProps: { accounts: [accountA, accountB] },
        wrapper: createWrapper(queryClient),
      }
    );
    await flushQueryWork();
    await flushQueryWork();

    const countRequestsFor = (authorization: string): number =>
      commonApiFetchMock.mock.calls.filter(
        (call) => getAuthorizationHeader(call) === authorization
      ).length;
    const accountBRequestsBeforeTimer = countRequestsFor("Bearer jwt-b");

    expect(countRequestsFor("Bearer jwt-a-before-terminal")).toBe(1);
    expect(accountBRequestsBeforeTimer).toBeGreaterThan(0);

    await act(async () => {
      await jest.advanceTimersByTimeAsync(30_000);
    });
    expect(countRequestsFor("Bearer jwt-a-before-terminal")).toBe(1);
    expect(countRequestsFor("Bearer jwt-b")).toBeGreaterThan(
      accountBRequestsBeforeTimer
    );

    rerender({
      accounts: [
        { ...accountA, jwt: "jwt-a-after-reauth" },
        accountB,
      ],
    });
    await flushQueryWork();

    expect(countRequestsFor("Bearer jwt-a-after-reauth")).toBe(1);
    expect(countRequestsFor("Bearer jwt-a-before-terminal")).toBe(1);
    unmount();
  });
});
