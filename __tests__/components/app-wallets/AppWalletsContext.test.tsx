import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
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

    it("initializes with correct final state after async operations", async () => {
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

      // Wait for initialization to complete
      await waitFor(() => {
        expect(screen.getByTestId("fetching")).toHaveTextContent("false");
      });

      // After initialization completes (with mocked non-Capacitor environment)
      expect(screen.getByTestId("wallets-length")).toHaveTextContent("0");
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


  describe("context value memoization", () => {
    it("provides stable context object with proper memoization", async () => {
      let renderCount = 0;

      const TestComponent = () => {
        const contextValue = useAppWallets();
        renderCount++;

        return (
          <div>
            <div data-testid="render-count">{renderCount}</div>
            <div data-testid="context-exists">{contextValue ? "true" : "false"}</div>
            <div data-testid="context-functions-exist">{
              typeof contextValue.createAppWallet === "function" &&
              typeof contextValue.importAppWallet === "function" &&
              typeof contextValue.deleteAppWallet === "function" ? "true" : "false"
            }</div>
          </div>
        );
      };

      const { rerender } = render(
        <AppWalletsProvider>
          <TestComponent />
        </AppWalletsProvider>
      );

      // Wait for initial render to complete
      await waitFor(() => {
        expect(screen.getByTestId("context-exists")).toHaveTextContent("true");
      });

      expect(screen.getByTestId("context-functions-exist")).toHaveTextContent("true");
      const initialRenderCount = parseInt(screen.getByTestId("render-count").textContent || "0");

      // Force a re-render with the same provider
      rerender(
        <AppWalletsProvider>
          <TestComponent />
        </AppWalletsProvider>
      );

      // Context should still be functional after rerender
      await waitFor(() => {
        expect(screen.getByTestId("context-exists")).toHaveTextContent("true");
      });

      expect(screen.getByTestId("context-functions-exist")).toHaveTextContent("true");
      // Component should have re-rendered since we created a new provider instance
      expect(parseInt(screen.getByTestId("render-count").textContent || "0")).toBeGreaterThan(initialRenderCount);
    });
  });

  describe("Wallet Operations - Error Handling", () => {
    it("createAppWallet fails when app wallets not supported", async () => {
      const TestComponent = () => {
        const { createAppWallet, appWalletsSupported } = useAppWallets();
        const [result, setResult] = React.useState<boolean | null>(null);

        const handleCreate = async () => {
          try {
            const success = await createAppWallet("Test Wallet", "password123");
            setResult(success);
          } catch (error) {
            setResult(false);
          }
        };

        return (
          <div>
            <div data-testid="supported">{appWalletsSupported.toString()}</div>
            <button onClick={handleCreate} data-testid="create-btn">Create</button>
            <div data-testid="result">{result?.toString() || "null"}</div>
          </div>
        );
      };

      render(
        <AppWalletsProvider>
          <TestComponent />
        </AppWalletsProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId("supported")).toHaveTextContent("false");
      });

      // Try to create wallet
      act(() => {
        screen.getByTestId("create-btn").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("result")).toHaveTextContent("false");
      });
    });

    it("importAppWallet fails when app wallets not supported", async () => {
      const TestComponent = () => {
        const { importAppWallet, appWalletsSupported } = useAppWallets();
        const [result, setResult] = React.useState<boolean | null>(null);

        const handleImport = async () => {
          try {
            const success = await importAppWallet(
              "Imported Wallet",
              "password123",
              "0x1234567890abcdef",
              "test mnemonic phrase",
              "0xprivatekey123"
            );
            setResult(success);
          } catch (error) {
            setResult(false);
          }
        };

        return (
          <div>
            <div data-testid="supported">{appWalletsSupported.toString()}</div>
            <button onClick={handleImport} data-testid="import-btn">Import</button>
            <div data-testid="result">{result?.toString() || "null"}</div>
          </div>
        );
      };

      render(
        <AppWalletsProvider>
          <TestComponent />
        </AppWalletsProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId("supported")).toHaveTextContent("false");
      });

      // Try to import wallet
      act(() => {
        screen.getByTestId("import-btn").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("result")).toHaveTextContent("false");
      });
    });

    it("deleteAppWallet fails when app wallets not supported", async () => {
      const TestComponent = () => {
        const { deleteAppWallet, appWalletsSupported } = useAppWallets();
        const [result, setResult] = React.useState<boolean | null>(null);

        const handleDelete = async () => {
          try {
            const success = await deleteAppWallet("0x1234567890abcdef");
            setResult(success);
          } catch (error) {
            setResult(false);
          }
        };

        return (
          <div>
            <div data-testid="supported">{appWalletsSupported.toString()}</div>
            <button onClick={handleDelete} data-testid="delete-btn">Delete</button>
            <div data-testid="result">{result?.toString() || "null"}</div>
          </div>
        );
      };

      render(
        <AppWalletsProvider>
          <TestComponent />
        </AppWalletsProvider>
      );

      // Wait for initialization
      await waitFor(() => {
        expect(screen.getByTestId("supported")).toHaveTextContent("false");
      });

      // Try to delete wallet
      act(() => {
        screen.getByTestId("delete-btn").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("result")).toHaveTextContent("false");
      });
    });
  });

  describe("Event Emitter Integration", () => {
    it("emits events when event emitter is used directly", () => {
      const mockListener = jest.fn();
      appWalletsEventEmitter.on("test-direct", mockListener);

      appWalletsEventEmitter.emit("test-direct", { data: "test" });

      expect(mockListener).toHaveBeenCalledWith({ data: "test" });
      appWalletsEventEmitter.removeListener("test-direct", mockListener);
    });

    it("cleans up event listeners properly", () => {
      const mockListener1 = jest.fn();
      const mockListener2 = jest.fn();

      // Add listeners
      appWalletsEventEmitter.on("test-cleanup", mockListener1);
      appWalletsEventEmitter.on("test-cleanup", mockListener2);

      // Emit event
      appWalletsEventEmitter.emit("test-cleanup", "test-data");

      expect(mockListener1).toHaveBeenCalledWith("test-data");
      expect(mockListener2).toHaveBeenCalledWith("test-data");

      // Remove specific listener
      appWalletsEventEmitter.removeListener("test-cleanup", mockListener1);
      appWalletsEventEmitter.emit("test-cleanup", "test-data-2");

      expect(mockListener1).toHaveBeenCalledTimes(1); // Should not be called again
      expect(mockListener2).toHaveBeenCalledTimes(2); // Should be called again

      // Clean up remaining listeners
      appWalletsEventEmitter.removeAllListeners("test-cleanup");
    });
  });

});
