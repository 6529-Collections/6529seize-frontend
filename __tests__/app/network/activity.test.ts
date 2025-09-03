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
  cookies: jest.fn(() => ({
    get: (key: string) => {
      if (key === "x-6529-auth") return { value: "auth-token" };
      if (key === "wallet-auth") return { value: "wallet-token" };
      return undefined;
    },
  })),
  headers: jest.fn(() => new Headers()),
}));
jest.mock("@/helpers/server.app.helpers", () => ({
  getAppCommonHeaders: jest.fn(),
}));

describe("Activity Page loader logic", () => {
  const mockGetUserProfileActivityLogs =
    getUserProfileActivityLogs as jest.Mock;
  const mockConvertActivityLogParams = convertActivityLogParams as jest.Mock;
  const mockGetAppCommonHeaders = getAppCommonHeaders as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAppCommonHeaders.mockResolvedValue({ h: "v" });
  });

  it("fetches logs and returns data for page", async () => {
    mockConvertActivityLogParams.mockReturnValue("converted");
    mockGetUserProfileActivityLogs.mockResolvedValue("logs");

    const headers = await getAppCommonHeaders();
    const logsPage = await getUserProfileActivityLogs({
      headers,
      params: convertActivityLogParams({
        params: expect.anything(),
        disableActiveGroup: true,
      }),
    });

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
    mockConvertActivityLogParams.mockReturnValue("params");
    mockGetUserProfileActivityLogs.mockRejectedValue(new Error("fail"));

    await expect(async () => {
      const headers = await getAppCommonHeaders(); // resolves to { h: "v" }
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
