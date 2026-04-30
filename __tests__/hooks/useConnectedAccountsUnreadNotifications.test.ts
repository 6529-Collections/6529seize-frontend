import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useConnectedAccountsUnreadNotifications } from "@/hooks/useConnectedAccountsUnreadNotifications";
import { renderHook } from "@testing-library/react";

const useQueryMock = jest.fn();
const getQueryDataMock = jest.fn();

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
  commonApiFetch: jest.fn(),
}));

describe("useConnectedAccountsUnreadNotifications", () => {
  beforeEach(() => {
    useQueryMock.mockReset();
    getQueryDataMock.mockReset();
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
          ["0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"],
        ],
      })
    );
  });
});
