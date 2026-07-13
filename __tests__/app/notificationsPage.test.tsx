import NotificationsPage from "@/app/notifications/page";
import { prefetchNotificationsPageData } from "@/helpers/notifications.server";
import { getAppCommonHeaders } from "@/helpers/server.app.helpers";

jest.mock("@/helpers/server.app.helpers", () => ({
  getAppCommonHeaders: jest.fn(),
}));
jest.mock("@/helpers/notifications.server", () => ({
  prefetchNotificationsPageData: jest.fn(),
}));
jest.mock("@/app/notifications/page.client", () => ({
  __esModule: true,
  default: () => <div data-testid="notifications-page-client" />,
}));

describe("NotificationsPage server data path", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAppCommonHeaders as jest.Mock).mockResolvedValue({
      Authorization: "Bearer token",
    });
  });

  it("runs only the Notifications route prefetch with current headers", async () => {
    await NotificationsPage();

    expect(prefetchNotificationsPageData).toHaveBeenCalledTimes(1);
    expect(prefetchNotificationsPageData).toHaveBeenCalledWith({
      queryClient: expect.any(Object),
      headers: { Authorization: "Bearer token" },
    });
  });

  it("keeps rendering when the optional prefetch fails", async () => {
    const warning = jest.spyOn(console, "warn").mockImplementation(() => {});
    (prefetchNotificationsPageData as jest.Mock).mockRejectedValue(
      new Error("prefetch failed")
    );

    await expect(NotificationsPage()).resolves.toBeDefined();

    expect(warning).toHaveBeenCalledWith("Notifications prefetch failed", {
      error: expect.any(Error),
    });
    warning.mockRestore();
  });
});
