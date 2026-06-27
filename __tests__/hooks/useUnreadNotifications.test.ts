import { renderHook } from "@testing-library/react";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

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
          { identity: "bob", limit: "1", version: "v2" },
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

  it("does not retry unauthorized notification failures", () => {
    useQueryMock.mockReturnValue({ data: undefined });

    renderHook(() => useUnreadNotifications("bob"));

    const queryOptions = useQueryMock.mock.calls[0]?.[0];
    expect(queryOptions.retry(0, { status: 401 })).toBe(false);
    expect(queryOptions.retry(0, new Error("temporary failure"))).toBe(true);
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
