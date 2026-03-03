import * as Sentry from "@sentry/nextjs";
import { getStableDeviceId } from "@/components/notifications/stable-device-id";
import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";
import { v4 as uuidv4 } from "uuid";

jest.mock("@sentry/nextjs", () => ({
  addBreadcrumb: jest.fn(),
}));

jest.mock("uuid", () => ({
  v4: jest.fn(),
}));

jest.mock("capacitor-secure-storage-plugin", () => ({
  SecureStoragePlugin: {
    get: jest.fn(),
    set: jest.fn(),
  },
}));

const mockedSecureStoragePlugin = SecureStoragePlugin as {
  get: jest.Mock;
  set: jest.Mock;
};
const mockedUuidv4 = uuidv4 as jest.Mock;
const mockedSentry = Sentry as {
  addBreadcrumb: jest.Mock;
};

describe("getStableDeviceId", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns existing device ID when secure storage has a value", async () => {
    mockedSecureStoragePlugin.get.mockResolvedValueOnce({
      value: "existing-id",
    });

    await expect(getStableDeviceId()).resolves.toBe("existing-id");

    expect(mockedSecureStoragePlugin.get).toHaveBeenCalledWith({
      key: "stable_device_id",
    });
    expect(mockedSecureStoragePlugin.set).not.toHaveBeenCalled();
    expect(mockedSentry.addBreadcrumb).not.toHaveBeenCalled();
  });

  it("recovers when key does not exist by generating and persisting an ID", async () => {
    mockedSecureStoragePlugin.get.mockRejectedValueOnce(
      new Error("Item with given key does not exist")
    );
    mockedUuidv4.mockReturnValueOnce("generated-id");
    mockedSecureStoragePlugin.set.mockResolvedValueOnce({ value: true });

    await expect(getStableDeviceId()).resolves.toBe("generated-id");

    expect(mockedSecureStoragePlugin.set).toHaveBeenCalledWith({
      key: "stable_device_id",
      value: "generated-id",
    });
    expect(mockedSentry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "notifications",
        level: "warning",
        message: "Recovered stable_device_id secure-storage read failure",
      })
    );
  });

  it("recovers when decrypt-related keystore errors occur", async () => {
    mockedSecureStoragePlugin.get.mockRejectedValueOnce(
      new Error("javax.crypto.IllegalBlockSizeException KeyStoreException")
    );
    mockedUuidv4.mockReturnValueOnce("regenerated-id");
    mockedSecureStoragePlugin.set.mockResolvedValueOnce({ value: true });

    await expect(getStableDeviceId()).resolves.toBe("regenerated-id");

    expect(mockedSecureStoragePlugin.set).toHaveBeenCalledWith({
      key: "stable_device_id",
      value: "regenerated-id",
    });
    expect(mockedSentry.addBreadcrumb).toHaveBeenCalledTimes(1);
  });

  it("rejects when persisting a regenerated ID fails", async () => {
    mockedSecureStoragePlugin.get.mockRejectedValueOnce(
      new Error("Item with given key does not exist")
    );
    mockedUuidv4.mockReturnValueOnce("generated-id");
    mockedSecureStoragePlugin.set.mockRejectedValueOnce(
      new Error("set failed")
    );

    await expect(getStableDeviceId()).rejects.toThrow("set failed");
  });

  it("uses single-flight behavior for concurrent calls", async () => {
    let resolveGet: ((value: { value: string }) => void) | null = null;
    mockedSecureStoragePlugin.get.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveGet = resolve;
      })
    );

    const callOne = getStableDeviceId();
    const callTwo = getStableDeviceId();

    expect(mockedSecureStoragePlugin.get).toHaveBeenCalledTimes(1);

    resolveGet?.({ value: "shared-id" });

    await expect(Promise.all([callOne, callTwo])).resolves.toEqual([
      "shared-id",
      "shared-id",
    ]);
  });

  it("retries storage read after a failed attempt", async () => {
    mockedSecureStoragePlugin.get
      .mockRejectedValueOnce(new Error("unexpected failure"))
      .mockResolvedValueOnce({ value: "retry-success-id" });

    await expect(getStableDeviceId()).rejects.toThrow("unexpected failure");
    await expect(getStableDeviceId()).resolves.toBe("retry-success-id");

    expect(mockedSecureStoragePlugin.get).toHaveBeenCalledTimes(2);
  });
});
