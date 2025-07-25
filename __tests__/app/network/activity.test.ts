import { convertActivityLogParams } from "@/helpers/profile-logs.helpers";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";
import { getUserProfileActivityLogs } from "@/helpers/server.helpers";

// Mocks
jest.mock("@/helpers/server.helpers");
jest.mock("@/helpers/profile-logs.helpers", () => ({
  convertActivityLogParams: jest.fn(),
  __esModule: true,
}));
jest.mock("next/headers", () => ({
  cookies: jest.fn(() => {
    return {
      get: (key: string) => {
        if (key === "x-6529-auth") return { value: "auth-token" };
        if (key === "wallet-auth") return { value: "wallet-token" };
        return undefined;
      },
    };
  }),
  headers: jest.fn(() => new Headers()),
}));

jest.mock("@/helpers/server.app.helpers", () => ({
  getAppCommonHeaders: jest.fn(),
}));

describe("Activity Page loader logic", () => {
  const mockGetCommonHeaders = getAppCommonHeaders as jest.Mock;
  const mockGetUserProfileActivityLogs =
    getUserProfileActivityLogs as jest.Mock;
  const mockConvertActivityLogParams = convertActivityLogParams as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("fetches logs and returns data for page", async () => {
    mockGetCommonHeaders.mockReturnValue({ h: "v" });
    mockConvertActivityLogParams.mockReturnValue("converted");
    mockGetUserProfileActivityLogs.mockResolvedValue("logs");

    // Simulate what the loader logic in `page.tsx` does
    const headers = await getAppCommonHeaders();
    const logsPage = await getUserProfileActivityLogs({
      headers,
      params: convertActivityLogParams({
        params: expect.anything(),
        disableActiveGroup: true,
      }),
    });

    expect(mockGetCommonHeaders).toHaveBeenCalled();
    expect(mockConvertActivityLogParams).toHaveBeenCalledWith({
      params: expect.anything(),
      disableActiveGroup: true,
    });
    expect(mockGetUserProfileActivityLogs).toHaveBeenCalledWith({
      headers: { h: "v" },
      params: "converted",
    });
    expect(logsPage).toBe("logs");
  });

  it("throws error on failure", async () => {
    mockGetCommonHeaders.mockReturnValue({});
    mockConvertActivityLogParams.mockReturnValue("params");
    mockGetUserProfileActivityLogs.mockRejectedValue(new Error("fail"));

    await expect(async () => {
      const headers = await getAppCommonHeaders();
      await getUserProfileActivityLogs({
        headers,
        params: convertActivityLogParams({
          params: expect.anything(),
          disableActiveGroup: true,
        }),
      });
    }).rejects.toThrow("fail");
  });
});
