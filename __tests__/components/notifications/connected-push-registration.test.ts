import type { DeviceInfo } from "@capacitor/device";
import { registerPushNotificationWithRetry } from "@/components/notifications/notificationsPushRegistration";
import { commonApiPost } from "@/services/api/common-api";
import {
  completePushInstallationMigration,
  preparePushInstallationRegistration,
} from "@/services/notifications/push-installation";

let mockAccounts = [
  { profileId: "A", jwt: "jwt-A" },
  { profileId: "B", jwt: "jwt-B" },
];
jest.mock("@/services/auth/auth.utils", () => ({
  getAuthJwt: () => "jwt-A",
  getConnectedWalletAccounts: () => mockAccounts,
  isAuthJwtUsable: (jwt: string) => !!jwt && jwt !== "expired",
}));
jest.mock("@/services/api/common-api", () => ({ commonApiPost: jest.fn() }));
jest.mock("@/services/notifications/push-installation", () => ({
  preparePushInstallationRegistration: jest.fn(),
  completePushInstallationMigration: jest.fn(),
}));
jest.mock("@sentry/nextjs", () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
}));
const info = { platform: "ios" } as DeviceInfo;
beforeEach(() => {
  jest.clearAllMocks();
  jest
    .mocked(completePushInstallationMigration)
    .mockReset()
    .mockResolvedValue(false);
  mockAccounts = [
    { profileId: "A", jwt: "jwt-A" },
    { profileId: "B", jwt: "jwt-B" },
  ];
  jest.mocked(commonApiPost).mockResolvedValue({});
  jest.mocked(preparePushInstallationRegistration).mockResolvedValue({
    installation_secret: "a".repeat(64),
    installation_revision: 0,
    previous_device_id: "legacy",
  });
});
it("registers A and inactive B with their own JWTs before cleaning the old target", async () => {
  const order: string[] = [];
  jest.mocked(commonApiPost).mockImplementation(async ({ body }) => {
    order.push((body as { profile_id: string }).profile_id);
    return {};
  });
  jest
    .mocked(completePushInstallationMigration)
    .mockImplementation(async () => {
      order.push("cleanup");
      return true;
    });
  await expect(
    registerPushNotificationWithRetry("new-phone", info, "new-token", "A")
  ).resolves.toBe(true);
  expect(order).toEqual(["A", "B", "cleanup", "A"]);
  expect(commonApiPost).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({
      headers: { Authorization: "Bearer jwt-B" },
      body: expect.objectContaining({
        profile_id: "B",
        token: "new-token",
        previous_device_id: "legacy",
      }),
    })
  );
  expect(preparePushInstallationRegistration).toHaveBeenNthCalledWith(
    2,
    "new-phone",
    "new-token",
    "jwt-B",
    "B"
  );
});
it("preserves old delivery targets when B needs to authenticate again", async () => {
  mockAccounts[1]!.jwt = "expired";
  await expect(
    registerPushNotificationWithRetry("new-phone", info, "new-token", "A")
  ).resolves.toBe(false);
  expect(commonApiPost).toHaveBeenCalledTimes(1);
  expect(completePushInstallationMigration).not.toHaveBeenCalled();
});
it("does not clean up when B registration is rejected", async () => {
  jest
    .mocked(commonApiPost)
    .mockResolvedValueOnce({})
    .mockRejectedValueOnce({ status: 403 });
  await expect(
    registerPushNotificationWithRetry("new-phone", info, "new-token", "A")
  ).resolves.toBe(false);
  expect(completePushInstallationMigration).not.toHaveBeenCalled();
});
it("preserves single-account registration and completes its migration", async () => {
  mockAccounts = [mockAccounts[0]!];
  await expect(
    registerPushNotificationWithRetry("new-phone", info, "new-token", "A")
  ).resolves.toBe(true);
  expect(commonApiPost).toHaveBeenCalledTimes(1);
  expect(completePushInstallationMigration).toHaveBeenCalledWith(
    "new-phone",
    "new-token"
  );
});
