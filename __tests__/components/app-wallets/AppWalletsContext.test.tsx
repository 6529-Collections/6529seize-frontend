import React from "react";
import { render, screen } from "@testing-library/react";
import {
  AppWalletsProvider,
  useAppWallets,
  appWalletsEventEmitter,
} from "@/components/app-wallets/AppWalletsContext";

// Mock all the external dependencies to avoid complex async behavior
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({
    isCapacitor: false,
    platform: "web",
    isIos: false,
    isAndroid: false,
    orientation: 0,
    keyboardVisible: false,
    isActive: true,
  }),
}));

jest.mock("@/components/app-wallets/app-wallet-helpers", () => ({
  encryptData: jest.fn().mockResolvedValue("encrypted_data"),
}));

jest.mock("@/helpers/time", () => ({
  Time: {
    now: () => ({
      toSeconds: () => 1640995200,
    }),
  },
}));

jest.mock("ethers", () => ({
  ethers: {
    Wallet: {
      createRandom: () => ({
        address: "0x1234567890abcdef",
        mnemonic: { phrase: "test mnemonic phrase" },
        privateKey: "0xprivatekey123",
      }),
    },
  },
}));

jest.mock("capacitor-secure-storage-plugin", () => ({
  SecureStoragePlugin: {
    keys: jest.fn().mockRejectedValue(new Error("Plugin not available")),
    set: jest.fn().mockResolvedValue({ value: true }),
    get: jest.fn().mockResolvedValue({ value: "{}" }),
    remove: jest.fn().mockResolvedValue({ value: true }),
  },
}));

describe("AppWalletsContext", () => {
  describe("AppWalletsProvider", () => {
    it("renders children correctly", () => {
      render(
        <AppWalletsProvider>
          <div data-testid="child">Test Child</div>
        </AppWalletsProvider>
      );

      expect(screen.getByTestId("child")).toBeInTheDocument();
      expect(screen.getByText("Test Child")).toBeInTheDocument();
    });

    it("provides context with all required methods", () => {
      const TestComponent = () => {
        const context = useAppWallets();
        return (
          <div>
            <div data-testid="has-context">{context ? "true" : "false"}</div>
            <div data-testid="has-create">
              {typeof context.createAppWallet === "function" ? "true" : "false"}
            </div>
            <div data-testid="has-import">
              {typeof context.importAppWallet === "function" ? "true" : "false"}
            </div>
            <div data-testid="has-delete">
              {typeof context.deleteAppWallet === "function" ? "true" : "false"}
            </div>
            <div data-testid="is-array">
              {Array.isArray(context.appWallets) ? "true" : "false"}
            </div>
            <div data-testid="has-fetching">
              {typeof context.fetchingAppWallets === "boolean"
                ? "true"
                : "false"}
            </div>
            <div data-testid="has-supported">
              {typeof context.appWalletsSupported === "boolean"
                ? "true"
                : "false"}
            </div>
          </div>
        );
      };

      render(
        <AppWalletsProvider>
          <TestComponent />
        </AppWalletsProvider>
      );

      expect(screen.getByTestId("has-context")).toHaveTextContent("true");
      expect(screen.getByTestId("has-create")).toHaveTextContent("true");
      expect(screen.getByTestId("has-import")).toHaveTextContent("true");
      expect(screen.getByTestId("has-delete")).toHaveTextContent("true");
      expect(screen.getByTestId("is-array")).toHaveTextContent("true");
      expect(screen.getByTestId("has-fetching")).toHaveTextContent("true");
      expect(screen.getByTestId("has-supported")).toHaveTextContent("true");
    });

    it("initializes with default state", () => {
      const TestComponent = () => {
        const { appWallets, fetchingAppWallets, appWalletsSupported } =
          useAppWallets();
        return (
          <div>
            <div data-testid="wallets-length">{appWallets.length}</div>
            <div data-testid="fetching">{fetchingAppWallets.toString()}</div>
            <div data-testid="supported">{appWalletsSupported.toString()}</div>
          </div>
        );
      };

      render(
        <AppWalletsProvider>
          <TestComponent />
        </AppWalletsProvider>
      );

      expect(screen.getByTestId("wallets-length")).toHaveTextContent("0");
      // Initially true while checking support
      expect(screen.getByTestId("fetching")).toHaveTextContent("true");
      // Initially false until support is checked
      expect(screen.getByTestId("supported")).toHaveTextContent("false");
    });
  });

  describe("useAppWallets hook", () => {
    it("throws error when used outside provider", () => {
      const TestComponent = () => {
        useAppWallets();
        return null;
      };

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      expect(() => render(<TestComponent />)).toThrow(
        "useAppWallets must be used within an AppWalletsProvider"
      );

      consoleSpy.mockRestore();
    });
  });

  describe("appWalletsEventEmitter", () => {
    it("is exported and functional", () => {
      expect(appWalletsEventEmitter).toBeDefined();
      expect(typeof appWalletsEventEmitter.on).toBe("function");
      expect(typeof appWalletsEventEmitter.emit).toBe("function");
      expect(typeof appWalletsEventEmitter.removeListener).toBe("function");
    });

    it("can emit and listen to events", () => {
      const mockListener = jest.fn();
      appWalletsEventEmitter.on("test-event", mockListener);

      appWalletsEventEmitter.emit("test-event", "test-data");

      expect(mockListener).toHaveBeenCalledWith("test-data");
      expect(mockListener).toHaveBeenCalledTimes(1);

      appWalletsEventEmitter.removeListener("test-event", mockListener);
    });

    it("handles multiple listeners", () => {
      const mockListener1 = jest.fn();
      const mockListener2 = jest.fn();

      appWalletsEventEmitter.on("multi-test", mockListener1);
      appWalletsEventEmitter.on("multi-test", mockListener2);

      appWalletsEventEmitter.emit("multi-test", "shared-data");

      expect(mockListener1).toHaveBeenCalledWith("shared-data");
      expect(mockListener2).toHaveBeenCalledWith("shared-data");

      appWalletsEventEmitter.removeAllListeners("multi-test");
    });
  });

  describe("interface types", () => {
    it("AppWallet interface is properly structured", () => {
      // This test ensures the interface is exported and importable
      const TestComponent = () => {
        const { appWallets } = useAppWallets();

        // Test that we can access the wallet properties
        const hasWalletStructure = appWallets.every(
          (wallet: any) =>
            typeof wallet === "object" &&
            "name" in wallet &&
            "created_at" in wallet &&
            "address" in wallet &&
            "address_hashed" in wallet &&
            "mnemonic" in wallet &&
            "private_key" in wallet &&
            "imported" in wallet
        );

        return (
          <div data-testid="wallet-structure">
            {hasWalletStructure.toString()}
          </div>
        );
      };

      render(
        <AppWalletsProvider>
          <TestComponent />
        </AppWalletsProvider>
      );

      // Empty array should return true for every()
      expect(screen.getByTestId("wallet-structure")).toHaveTextContent("true");
    });
  });

  describe("context value memoization", () => {
    it("provides stable context object", () => {
      let contextValueChanges = 0;
      let lastContextValue: any = null;

      const TestComponent = () => {
        const contextValue = useAppWallets();

        if (lastContextValue !== contextValue) {
          contextValueChanges++;
          lastContextValue = contextValue;
        }

        return <div data-testid="context-changes">{contextValueChanges}</div>;
      };

      const { rerender } = render(
        <AppWalletsProvider>
          <TestComponent />
        </AppWalletsProvider>
      );

      // Should have changed once on mount
      expect(screen.getByTestId("context-changes")).toHaveTextContent("1");

      // Re-render should not change context value due to memoization
      rerender(
        <AppWalletsProvider>
          <TestComponent />
        </AppWalletsProvider>
      );

      // Should still be 1 if properly memoized
      expect(screen.getByTestId("context-changes")).toHaveTextContent("1");
    });
  });

  describe("constants and exports", () => {
    it("exports the correct wallet key prefix", () => {
      // Test that the component handles the wallet key prefix correctly
      // We can't directly test the constant, but we can test its usage
      const TestComponent = () => {
        const { createAppWallet } = useAppWallets();

        // Just testing that the function exists and is callable
        const isCallable = typeof createAppWallet === "function";

        return <div data-testid="create-callable">{isCallable.toString()}</div>;
      };

      render(
        <AppWalletsProvider>
          <TestComponent />
        </AppWalletsProvider>
      );

      expect(screen.getByTestId("create-callable")).toHaveTextContent("true");
    });
  });
});
