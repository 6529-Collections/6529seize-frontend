import { Device } from "@capacitor/device";
import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";
import {
  getPushDeviceIdentity,
  getStableDeviceId,
} from "@/components/notifications/stable-device-id";

const mockStore = new Map<string, string>();
jest.mock("@capacitor/device", () => ({ Device: { getId: jest.fn() } }));
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
beforeEach(() => {
  jest.clearAllMocks();
  mockStore.clear();
  jest.mocked(Device.getId).mockResolvedValue({ identifier: "native-phone-A" });
});
it("creates a stable identity shared by concurrent callers and later launches", async () => {
  const [one, two] = await Promise.all([
    getStableDeviceId(),
    getStableDeviceId(),
  ]);
  expect(one).toBe(two);
  expect(await getStableDeviceId()).toBe(one);
  expect(SecureStoragePlugin.set).toHaveBeenCalledTimes(1);
});
it("migrates the unbound legacy UUID without destroying the recovery reference", async () => {
  mockStore.set("stable_device_id", "legacy-phone");
  const identity = await getPushDeviceIdentity();
  expect(identity.deviceId).not.toBe("legacy-phone");
  expect(identity.previousDeviceId).toBe("legacy-phone");
  expect(mockStore.get("stable_device_id")).toBe("legacy-phone");
});
it("gives a restored backup on another phone a distinct delivery identity", async () => {
  const original = await getPushDeviceIdentity();
  jest.mocked(Device.getId).mockResolvedValue({ identifier: "native-phone-B" });
  const replacement = await getPushDeviceIdentity();
  expect(replacement.deviceId).not.toBe(original.deviceId);
  expect(replacement.previousDeviceId).toBe(original.deviceId);
  expect(await getStableDeviceId()).toBe(replacement.deviceId);
});
it("preserves storage and fails closed when native identity is unavailable", async () => {
  jest
    .mocked(Device.getId)
    .mockRejectedValueOnce(new Error("native unavailable"));
  await expect(getStableDeviceId()).rejects.toThrow("native unavailable");
  expect(SecureStoragePlugin.set).not.toHaveBeenCalled();
});
it("does not replace an unreadable credential binding", async () => {
  jest
    .mocked(SecureStoragePlugin.get)
    .mockRejectedValueOnce(new Error("keychain locked"));
  await expect(getStableDeviceId()).rejects.toThrow("keychain locked");
  expect(SecureStoragePlugin.set).not.toHaveBeenCalled();
});
it("does not use an identity whose persistence failed", async () => {
  jest
    .mocked(SecureStoragePlugin.set)
    .mockRejectedValueOnce(new Error("write failed"));
  await expect(getStableDeviceId()).rejects.toThrow("write failed");
  expect(mockStore.size).toBe(0);
});
