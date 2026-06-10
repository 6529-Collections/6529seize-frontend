import { Capacitor } from "@capacitor/core";
import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";
import {
  getNativeRefreshToken,
  setNativeRefreshToken,
} from "@/services/auth/native-refresh-token-storage";

jest.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: jest.fn(),
  },
}));

jest.mock("capacitor-secure-storage-plugin", () => ({
  SecureStoragePlugin: {
    get: jest.fn(),
    remove: jest.fn(),
    set: jest.fn(),
  },
}));

const mockCapacitor = Capacitor as jest.Mocked<typeof Capacitor>;
const mockSecureStoragePlugin = SecureStoragePlugin as jest.Mocked<
  typeof SecureStoragePlugin
>;

describe("native refresh token storage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCapacitor.isNativePlatform.mockReturnValue(true);
    mockSecureStoragePlugin.set.mockResolvedValue({ value: true });
  });

  it("caches a native refresh token only after secure storage accepts it", async () => {
    const address = "0x00000000000000000000000000000000000000aa";

    await setNativeRefreshToken({
      address,
      refreshToken: "native-refresh-token",
    });

    const token = await getNativeRefreshToken(address);

    expect(token).toBe("native-refresh-token");
    expect(mockSecureStoragePlugin.get).not.toHaveBeenCalled();
  });

  it("does not cache a rotated token when secure storage rejects the write", async () => {
    const address = "0x00000000000000000000000000000000000000bb";
    mockSecureStoragePlugin.set.mockRejectedValueOnce(
      new Error("secure storage unavailable")
    );
    mockSecureStoragePlugin.get.mockResolvedValueOnce({
      value: "old-native-refresh-token",
    });

    await expect(
      setNativeRefreshToken({
        address,
        refreshToken: "new-native-refresh-token",
      })
    ).rejects.toThrow("secure storage unavailable");

    await expect(getNativeRefreshToken(address)).resolves.toBe(
      "old-native-refresh-token"
    );
    expect(mockSecureStoragePlugin.get).toHaveBeenCalledWith({
      key: "6529-native-refresh-token:0x00000000000000000000000000000000000000bb",
    });
  });
});
