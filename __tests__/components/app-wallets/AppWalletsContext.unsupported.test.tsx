import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  AppWalletsProvider,
  useAppWallets,
} from "@/components/app-wallets/AppWalletsContext";
import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";

jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));

jest.mock("capacitor-secure-storage-plugin", () => ({
  SecureStoragePlugin: { set: jest.fn() },
}));

describe("AppWalletsContext unsupported", () => {
  it("createAppWallet returns false when not supported", async () => {
    const wrapper = ({ children }: any) => (
      <AppWalletsProvider>{children}</AppWalletsProvider>
    );
    const { result } = renderHook(() => useAppWallets(), { wrapper });
    await waitFor(() => result.current.createAppWallet !== undefined);
    const res = await act(async () => result.current.createAppWallet("n", "p"));
    expect(res).toBe(false);
    expect(SecureStoragePlugin.set).not.toHaveBeenCalled();
  });
});
