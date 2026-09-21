import { Capacitor } from "@capacitor/core";
import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";
import { PushNotifications } from "@capacitor/push-notifications";
import { commonApiPost } from "@/services/api/common-api";
import {
  getPushInstallationBadgeRefreshRequest,
  preparePushInstallationRegistration,
  completePushInstallationMigration,
  queueNativePushLogout,
  flushPendingPushLogouts,
} from "@/services/notifications/push-installation";

let mockDeviceId = "phone";
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
  getPushDeviceIdentity: jest.fn(async () => ({
    deviceId: mockDeviceId,
    nativeId: mockDeviceId,
  })),
}));
jest.mock("@/services/auth/auth.utils", () => ({
  getAuthJwt: () => mockJwt,
  isAuthJwtUsable: (jwt: string) => !!jwt,
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
  mockDeviceId = "phone";
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

it("persists the final unsigned revision and refuses overflow without losing cleanup", async () => {
  const state = storage();
  state.revision = 4294967294;
  mockStore.set("push-installation-lifecycle-v1", JSON.stringify(state));
  post.mockRejectedValue(new Error("offline"));
  await queueNativePushLogout(mockAccounts[0]!.address, false);
  await flushPendingPushLogouts();
  expect(storage().revision).toBe(4294967295);
  expect(storage().pending[0].revision).toBe(4294967295);
  const saved = mockStore.get("push-installation-lifecycle-v1");
  await expect(queueNativePushLogout(null, true)).rejects.toThrow(
    "revision exhausted"
  );
  expect(mockStore.get("push-installation-lifecycle-v1")).toBe(saved);
  expect(
    PushNotifications.removeAllDeliveredNotifications
  ).not.toHaveBeenCalled();
});

it("replays logout without AbortSignal.timeout on older native WebViews", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(AbortSignal, "timeout");
  Object.defineProperty(AbortSignal, "timeout", {
    value: undefined,
    configurable: true,
  });
  try {
    await queueNativePushLogout(null, true);
    await flushPendingPushLogouts();
    expect(post).toHaveBeenCalledWith(
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
    expect(storage().pending).toEqual([]);
  } finally {
    if (descriptor) Object.defineProperty(AbortSignal, "timeout", descriptor);
    else Reflect.deleteProperty(AbortSignal, "timeout");
  }
});

it("aborts a stalled logout and retains it for retry without leaving timers", async () => {
  jest.useFakeTimers();
  try {
    post.mockImplementation(
      ({ signal }) =>
        new Promise((_, reject) => {
          signal!.addEventListener(
            "abort",
            () => reject(new Error("aborted")),
            { once: true }
          );
        })
    );
    await queueNativePushLogout(null, true);
    const flush = flushPendingPushLogouts();
    await jest.advanceTimersByTimeAsync(15000);
    await flush;
    expect(post.mock.calls[0]![0].signal!.aborted).toBe(true);
    expect(storage().pending).toHaveLength(1);
    expect(jest.getTimerCount()).toBe(0);
    post.mockResolvedValue({ revision: 1 });
    await flushPendingPushLogouts();
    expect(storage().pending).toEqual([]);
    expect(jest.getTimerCount()).toBe(0);
  } finally {
    jest.useRealTimers();
  }
});

it("registers A/B on a replacement phone despite repeated legacy 403s, preserving the original outbox", async () => {
  post.mockRejectedValue(
    new Error("Legacy installation token ownership is ambiguous")
  );
  await queueNativePushLogout(null, true);
  await flushPendingPushLogouts();
  const original = storage();
  const oldJob = original.pending[0];
  mockDeviceId = "replacement-phone";
  mockJwt = "new-jwt-A";
  for (let attempt = 0; attempt < 4; attempt++) {
    mockJwt = attempt % 2 ? "new-jwt-B" : "new-jwt-A";
    const credential = await preparePushInstallationRegistration(
      mockDeviceId,
      "current-native-token",
      mockJwt
    );
    expect(credential.installation_revision).toBe(0);
    expect(credential.installation_secret).not.toBe(original.secret);
    expect(credential.previous_device_id).toBe("phone");
  }
  await completePushInstallationMigration(mockDeviceId, "current-native-token");
  const state = storage();
  expect(state.pending).toHaveLength(2);
  expect(state.pending[0]).toEqual(oldJob);
  expect(state.pending[1]).toMatchObject({
    device_id: "phone",
    token: "current-native-token",
    token_scoped: true,
    all_profiles: true,
  });
  expect(state.pending[1].installation_secret).not.toBe(original.secret);
});

it("drains independent token cleanup and current-phone logout even when old cleanup fails", async () => {
  post.mockRejectedValue(new Error("legacy 403"));
  await queueNativePushLogout(null, true);
  await flushPendingPushLogouts();
  const oldJob = storage().pending[0];
  mockDeviceId = "replacement-phone";
  mockJwt = "new-jwt-A";
  post.mockImplementation(async ({ body }) => {
    const request = body as { device_id: string; token_scoped?: boolean };
    if (request.device_id === "phone" && !request.token_scoped)
      throw new Error("legacy 403");
    return { revision: 1 };
  });
  await preparePushInstallationRegistration(
    mockDeviceId,
    "current-token",
    mockJwt
  );
  await completePushInstallationMigration(mockDeviceId, "current-token");
  expect(storage().pending).toEqual([oldJob]);
  await queueNativePushLogout(null, true);
  await flushPendingPushLogouts();
  // Both installations used revision 1: acknowledging the new one must not
  // discard the old one's failed deletion proof.
  expect(storage().pending).toEqual([oldJob]);
  expect(storage().revision).toBe(1);
});

it("still blocks registration behind failed logout belonging to the current phone after migration", async () => {
  mockDeviceId = "replacement-phone";
  mockJwt = "new-jwt-A";
  await preparePushInstallationRegistration(
    mockDeviceId,
    "current-token",
    mockJwt
  );
  post.mockRejectedValue(new Error("offline"));
  await queueNativePushLogout(null, true);
  await flushPendingPushLogouts();
  mockJwt = "another-new-login";
  await expect(
    preparePushInstallationRegistration(mockDeviceId, "current-token", mockJwt)
  ).rejects.toThrow("deferred");
  expect(
    storage().pending.some(
      (job: { device_id: string }) => job.device_id === mockDeviceId
    )
  ).toBe(true);
});

describe("badge refresh proof", () => {
  const authKey = () =>
    require("@/services/auth/auth-token-fingerprint").getAuthTokenFingerprint(
      "jwt-A"
    );
  it("returns the current proof without changing stored state or sending a request", async () => {
    const before = storage();
    await expect(
      getPushInstallationBadgeRefreshRequest("phone", "fcm-token", authKey())
    ).resolves.toEqual({
      device_id: "phone",
      installation_secret: before.secret,
      revision: 0,
    });
    expect(storage()).toEqual(before);
    expect(post).not.toHaveBeenCalled();
  });
  it("rejects a different device, rotated token, or changed auth session", async () => {
    await expect(
      getPushInstallationBadgeRefreshRequest(
        "other-phone",
        "fcm-token",
        authKey()
      )
    ).resolves.toBeNull();
    await expect(
      getPushInstallationBadgeRefreshRequest("phone", "old-token", authKey())
    ).resolves.toBeNull();
    mockJwt = "jwt-B";
    await expect(
      getPushInstallationBadgeRefreshRequest("phone", "fcm-token", authKey())
    ).resolves.toBeNull();
  });
  it("waits for another profile's pending logout, then uses the advanced revision", async () => {
    post.mockRejectedValue(new Error("offline"));
    await queueNativePushLogout(mockAccounts[1]!.address, false);
    await flushPendingPushLogouts();
    await expect(
      getPushInstallationBadgeRefreshRequest("phone", "fcm-token", authKey())
    ).resolves.toBeNull();
    post.mockResolvedValue({ revision: 1 });
    await flushPendingPushLogouts();
    await expect(
      getPushInstallationBadgeRefreshRequest("phone", "fcm-token", authKey())
    ).resolves.toEqual({
      device_id: "phone",
      installation_secret: storage().secret,
      revision: 1,
    });
  });

  it("refuses refresh while logout is pending or the session has signed out", async () => {
    post.mockRejectedValue(new Error("offline"));
    await queueNativePushLogout(mockAccounts[0]!.address, false);
    await flushPendingPushLogouts();
    await expect(
      getPushInstallationBadgeRefreshRequest("phone", "fcm-token", authKey())
    ).resolves.toBeNull();
    post.mockResolvedValue({ revision: 1 });
    await flushPendingPushLogouts();
    await expect(
      getPushInstallationBadgeRefreshRequest("phone", "fcm-token", authKey())
    ).resolves.toBeNull();
  });
});
