import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AppUserConnect from "@/components/header/AppUserConnect";
import React from "react";

jest.mock("@/components/header/share/HeaderQRScanner", () => () => (
  <div data-testid="scanner" />
));

jest.mock("@/components/header/PushNotificationSettings", () => () => (
  <div data-testid="push-settings" />
));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));
jest.mock("@/components/header/useChainSwitcher", () => ({
  useChainSwitcher: jest.fn(),
}));

const {
  useSeizeConnectContext,
} = require("@/components/auth/SeizeConnectContext");
const { useChainSwitcher } = require("@/components/header/useChainSwitcher");

function setup(address: string | undefined, isConnected: boolean) {
  const seizeConnect = jest.fn();
  const seizeDisconnect = jest.fn().mockResolvedValue(undefined);
  const seizeDisconnectAndLogout = jest.fn();
  const seizeDisconnectAndLogoutAll = jest.fn().mockResolvedValue(undefined);
  (useSeizeConnectContext as jest.Mock).mockReturnValue({
    address,
    isConnected,
    connectedAccounts: address
      ? [{ address, role: null, isActive: true, isConnected }]
      : [],
    seizeConnect,
    seizeDisconnect,
    seizeDisconnectAndLogout,
    seizeDisconnectAndLogoutAll,
  });
  (useChainSwitcher as jest.Mock).mockReturnValue({
    chains: [],
    currentChainName: "Ethereum",
    nextChainName: "Polygon",
    switchToNextChain: jest.fn(),
  });
  const onNavigate = jest.fn();
  render(<AppUserConnect onNavigate={onNavigate} />);
  return {
    seizeConnect,
    seizeDisconnect,
    seizeDisconnectAndLogout,
    seizeDisconnectAndLogoutAll,
    onNavigate,
  };
}

function setupWithAccounts(options: {
  readonly address: string;
  readonly isConnected: boolean;
  readonly connectedAccounts: readonly {
    readonly address: string;
    readonly role: string | null;
    readonly isActive: boolean;
    readonly isConnected: boolean;
  }[];
}) {
  const seizeConnect = jest.fn();
  const seizeDisconnect = jest.fn().mockResolvedValue(undefined);
  const seizeDisconnectAndLogout = jest.fn();
  const seizeDisconnectAndLogoutAll = jest.fn().mockResolvedValue(undefined);
  (useSeizeConnectContext as jest.Mock).mockReturnValue({
    address: options.address,
    isConnected: options.isConnected,
    connectedAccounts: options.connectedAccounts,
    seizeConnect,
    seizeDisconnect,
    seizeDisconnectAndLogout,
    seizeDisconnectAndLogoutAll,
  });
  (useChainSwitcher as jest.Mock).mockReturnValue({
    chains: [],
    currentChainName: "Ethereum",
    nextChainName: "Polygon",
    switchToNextChain: jest.fn(),
  });
  const onNavigate = jest.fn();
  render(<AppUserConnect onNavigate={onNavigate} />);
  return {
    seizeDisconnectAndLogoutAll,
    onNavigate,
  };
}

describe("AppUserConnect", () => {
  afterEach(() => jest.clearAllMocks());

  it("renders connect button when not connected", () => {
    const { seizeConnect, onNavigate } = setup(undefined, false);
    const btn = screen.getByRole("button", { name: "Connect" });
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(seizeConnect).toHaveBeenCalled();
    expect(onNavigate).toHaveBeenCalled();
    expect(screen.getByTestId("scanner")).toBeInTheDocument();
  });

  it("renders disconnect options when wallet is connected", async () => {
    const { seizeDisconnect, seizeDisconnectAndLogout, onNavigate } = setup(
      "0xabc",
      true
    );
    const disconnectWalletBtn = screen.getByRole("button", {
      name: "Disconnect Wallet",
    });
    const disconnectBtn = screen.getByRole("button", {
      name: "Disconnect & Logout",
    });

    fireEvent.click(disconnectWalletBtn);
    expect(seizeDisconnect).toHaveBeenCalled();
    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalled();
    });

    fireEvent.click(disconnectBtn);
    await waitFor(() => {
      expect(seizeDisconnectAndLogout).toHaveBeenCalledWith();
      expect(onNavigate).toHaveBeenCalledTimes(2);
    });
  });

  it("renders connect wallet + logout when authorized-only", async () => {
    const { seizeConnect, seizeDisconnectAndLogout, onNavigate } = setup(
      "0xabc",
      false
    );
    const connectWalletBtn = screen.getByRole("button", {
      name: "Connect Wallet",
    });
    const logoutBtn = screen
      .getByText("Logout")
      .closest("button") as HTMLButtonElement;

    fireEvent.click(connectWalletBtn);
    expect(seizeConnect).toHaveBeenCalled();
    expect(onNavigate).toHaveBeenCalled();

    fireEvent.click(logoutBtn);
    await waitFor(() => {
      expect(seizeDisconnectAndLogout).toHaveBeenCalledWith();
      expect(onNavigate).toHaveBeenCalledTimes(2);
    });
  });

  it("shows chain switch controls when multiple chains are available", () => {
    const switchToNextChain = jest.fn(() => true);
    (useSeizeConnectContext as jest.Mock).mockReturnValue({
      address: "0xabc",
      isConnected: true,
      connectedAccounts: [
        { address: "0xabc", role: null, isActive: true, isConnected: true },
      ],
      seizeConnect: jest.fn(),
      seizeDisconnect: jest.fn().mockResolvedValue(undefined),
      seizeDisconnectAndLogout: jest.fn(),
      seizeDisconnectAndLogoutAll: jest.fn().mockResolvedValue(undefined),
    });
    (useChainSwitcher as jest.Mock).mockReturnValue({
      chains: [{ id: 1, name: "Ethereum" }, { id: 137, name: "Polygon" }],
      currentChainName: "Ethereum",
      nextChainName: "Polygon",
      switchToNextChain,
    });

    const onNavigate = jest.fn();
    render(<AppUserConnect onNavigate={onNavigate} />);

    expect(screen.getByText("Network: Ethereum")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Switch Chain" }));

    expect(switchToNextChain).toHaveBeenCalled();
    expect(onNavigate).toHaveBeenCalled();
  });

  it("shows sign out all profiles only when multiple profiles exist", () => {
    setupWithAccounts({
      address: "0xabc",
      isConnected: true,
      connectedAccounts: [
        { address: "0xabc", role: null, isActive: true, isConnected: true },
      ],
    });
    expect(
      screen.queryByRole("button", { name: "Sign Out All Profiles" })
    ).not.toBeInTheDocument();
  });

  it("runs sign out all profiles action", async () => {
    const { seizeDisconnectAndLogoutAll, onNavigate } = setupWithAccounts({
      address: "0xabc",
      isConnected: true,
      connectedAccounts: [
        { address: "0xabc", role: null, isActive: true, isConnected: true },
        { address: "0xdef", role: null, isActive: false, isConnected: false },
      ],
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Sign Out All Profiles" })
    );

    await waitFor(() => {
      expect(seizeDisconnectAndLogoutAll).toHaveBeenCalledWith();
      expect(onNavigate).toHaveBeenCalled();
    });
  });
});
