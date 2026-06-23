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

const secureStorageMock = jest.requireMock(
  "capacitor-secure-storage-plugin"
).SecureStoragePlugin;
const setMock = secureStorageMock.set as jest.Mock;
const removeMock = secureStorageMock.remove as jest.Mock;

jest.mock("ethers", () => ({
  ethers: {
    Wallet: {
      createRandom: () => ({
        address: "0x1",
        mnemonic: { phrase: "p" },
        privateKey: "k",
      }),
    },
  },
}));

jest.mock("@/components/app-wallets/app-wallet-helpers", () => ({
  encryptData: jest.fn(async (_a, _b, v) => v),
}));

jest.mock("@/helpers/time", () => ({
  Time: { now: () => ({ toSeconds: () => 1 }) },
}));

jest.mock("@/utils/monitoring/mobileLaunchTiming", () => ({
  measureMobileLaunchAsync: jest.fn(
    async (_stepName: string, task: () => unknown) => await task()
  ),
}));

describe("AppWalletsContext methods", () => {
  it("creates and deletes wallet", async () => {
    const wrapper = ({ children }: any) => (
      <AppWalletsProvider>{children}</AppWalletsProvider>
    );
    const { result } = renderHook(() => useAppWallets(), { wrapper });

    // Wait for context to be defined
    await waitFor(() => expect(result.current.createAppWallet).toBeDefined());
    await waitFor(() => expect(result.current.appWalletsSupported).toBe(true));

    // Test wallet creation - this will test whether the secure storage is called
    const createResult = await act(
      async () => await result.current.createAppWallet("n", "p")
    );

    // Test wallet deletion
    const deleteResult = await act(
      async () => await result.current.deleteAppWallet("0x1")
    );

    // The methods should exist and return boolean values
    expect(typeof createResult).toBe("boolean");
    expect(typeof deleteResult).toBe("boolean");
    expect(setMock).toHaveBeenCalled();
    expect(removeMock).toHaveBeenCalled();
  });
});
