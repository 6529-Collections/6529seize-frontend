import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import {
  SeizeConnectProvider,
  useSeizeConnectContext,
} from "@/components/auth/SeizeConnectContext";
import { APP_WALLET_CONNECTOR_TYPE } from "@/wagmiConfig/wagmiAppWalletConnector";

const ACTIVE_ADDRESS = "0x00000000000000000000000000000000000000AA";

const mockOpen = jest.fn();
const mockDisconnect = jest.fn();
const mockLogError = jest.fn();
const mockLogSecurityEvent = jest.fn();

let mockAppKitAccount: {
  address?: string;
  isConnected: boolean;
  status: "connected" | "connecting" | "reconnecting" | "disconnected";
};

let mockWagmiAccount: {
  connector?: {
    type?: string;
  };
};

let mockAppKitState: { open: boolean };

jest.mock("@reown/appkit/react", () => ({
  useAppKit: () => ({
    open: mockOpen,
  }),
  useAppKitAccount: () => mockAppKitAccount,
  useAppKitState: () => mockAppKitState,
  useDisconnect: () => ({
    disconnect: mockDisconnect,
  }),
  useWalletInfo: () => ({
    walletInfo: undefined,
  }),
}));

jest.mock("wagmi", () => ({
  useAccount: () => mockWagmiAccount,
}));

jest.mock("@/config/env", () => ({
  getNodeEnv: () => "test",
  publicEnv: {
    USE_DEV_AUTH: "false",
    DEV_MODE_WALLET_ADDRESS: undefined,
  },
}));

jest.mock("@/hooks/useConnectedAccountsUnreadNotifications", () => ({
  useConnectedAccountsUnreadNotifications: () => ({}),
}));

jest.mock("@/services/auth/auth.utils", () => ({
  WALLET_ACCOUNTS_UPDATED_EVENT: "6529-wallet-accounts-updated",
  canStoreAnotherWalletAccount: jest.fn(() => true),
  getConnectedWalletAccounts: jest.fn(() => [
    {
      address: ACTIVE_ADDRESS,
      refreshToken: "refresh-token",
      role: null,
      jwt: null,
      profileId: null,
      profileHandle: null,
    },
  ]),
  getWalletAddress: jest.fn(() => ACTIVE_ADDRESS),
  removeAuthJwt: jest.fn(),
  setActiveWalletAccount: jest.fn(() => true),
}));

jest.mock("@/src/utils/security-logger", () => ({
  createConnectionEventContext: jest.fn(() => ({})),
  createValidationEventContext: jest.fn(() => ({})),
  logError: (...args: unknown[]) => mockLogError(...args),
  logSecurityEvent: (...args: unknown[]) => mockLogSecurityEvent(...args),
}));

jest.mock("@/utils/wallet-detection", () => ({
  isSafeWalletInfo: () => false,
}));

jest.mock("@/components/auth/error-boundary", () => ({
  WalletErrorBoundary: ({
    children,
  }: {
    readonly children: React.ReactNode;
  }) => <>{children}</>,
}));

function AddAccountButton() {
  const { seizeAddConnectedAccount } = useSeizeConnectContext();

  return <button onClick={seizeAddConnectedAccount}>Add account</button>;
}

describe("SeizeConnectProvider add-account flow", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();

    mockAppKitAccount = {
      address: ACTIVE_ADDRESS,
      isConnected: true,
      status: "connected",
    };
    mockWagmiAccount = {
      connector: {
        type: "injected",
      },
    };
    mockAppKitState = { open: false };
    mockDisconnect.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("opens the connect flow directly for app-wallet connectors and keeps add-account mode active", () => {
    mockWagmiAccount = {
      connector: {
        type: APP_WALLET_CONNECTOR_TYPE,
      },
    };
    mockAppKitState = { open: true };

    render(
      <SeizeConnectProvider>
        <AddAccountButton />
      </SeizeConnectProvider>
    );

    const addButton = screen.getByRole("button", { name: "Add account" });

    act(() => {
      fireEvent.click(addButton);
    });

    expect(mockDisconnect).not.toHaveBeenCalled();
    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockOpen).toHaveBeenLastCalledWith({ view: "Connect" });

    act(() => {
      fireEvent.click(addButton);
    });

    expect(mockDisconnect).not.toHaveBeenCalled();
    expect(mockOpen).toHaveBeenCalledTimes(1);
  });

  it("clears a stale add-flow guard before reopening connect for app-wallet connectors", () => {
    mockDisconnect.mockImplementation(() => new Promise(() => undefined));

    const { rerender } = render(
      <SeizeConnectProvider>
        <AddAccountButton />
      </SeizeConnectProvider>
    );

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Add account" }));
    });

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(mockOpen).not.toHaveBeenCalled();

    mockWagmiAccount = {
      connector: {
        type: APP_WALLET_CONNECTOR_TYPE,
      },
    };
    mockAppKitAccount = {
      address: undefined,
      isConnected: false,
      status: "disconnected",
    };
    mockAppKitState = { open: false };

    rerender(
      <SeizeConnectProvider>
        <AddAccountButton />
      </SeizeConnectProvider>
    );

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Add account" }));
    });

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockOpen).toHaveBeenLastCalledWith({ view: "Connect" });
  });

  it("keeps the disconnect-then-connect flow for browser-wallet connectors", async () => {
    render(
      <SeizeConnectProvider>
        <AddAccountButton />
      </SeizeConnectProvider>
    );

    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "Add account" }));
    });

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
    expect(mockOpen).not.toHaveBeenCalled();

    await act(async () => {
      await Promise.resolve();
    });

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(mockOpen).toHaveBeenCalledTimes(1);
    expect(mockOpen).toHaveBeenLastCalledWith({ view: "Connect" });
  });

  it("opens connect directly when there is no live connected wallet and keeps add-account mode active", () => {
    mockAppKitAccount = {
      address: undefined,
      isConnected: false,
      status: "disconnected",
    };
    mockAppKitState = { open: true };

    render(
      <SeizeConnectProvider>
        <AddAccountButton />
      </SeizeConnectProvider>
    );

    const addButton = screen.getByRole("button", { name: "Add account" });

    act(() => {
      fireEvent.click(addButton);
    });

    act(() => {
      fireEvent.click(addButton);
    });

    expect(mockDisconnect).not.toHaveBeenCalled();
    expect(mockOpen).toHaveBeenCalledTimes(1);
  });
});
