import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useConnectedAccountsUnreadNotifications } from "@/hooks/useConnectedAccountsUnreadNotifications";
import { act, renderHook } from "@testing-library/react";
import { setNotificationRealtimeState } from "@/services/notifications/notification-realtime-state";

const useQueryMock = jest.fn();
const getQueryDataMock = jest.fn();
const commonApiFetchMock = jest.fn();
const isAuthJwtUsableMock = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  useQuery: (params: unknown) => useQueryMock(params),
  useQueryClient: () => ({
    getQueryData: getQueryDataMock,
  }),
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: (...args: unknown[]) => commonApiFetchMock(...args),
}));

jest.mock("@/services/auth/auth.utils", () => ({
  isAuthJwtUsable: (...args: unknown[]) => isAuthJwtUsableMock(...args),
}));

describe("useConnectedAccountsUnreadNotifications", () => {
  beforeEach(() => {
    setNotificationRealtimeState(false);
    useQueryMock.mockReset();
    getQueryDataMock.mockReset();
    commonApiFetchMock.mockReset();
    isAuthJwtUsableMock.mockReset();
    isAuthJwtUsableMock.mockReturnValue(true);
  });

  it("uses a separate query key from active identity notifications", () => {
    useQueryMock.mockReturnValue({ data: {} });

    renderHook(() =>
      useConnectedAccountsUnreadNotifications([
        {
          address: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          refreshToken: "refresh-token",
          role: null,
          jwt: "jwt-token",
          profileId: null,
          profileHandle: "alice",
        },
      ])
    );

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          QueryKey.CONNECTED_ACCOUNT_UNREAD_NOTIFICATIONS,
          "connected-account-unread-counts",
          "v2",
          ["0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
        ],
      })
    );
  });

  it("uses only a five-minute reconciliation poll when every account is synced", () => {
    setNotificationRealtimeState(true, ["profile-1"]);
    useQueryMock.mockReturnValue({ data: {} });

    renderHook(() =>
      useConnectedAccountsUnreadNotifications([
        {
          address: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          refreshToken: "refresh-token",
          role: null,
          jwt: "jwt-token",
          profileId: "profile-1",
          profileHandle: "alice",
        },
        {
          address: "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
          refreshToken: "refresh-token-2",
          role: null,
          jwt: "jwt-token-2",
          profileId: "profile-2",
          profileHandle: "bob",
        },
      ])
    );

    expect(useQueryMock.mock.calls.at(-1)?.[0].refetchInterval).toBe(15000);

    act(() => {
      setNotificationRealtimeState(true, ["profile-1", "profile-2"]);
    });

    expect(useQueryMock.mock.calls.at(-1)?.[0].refetchInterval).toBe(300000);
  });

  it("does not enable polling for accounts without usable JWTs", () => {
    isAuthJwtUsableMock.mockReturnValue(false);
    useQueryMock.mockReturnValue({ data: {} });

    renderHook(() =>
      useConnectedAccountsUnreadNotifications([
        {
          address: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          refreshToken: "refresh-token",
          role: null,
          jwt: "expired-jwt",
          profileId: null,
          profileHandle: "alice",
        },
      ])
    );

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
        queryKey: [
          QueryKey.CONNECTED_ACCOUNT_UNREAD_NOTIFICATIONS,
          "connected-account-unread-counts",
          "v2",
          [],
        ],
      })
    );
  });

  it("does not retry terminal connected-account notification failures", () => {
    useQueryMock.mockReturnValue({ data: {} });

    renderHook(() =>
      useConnectedAccountsUnreadNotifications([
        {
          address: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          refreshToken: "refresh-token",
          role: null,
          jwt: "jwt-token",
          profileId: null,
          profileHandle: "alice",
        },
      ])
    );

    const queryOptions = useQueryMock.mock.calls[0]?.[0];
    expect(queryOptions.retry(0, { status: 401 })).toBe(false);
    expect(queryOptions.retry(0, { status: 403 })).toBe(false);
    expect(queryOptions.retry(0, { status: 503 })).toBe(true);
  });

  it("surfaces terminal connected-account failures instead of hiding them as successful polling", async () => {
    commonApiFetchMock.mockRejectedValue({ status: 403 });
    useQueryMock.mockReturnValue({ data: {} });

    renderHook(() =>
      useConnectedAccountsUnreadNotifications([
        {
          address: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          refreshToken: "refresh-token",
          role: null,
          jwt: "jwt-token",
          profileId: null,
          profileHandle: "alice",
        },
      ])
    );

    const queryOptions = useQueryMock.mock.calls[0]?.[0];
    await expect(queryOptions.queryFn()).rejects.toMatchObject({
      status: 403,
      terminalNotificationAuth: true,
    });
  });

  it("keeps transient connected-account failures best-effort", async () => {
    commonApiFetchMock.mockRejectedValue({ status: 503 });
    getQueryDataMock.mockReturnValue({
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa": 4,
    });
    useQueryMock.mockReturnValue({ data: {} });

    renderHook(() =>
      useConnectedAccountsUnreadNotifications([
        {
          address: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          refreshToken: "refresh-token",
          role: null,
          jwt: "jwt-token",
          profileId: null,
          profileHandle: "alice",
        },
      ])
    );

    const queryOptions = useQueryMock.mock.calls[0]?.[0];
    await expect(queryOptions.queryFn()).resolves.toEqual({
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa": 4,
    });
  });

  it("blocks only the failed account until that account gets a new token", async () => {
    const accounts = [
      {
        address: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
        refreshToken: "refresh-token-a",
        role: null,
        jwt: "jwt-a",
        profileId: null,
        profileHandle: "alice",
      },
      {
        address: "0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
        refreshToken: "refresh-token-b",
        role: null,
        jwt: "jwt-b",
        profileId: null,
        profileHandle: "bob",
      },
    ];
    commonApiFetchMock
      .mockRejectedValueOnce({ status: 403 })
      .mockResolvedValueOnce({ unread_count: 2 });
    useQueryMock.mockReturnValue({ data: {} });

    const { rerender } = renderHook(
      ({ connectedAccounts }) =>
        useConnectedAccountsUnreadNotifications(connectedAccounts),
      { initialProps: { connectedAccounts: accounts } }
    );

    const firstQueryOptions = useQueryMock.mock.calls[0]?.[0];
    const terminalError = await firstQueryOptions
      .queryFn()
      .catch((error: unknown) => error);
    act(() => {
      expect(firstQueryOptions.retry(0, terminalError)).toBe(false);
    });

    expect(useQueryMock.mock.calls.at(-1)?.[0].queryKey.at(-1)).toEqual([
      "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    ]);

    rerender({
      connectedAccounts: [
        { ...accounts[0], jwt: "jwt-a-after-reauth" },
        accounts[1],
      ],
    });

    expect(useQueryMock.mock.calls.at(-1)?.[0].queryKey.at(-1)).toEqual([
      "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    ]);
  });

  it("blocks connected-account fetches when the JWT expires between renders", async () => {
    isAuthJwtUsableMock.mockReturnValueOnce(true).mockReturnValueOnce(false);
    useQueryMock.mockReturnValue({ data: {} });

    renderHook(() =>
      useConnectedAccountsUnreadNotifications([
        {
          address: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
          refreshToken: "refresh-token",
          role: null,
          jwt: "jwt-token",
          profileId: null,
          profileHandle: "alice",
        },
      ])
    );

    const queryOptions = useQueryMock.mock.calls[0]?.[0];
    await expect(queryOptions.queryFn()).rejects.toMatchObject({ status: 401 });
    expect(commonApiFetchMock).not.toHaveBeenCalled();
  });
});
