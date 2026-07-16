import { renderHook } from "@testing-library/react";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getAuthTokenFingerprint } from "@/services/auth/auth-token-fingerprint";
import { setNotificationRealtimeState } from "@/services/notifications/notification-realtime-state";

const useQueryMock = jest.fn();
const commonApiFetchMock = jest.fn();
const getAuthJwtMock = jest.fn();
const isAuthJwtUsableMock = jest.fn();
jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: any[]) => useQueryMock(...args),
}));

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: (...args: unknown[]) => commonApiFetchMock(...args),
}));

jest.mock("@/services/auth/auth.utils", () => ({
  getAuthJwt: () => getAuthJwtMock(),
  isAuthJwtUsable: (...args: unknown[]) => isAuthJwtUsableMock(...args),
}));

describe("useUnreadNotifications", () => {
  beforeEach(() => {
    setNotificationRealtimeState(false);
    useQueryMock.mockReset();
    commonApiFetchMock.mockReset();
    getAuthJwtMock.mockReset();
    isAuthJwtUsableMock.mockReset();
    getAuthJwtMock.mockReturnValue("valid-jwt");
    isAuthJwtUsableMock.mockReturnValue(true);
  });

  it("returns unread when notifications have count", () => {
    useQueryMock.mockReturnValue({ data: { unread_count: 2 } });
    const { result } = renderHook(() => useUnreadNotifications("bob"));
    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: [
          QueryKey.IDENTITY_NOTIFICATIONS,
          {
            auth: getAuthTokenFingerprint("valid-jwt"),
            identity: "bob",
            limit: "1",
            version: "v2",
          },
        ],
        enabled: true,
      })
    );
    expect(result.current.haveUnreadNotifications).toBe(true);
    expect(result.current.notifications).toEqual({ unread_count: 2 });
  });

  it("does not start polling when caller disables the hook", () => {
    useQueryMock.mockReturnValue({ data: { unread_count: 2 } });

    const { result } = renderHook(() =>
      useUnreadNotifications("bob", { enabled: false })
    );

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    );
    expect(result.current.notifications).toBeUndefined();
    expect(result.current.haveUnreadNotifications).toBe(false);
  });

  it("does not start polling when the active auth token is missing or expired", () => {
    isAuthJwtUsableMock.mockReturnValue(false);
    useQueryMock.mockReturnValue({ data: undefined });

    renderHook(() => useUnreadNotifications("bob"));

    expect(useQueryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
      })
    );
  });

  it("does not retry terminal notification auth failures", () => {
    useQueryMock.mockReturnValue({ data: undefined });

    renderHook(() => useUnreadNotifications("bob"));

    const queryOptions = useQueryMock.mock.calls[0]?.[0];
    expect(queryOptions.retry(0, { status: 401 })).toBe(false);
    expect(queryOptions.retry(0, { status: 403 })).toBe(false);
    expect(
      queryOptions.retry(0, {
        status: 409,
        response: { body: "session-v2 upgrade required" },
      })
    ).toBe(false);
    expect(queryOptions.retry(0, new Error("temporary failure"))).toBe(true);
  });

  it("disables timer and lifecycle refetches only after terminal auth errors", () => {
    useQueryMock.mockReturnValue({ data: undefined });

    renderHook(() => useUnreadNotifications("bob"));

    const queryOptions = useQueryMock.mock.calls[0]?.[0];
    const terminalQuery = { state: { error: { status: 403 } } };
    const transientQuery = { state: { error: { status: 503 } } };

    expect(queryOptions.refetchInterval(terminalQuery)).toBe(false);
    expect(queryOptions.refetchOnWindowFocus(terminalQuery)).toBe(false);
    expect(queryOptions.refetchOnMount(terminalQuery)).toBe(false);
    expect(queryOptions.refetchOnReconnect(terminalQuery)).toBe(false);

    expect(queryOptions.refetchInterval(transientQuery)).toBe(30000);
    expect(queryOptions.refetchOnWindowFocus(transientQuery)).toBe(true);
    expect(queryOptions.refetchOnMount(transientQuery)).toBe(true);
    expect(queryOptions.refetchOnReconnect(transientQuery)).toBe(true);
  });

  it("uses only a five-minute reconciliation poll when the active profile is synced", () => {
    setNotificationRealtimeState(true, ["profile-1"]);
    useQueryMock.mockReturnValue({ data: undefined });

    renderHook(() => useUnreadNotifications("bob", { profileId: "profile-1" }));

    const queryOptions = useQueryMock.mock.calls[0]?.[0];
    expect(queryOptions.refetchInterval({ state: { error: undefined } })).toBe(
      300000
    );
  });

  it("keeps fallback polling when only another profile is synced", () => {
    setNotificationRealtimeState(true, ["profile-2"]);
    useQueryMock.mockReturnValue({ data: undefined });

    renderHook(() => useUnreadNotifications("bob", { profileId: "profile-1" }));

    const queryOptions = useQueryMock.mock.calls[0]?.[0];
    expect(queryOptions.refetchInterval({ state: { error: undefined } })).toBe(
      30000
    );
  });

  it("bypasses browser caching when fetching the unread count", async () => {
    commonApiFetchMock.mockResolvedValue({ unread_count: 0 });
    useQueryMock.mockReturnValue({ data: undefined });

    renderHook(() => useUnreadNotifications("bob", { profileId: "profile-1" }));

    const queryOptions = useQueryMock.mock.calls[0]?.[0];
    await queryOptions.queryFn();

    expect(commonApiFetchMock).toHaveBeenCalledWith(
      expect.objectContaining({ cache: "no-store" })
    );
  });

  it("uses a fresh query after the auth token materially changes", () => {
    useQueryMock.mockReturnValue({ data: undefined });
    getAuthJwtMock.mockReturnValue("first-jwt");

    const { rerender } = renderHook(() => useUnreadNotifications("bob"));
    const firstQueryKey = useQueryMock.mock.calls[0]?.[0].queryKey;

    getAuthJwtMock.mockReturnValue("reauthenticated-jwt");
    rerender();

    const secondQueryKey = useQueryMock.mock.calls.at(-1)?.[0].queryKey;
    expect(firstQueryKey).not.toEqual(secondQueryKey);
    expect(secondQueryKey[1]).toEqual(
      expect.objectContaining({
        auth: getAuthTokenFingerprint("reauthenticated-jwt"),
        identity: "bob",
      })
    );
  });

  it("surfaces 403 as terminal query state without hiding transient failures", async () => {
    useQueryMock.mockReturnValue({ data: undefined });
    commonApiFetchMock.mockRejectedValue({ status: 403 });

    renderHook(() => useUnreadNotifications("bob"));

    const queryOptions = useQueryMock.mock.calls[0]?.[0];
    await expect(queryOptions.queryFn()).rejects.toMatchObject({ status: 403 });

    commonApiFetchMock.mockRejectedValueOnce({ status: 503 });
    await expect(queryOptions.queryFn()).rejects.toMatchObject({ status: 503 });
  });

  it("blocks polling before fetch when the token expires between renders", async () => {
    isAuthJwtUsableMock.mockReturnValueOnce(true).mockReturnValueOnce(false);
    useQueryMock.mockReturnValue({ data: undefined });

    renderHook(() => useUnreadNotifications("bob"));

    const queryOptions = useQueryMock.mock.calls[0]?.[0];
    await expect(queryOptions.queryFn()).rejects.toMatchObject({ status: 401 });
    expect(commonApiFetchMock).not.toHaveBeenCalled();
  });

  it("returns false when no unread notifications", () => {
    useQueryMock.mockReturnValue({ data: { unread_count: 0 } });
    const { result } = renderHook(() => useUnreadNotifications("alice"));
    expect(result.current.haveUnreadNotifications).toBe(false);
  });
});
