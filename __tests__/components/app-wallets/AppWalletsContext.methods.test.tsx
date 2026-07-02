import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  AppWalletsProvider,
  useAppWallets,
} from "@/components/app-wallets/AppWalletsContext";

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: jest.fn().mockReturnValue({ isCapacitor: true }),
}));

jest.mock("capacitor-secure-storage-plugin", () => ({
  SecureStoragePlugin: {
    keys: jest.fn().mockResolvedValue({ value: [] }),
    set: jest.fn().mockResolvedValue({ value: true }),
    get: jest.fn().mockResolvedValue({ value: "{}" }),
    remove: jest.fn().mockResolvedValue({ value: true }),
  },
}));

const mockSecureStorage = jest.requireMock(
  "capacitor-secure-storage-plugin"
) as {
  SecureStoragePlugin: {
    keys: jest.Mock;
    set: jest.Mock;
    get: jest.Mock;
    remove: jest.Mock;
  };
};
const mockSet = mockSecureStorage.SecureStoragePlugin.set;
const mockRemove = mockSecureStorage.SecureStoragePlugin.remove;
const mockKeys = mockSecureStorage.SecureStoragePlugin.keys;
const mockGet = mockSecureStorage.SecureStoragePlugin.get;

jest.mock("ethers", () => ({
  ethers: {
    Wallet: {
      createRandom: () => ({
        address: "0x1",
        mnemonic: { phrase: "p" },
        privateKey: "k",
      }),
    },
    isAddress: () => true,
  },
}));

jest.mock("@/components/app-wallets/app-wallet-helpers", () => ({
  decryptData: jest.fn(async (_salt, value) =>
    typeof value === "string" && value.startsWith("legacy:")
      ? value.slice("legacy:".length)
      : value
  ),
  encryptData: jest.fn(async (_salt, value) => `v2:${value}`),
  isAppWalletEncryptedEnvelope: jest.fn(
    (value) => typeof value === "string" && value.startsWith("v2:")
  ),
}));

jest.mock("@/helpers/time", () => ({
  Time: { now: () => ({ toSeconds: () => 1 }) },
}));

jest.mock("@/utils/monitoring/mobileLaunchTiming", () => ({
  measureMobileLaunchAsync: jest.fn(
    async (_stepName: string, task: () => unknown) => await task()
  ),
  setMobileLaunchContext: jest.fn(),
}));

describe("AppWalletsContext methods", () => {
  beforeEach(() => {
    mockSet.mockClear();
    mockRemove.mockClear();
    mockGet.mockResolvedValue({ value: "{}" });
    mockKeys.mockResolvedValue({ value: [] });
  });

  it("creates and deletes wallet", async () => {
    const wrapper = ({ children }: any) => (
      <AppWalletsProvider>{children}</AppWalletsProvider>
    );
    const { result } = renderHook(() => useAppWallets(), { wrapper });

    // Wait for context to be defined
    await waitFor(() => expect(result.current.createAppWallet).toBeDefined());
    await waitFor(() => expect(result.current.appWalletsSupported).toBe(true));

    // Test wallet creation - this will test whether the secure storage is called
    let createResult = false;
    await act(async () => {
      createResult = await result.current.createAppWallet("n", "p");
    });

    // Test wallet deletion
    let deleteResult = false;
    await act(async () => {
      deleteResult = await result.current.deleteAppWallet("0x1");
    });

    // The methods should exist and return boolean values
    expect(typeof createResult).toBe("boolean");
    expect(typeof deleteResult).toBe("boolean");

    // If supported, the mocks should have been called
    if (result.current.appWalletsSupported) {
      expect(mockSet).toHaveBeenCalled();
      expect(mockRemove).toHaveBeenCalled();
    }
  });

  it("migrates a legacy wallet after verified unlock", async () => {
    const address = "0x0000000000000000000000000000000000000001";
    const legacyWallet = {
      name: "Legacy",
      created_at: 1,
      address,
      address_hashed: `legacy:${address}`,
      mnemonic: "legacy:N/A",
      private_key: "legacy:0xprivate",
      imported: true,
      has_mnemonic: false,
    };
    mockGet.mockResolvedValue({ value: JSON.stringify(legacyWallet) });

    const wrapper = ({ children }: any) => (
      <AppWalletsProvider>{children}</AppWalletsProvider>
    );
    const { result } = renderHook(() => useAppWallets(), { wrapper });

    await waitFor(() => expect(result.current.migrateAppWallet).toBeDefined());
    await waitFor(() => expect(result.current.appWalletsSupported).toBe(true));

    let migrationResult = false;
    await act(async () => {
      migrationResult = await result.current.migrateAppWallet(address, "pass");
    });

    expect(migrationResult).toBe(true);
    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        key: `app-wallet_${address}`,
        value: expect.stringContaining('"encryption_version":2'),
      })
    );
  });
});
