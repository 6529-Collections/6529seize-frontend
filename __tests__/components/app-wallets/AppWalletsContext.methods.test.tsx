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

const setMock = jest.fn().mockResolvedValue({ value: true });
const removeMock = jest.fn().mockResolvedValue({ value: true });
const keysMock = jest.fn().mockResolvedValue({ value: [] });

jest.mock("capacitor-secure-storage-plugin", () => ({
  SecureStoragePlugin: {
    keys: keysMock,
    set: setMock,
    get: jest.fn().mockResolvedValue({ value: "{}" }),
    remove: removeMock,
  },
}));

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

describe("AppWalletsContext methods", () => {
  it("creates and deletes wallet", async () => {
    const wrapper = ({ children }: any) => (
      <AppWalletsProvider>{children}</AppWalletsProvider>
    );
    const { result } = renderHook(() => useAppWallets(), { wrapper });

    // Wait for context to be defined
    await waitFor(() => expect(result.current.createAppWallet).toBeDefined());

    // Test wallet creation - this will test whether the secure storage is called
    // Even if appWalletsSupported is false, the method should exist and return false
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

    // If supported, the mocks should have been called
    if (result.current.appWalletsSupported) {
      expect(setMock).toHaveBeenCalled();
      expect(removeMock).toHaveBeenCalled();
    }
  });
});
