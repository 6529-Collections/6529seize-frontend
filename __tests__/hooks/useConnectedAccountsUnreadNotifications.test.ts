import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useConnectedAccountsUnreadNotifications } from "@/hooks/useConnectedAccountsUnreadNotifications";
import { renderHook } from "@testing-library/react";

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

  it("does not retry unauthorized connected-account notification failures", () => {
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
  });

  it("surfaces unauthorized connected-account failures instead of hiding them as successful polling", async () => {
    commonApiFetchMock.mockRejectedValue({ status: 401 });
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
