import { Capacitor } from "@capacitor/core";
import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";
import { PushNotifications } from "@capacitor/push-notifications";
import { commonApiPost } from "@/services/api/common-api";
import {
  preparePushInstallationRegistration,
  queueNativePushLogout,
  flushPendingPushLogouts,
} from "@/services/notifications/push-installation";

const mockStore = new Map<string, string>();
let mockJwt: string | null = "jwt-A";
let mockAccounts = [
  { address: "0x" + "1".repeat(40), profileId: "A", jwt: "jwt-A" },
  { address: "0x" + "2".repeat(40), profileId: "B", jwt: "jwt-B" },
];
jest.mock("@capacitor/core", () => ({
  Capacitor: { isNativePlatform: jest.fn(() => true) },
}));
jest.mock("capacitor-secure-storage-plugin", () => ({
  SecureStoragePlugin: {
    get: jest.fn(async ({ key }: { key: string }) => {
      const value = mockStore.get(key);
      if (value === undefined)
        throw new Error("Item with given key does not exist");
      return { value };
    }),
    set: jest.fn(async ({ key, value }: { key: string; value: string }) => {
      mockStore.set(key, value);
    }),
  },
}));
jest.mock("@/services/api/common-api", () => ({ commonApiPost: jest.fn() }));
jest.mock("@/components/notifications/stable-device-id", () => ({
  getStableDeviceId: jest.fn(async () => "phone"),
}));
jest.mock("@/services/auth/auth.utils", () => ({
  getAuthJwt: () => mockJwt,
  getConnectedWalletAccounts: () => mockAccounts,
  getWalletAddress: () => mockAccounts[0]?.address ?? null,
}));
jest.mock("@/services/auth/native-refresh-token-storage", () => ({
  getNativeRefreshToken: jest.fn(
    async (address: string) => `refresh-${address}`
  ),
}));
jest.mock("@capacitor/push-notifications", () => ({
  PushNotifications: {
    getDeliveredNotifications: jest.fn(),
    removeDeliveredNotifications: jest.fn(),
    removeAllDeliveredNotifications: jest.fn(),
  },
}));
const post = jest.mocked(commonApiPost);
const storage = () =>
  JSON.parse(mockStore.get("push-installation-lifecycle-v1")!);
const delivered = (profile: string) => ({
  id: `native-${profile}`,
  data: { target_profile_id: profile },
});

beforeEach(async () => {
  await flushPendingPushLogouts();
  jest.clearAllMocks();
  mockStore.clear();
  mockJwt = "jwt-A";
  mockAccounts = [
    { address: "0x" + "1".repeat(40), profileId: "A", jwt: "jwt-A" },
    { address: "0x" + "2".repeat(40), profileId: "B", jwt: "jwt-B" },
  ];
  post.mockReset().mockResolvedValue({ revision: 1 });
  jest
    .mocked(PushNotifications.getDeliveredNotifications)
    .mockResolvedValue({ notifications: [delivered("A"), delivered("B")] });
  await preparePushInstallationRegistration("phone", "fcm-token", "jwt-A");
});

it("single-profile logout queues exact sessions and removes only its delivered entries", async () => {
  await queueNativePushLogout(mockAccounts[0]!.address, false);
  await flushPendingPushLogouts();
  expect(post).toHaveBeenCalledWith(
    expect.objectContaining({
      includeWalletAuth: false,
      body: expect.objectContaining({
        device_id: "phone",
        token: "fcm-token",
        profile_id: "A",
        all_profiles: false,
        revision: 1,
        sessions: [
          {
            address: mockAccounts[0]!.address,
            native_refresh_token: `refresh-${mockAccounts[0]!.address}`,
          },
        ],
      }),
    })
  );
  expect(PushNotifications.removeDeliveredNotifications).toHaveBeenCalledWith({
    notifications: [delivered("A")],
  });
  expect(
    PushNotifications.removeAllDeliveredNotifications
  ).not.toHaveBeenCalled();
});

it("all-profile logout requests a device sweep, including profiles absent locally", async () => {
  await queueNativePushLogout(null, true);
  await flushPendingPushLogouts();
  const body = post.mock.calls[0]![0].body;
  expect(body).toEqual(
    expect.objectContaining({ all_profiles: true, device_id: "phone" })
  );
  expect(body).not.toHaveProperty("profile_id");
  expect(body).not.toHaveProperty("all_sessions");
  expect(
    PushNotifications.removeAllDeliveredNotifications
  ).toHaveBeenCalledTimes(1);
});

it("persists offline cleanup and retries after active credentials disappear", async () => {
  post.mockRejectedValue(new Error("offline"));
  await queueNativePushLogout(null, true);
  await flushPendingPushLogouts();
  const pending = storage().pending;
  expect(pending).toHaveLength(1);
  mockAccounts = [];
  mockJwt = null;
  post.mockResolvedValue({ revision: 1 });
  await flushPendingPushLogouts();
  expect(post).toHaveBeenLastCalledWith(
    expect.objectContaining({ body: pending[0], includeWalletAuth: false })
  );
  expect(storage().pending).toEqual([]);
  expect(
    PushNotifications.removeAllDeliveredNotifications
  ).toHaveBeenCalledTimes(1);
});

it("prevents old-session registration and allows a fresh login at the new revision", async () => {
  const old = await preparePushInstallationRegistration(
    "phone",
    "fcm-token",
    "jwt-A"
  );
  await queueNativePushLogout(mockAccounts[0]!.address, false);
  await flushPendingPushLogouts();
  await expect(
    preparePushInstallationRegistration("phone", "fcm-token", "jwt-A")
  ).rejects.toThrow("signed-out");
  mockJwt = "new-jwt-A";
  const current = await preparePushInstallationRegistration(
    "phone",
    "fcm-token",
    mockJwt
  );
  expect(old.installation_revision).toBe(0);
  expect(current.installation_revision).toBe(1);
  expect(current.installation_secret).toBe(old.installation_secret);
});

it("defers new registration while failed logout work remains pending", async () => {
  post.mockRejectedValue(new Error("offline"));
  await queueNativePushLogout(null, true);
  await flushPendingPushLogouts();
  mockJwt = "new-jwt-A";
  await expect(
    preparePushInstallationRegistration("phone", "fcm-token", mockJwt)
  ).rejects.toThrow("deferred");
  expect(storage().pending).toHaveLength(1);
});

it("fails before tray cleanup if the revocation cannot be stored securely", async () => {
  jest
    .mocked(SecureStoragePlugin.set)
    .mockRejectedValueOnce(new Error("storage unavailable"));
  await expect(queueNativePushLogout(null, true)).rejects.toThrow(
    "storage unavailable"
  );
  expect(post).not.toHaveBeenCalled();
  expect(
    PushNotifications.removeAllDeliveredNotifications
  ).not.toHaveBeenCalled();
});

it("does not execute mobile cleanup on web", async () => {
  jest.mocked(Capacitor.isNativePlatform).mockReturnValueOnce(false);
  await queueNativePushLogout(null, true);
  expect(post).not.toHaveBeenCalled();
});

it("keeps a profile registered when another connected wallet still owns it", async () => {
  mockAccounts[1]!.profileId = "A";
  await queueNativePushLogout(mockAccounts[0]!.address, false);
  await flushPendingPushLogouts();
  expect(post.mock.calls[0]![0].body).not.toHaveProperty("profile_id");
  expect(PushNotifications.removeDeliveredNotifications).not.toHaveBeenCalled();
});

it("preserves corrupt installation storage instead of replacing the deletion proof", async () => {
  const corrupt = JSON.stringify({ secret: "bad", pending: [] });
  mockStore.set("push-installation-lifecycle-v1", corrupt);
  await expect(queueNativePushLogout(null, true)).rejects.toThrow(
    "Invalid push installation storage"
  );
  expect(mockStore.get("push-installation-lifecycle-v1")).toBe(corrupt);
  expect(post).not.toHaveBeenCalled();
  mockStore.clear();
});
