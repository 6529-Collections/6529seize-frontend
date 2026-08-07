import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HeaderUserMenuDropdown from "@/components/header/user/HeaderUserMenuDropdown";
import { AuthContext } from "@/components/auth/Auth";
import WebSidebarUser from "@/components/layout/sidebar/WebSidebarUser";

jest.mock("@/components/header/user/HeaderUserProxyDropdownItem", () => () => (
  <div data-testid="item" />
));
jest.mock(
  "@/components/header/user/connected/HeaderUserConnectedAccounts",
  () => (props: any) => (
    <div data-testid="connected-accounts">
      <button onClick={props.onAddAccount}>Add</button>
      <button
        onClick={() => {
          const nextAccount = props.accounts?.find(
            (account: { isActive: boolean }) => !account.isActive
          );
          if (nextAccount) {
            props.onSelectAccount(nextAccount.address);
          }
        }}
      >
        Switch
      </button>
    </div>
  )
);
jest.mock("@/components/auth/SeizeConnectContext");
jest.mock("@/components/header/useChainSwitcher", () => ({
  useChainSwitcher: jest.fn(),
}));
jest.mock("@/components/header/share/HeaderShare", () => ({
  HeaderConnectModal: ({ show }: { readonly show: boolean }) =>
    show ? (
      <div role="dialog" aria-label="Connect Device modal" />
    ) : null,
}));
jest.mock("@/components/header/user/HeaderUserConnect", () => () => null);
jest.mock("@/components/user/utils/level/UserLevel", () => () => null);
jest.mock("@/components/auth/connection-state-indicator", () => ({
  getConnectionProfileIndicator: () => ({
    avatarClassName: "",
    overlayClassName: "",
    title: "Connected",
  }),
}));
jest.mock("@/components/ipfs/IPFSContext", () => ({
  resolveIpfsUrlSync: (value: string) => value,
}));
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));
jest.mock("@/hooks/isMobileDevice", () => ({
  __esModule: true,
  useIsMobileDeviceStatus: () => ({
    isMobileDevice: false,
    isDeviceDetectionResolved: true,
  }),
}));
jest.mock("@/hooks/useIdentity", () => ({
  useIdentity: () => ({ profile: null, isLoading: false }),
}));
jest.mock("react-use", () => ({ useClickAway: jest.fn() }));

const {
  useSeizeConnectContext: mockConnect,
} = require("@/components/auth/SeizeConnectContext");
const { useChainSwitcher } = require("@/components/header/useChainSwitcher");

const profileBase = {
  handle: "alice",
  wallets: [{ wallet: "0xabc", display: "Alice" }],
} as any;

function renderDropdown(options: any) {
  mockConnect.mockReturnValue({
    address: options.address,
    isAuthenticated: options.isAuthenticated ?? !!options.address,
    isConnected: options.isConnected,
    connectedAccounts: options.connectedAccounts ?? [],
    canAddConnectedAccount: options.canAddConnectedAccount ?? false,
    seizeAddConnectedAccount: options.seizeAddConnectedAccount || jest.fn(),
    seizeConnect: options.seizeConnect || jest.fn(),
    seizeConnectFresh: options.seizeConnectFresh || jest.fn(),
    seizeDisconnect:
      options.seizeDisconnect || jest.fn().mockResolvedValue(undefined),
    seizeDisconnectAndLogout:
      options.seizeDisconnectAndLogout ||
      jest.fn().mockResolvedValue(undefined),
    seizeDisconnectAndLogoutAll:
      options.seizeDisconnectAndLogoutAll ||
      jest.fn().mockResolvedValue(undefined),
    seizeSwitchConnectedAccount:
      options.seizeSwitchConnectedAccount || jest.fn(),
  });
  const authValue = {
    activeProfileProxy: null,
    setActiveProfileProxy: jest.fn(),
    receivedProfileProxies: [{ id: "proxy-1" }],
    requestSessionUpgrade: options.requestSessionUpgrade || jest.fn(),
    sessionUpgradeRequired: options.sessionUpgradeRequired ?? false,
    setToast: jest.fn(),
  } as any;
  (useChainSwitcher as jest.Mock).mockReturnValue({
    chains: options.chains ?? [],
    currentChainName: options.currentChainName ?? "Ethereum",
    nextChainName: options.nextChainName ?? "Polygon",
    switchToNextChain: options.switchToNextChain || jest.fn(() => false),
  });
  const onClose = jest.fn();
  render(
    <AuthContext.Provider value={authValue}>
      <HeaderUserMenuDropdown
        isOpen
        profile={options.profile}
        onClose={onClose}
        onOpenConnect={options.onOpenConnect}
      />
    </AuthContext.Provider>
  );
  return { onClose, ...authValue, ...mockConnect.mock.results[0].value };
}

afterEach(() => jest.clearAllMocks());

describe("HeaderUserMenuDropdown", () => {
  it("shows profile handle as label", () => {
    renderDropdown({
      profile: profileBase,
      address: "0xabc",
      isConnected: true,
    });
    expect(screen.getByText("alice")).toBeInTheDocument();
  });

  it("groups Profile immediately above Logout and closes the menu", () => {
    const { onClose } = renderDropdown({
      profile: profileBase,
      address: "0xabc",
      isConnected: true,
    });

    const profileLink = screen.getByRole("link", { name: "Profile" });
    const logoutButton = screen.getByRole("button", {
      name: "Disconnect & Logout",
    });
    expect(profileLink).toHaveAttribute("href", "/alice");
    expect(profileLink).not.toHaveAttribute("title");
    expect(profileLink).toHaveClass(
      "tw-grid-cols-[1.5rem_minmax(0,1fr)]"
    );
    expect(logoutButton).toHaveClass(
      "tw-grid-cols-[1.5rem_minmax(0,1fr)]"
    );
    expect(profileLink.parentElement).toBe(logoutButton.parentElement);
    expect(
      profileLink.compareDocumentPosition(logoutButton) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    fireEvent.click(profileLink);
    expect(onClose).toHaveBeenCalled();
  });

  it("uses a full-width divider between Connect Wallet and Connect Device", () => {
    const onOpenConnect = jest.fn();
    renderDropdown({
      profile: profileBase,
      address: "0xabc",
      isConnected: false,
      onOpenConnect,
    });

    const connectWalletButton = screen
      .getByText("Connect Wallet")
      .closest("button");
    const connectDeviceButton = screen.getByRole("button", {
      name: "Connect Device",
    });
    expect(connectDeviceButton.querySelector("svg")).toHaveAttribute(
      "viewBox",
      "1 2 20 20"
    );
    expect(connectDeviceButton.querySelector("path")).toHaveAttribute(
      "d",
      "M16.9 8.5V6.5a1.8 1.8 0 0 0-1.8-1.8H4.2a1.8 1.8 0 0 0-1.8 1.8v6.4a1.8 1.8 0 0 0 1.8 1.8h7.1"
    );
    expect(connectDeviceButton).not.toHaveAttribute("title");
    expect(connectWalletButton).toHaveClass(
      "tw-grid-cols-[1.5rem_minmax(0,1fr)]"
    );
    expect(connectDeviceButton).toHaveClass(
      "tw-grid-cols-[1.5rem_minmax(0,1fr)]"
    );
    expect(connectWalletButton?.parentElement).toBe(
      connectDeviceButton.parentElement
    );
    expect(connectWalletButton?.closest("ul")).toHaveClass("tw-divide-y-2");
    const connectionActionsDivider = screen.getByTestId(
      "connection-actions-divider"
    );
    expect(connectionActionsDivider).toHaveClass(
      "-tw-mx-2",
      "tw-border-t",
      "tw-border-iron-700"
    );
    expect(
      connectWalletButton?.compareDocumentPosition(connectionActionsDivider) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      connectionActionsDivider.compareDocumentPosition(connectDeviceButton) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    fireEvent.click(connectDeviceButton);
    expect(onOpenConnect).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Share" })).toBeNull();
  });

  it("opens the connect modal through the desktop account menu", () => {
    mockConnect.mockReturnValue({
      address: "0xabc",
      isAuthenticated: true,
      hasValidWalletAuth: true,
      isConnected: true,
      connectedAccounts: [],
      connectedAccountUnreadNotifications: {},
      canAddConnectedAccount: false,
      seizeConnect: jest.fn(),
      seizeConnectFresh: jest.fn(),
      seizeAddConnectedAccount: jest.fn(),
      seizeDisconnect: jest.fn(),
      seizeDisconnectAndLogout: jest.fn(),
      seizeDisconnectAndLogoutAll: jest.fn(),
      seizeSwitchConnectedAccount: jest.fn(),
    });
    (useChainSwitcher as jest.Mock).mockReturnValue({
      chains: [],
      currentChainName: "Ethereum",
      nextChainName: "Polygon",
      switchToNextChain: jest.fn(),
    });

    render(
      <AuthContext.Provider
        value={
          {
            activeProfileProxy: null,
            setActiveProfileProxy: jest.fn(),
            receivedProfileProxies: [],
            requestSessionUpgrade: jest.fn(),
            sessionUpgradeRequired: false,
            setToast: jest.fn(),
          } as any
        }
      >
        <WebSidebarUser isCollapsed={false} profile={profileBase} />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByRole("button", { name: /account.*menu/i }));
    fireEvent.click(screen.getByRole("button", { name: "Connect Device" }));

    expect(
      screen.getByRole("dialog", { name: "Connect Device modal" })
    ).toBeInTheDocument();
  });

  it("connects wallet when not connected", async () => {
    const seizeConnectFresh = jest.fn().mockResolvedValue(undefined);
    const { onClose } = renderDropdown({
      profile: profileBase,
      address: "0xabc",
      isConnected: false,
      seizeConnectFresh,
    });
    fireEvent.click(screen.getAllByRole("button", { name: /connect/i })[0]);
    await waitFor(() => {
      expect(seizeConnectFresh).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("disconnects wallet when connected", async () => {
    const seizeDisconnect = jest.fn().mockResolvedValue(undefined);
    const { onClose } = renderDropdown({
      profile: profileBase,
      address: "0xabc",
      isConnected: true,
      seizeDisconnect,
    });
    fireEvent.click(screen.getAllByRole("button", { name: /disconnect/i })[0]);
    await waitFor(() => {
      expect(seizeDisconnect).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("starts authentication upgrade when legacy session action is shown", async () => {
    const requestSessionUpgrade = jest.fn().mockResolvedValue({
      success: false,
    });
    const { onClose } = renderDropdown({
      profile: profileBase,
      address: "0xabc",
      isConnected: true,
      requestSessionUpgrade,
      sessionUpgradeRequired: true,
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Upgrade Authentication" })
    );

    await waitFor(() => {
      expect(requestSessionUpgrade).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("keeps manual authentication upgrade available while wallet is disconnected", () => {
    renderDropdown({
      profile: profileBase,
      address: "0xabc",
      isConnected: false,
      sessionUpgradeRequired: true,
    });

    expect(screen.getByRole("button", { name: "Connect" })).toBeInTheDocument();
    expect(screen.getByText("Connect Wallet")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Upgrade Authentication" })
    ).toBeInTheDocument();
  });

  it("shows switch chain control when wallet is connected and multiple chains exist", () => {
    const switchToNextChain = jest.fn(() => true);
    const { onClose } = renderDropdown({
      profile: profileBase,
      address: "0xabc",
      isConnected: true,
      chains: [
        { id: 1, name: "Ethereum" },
        { id: 137, name: "Polygon" },
      ],
      currentChainName: "Ethereum",
      nextChainName: "Polygon",
      switchToNextChain,
    });

    expect(screen.getByText("Network: Ethereum")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Switch Chain" }));

    expect(switchToNextChain).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("falls back to wallet display when no handle", () => {
    const profile = { ...profileBase, handle: null };
    renderDropdown({ profile, address: "0xabc", isConnected: true });
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("shows add account action when at least one connected account is present", async () => {
    const seizeAddConnectedAccount = jest.fn();
    const { onClose } = renderDropdown({
      profile: profileBase,
      address: "0xabc",
      isConnected: true,
      connectedAccounts: [
        { address: "0xabc", role: null, isActive: true, isConnected: true },
      ],
      canAddConnectedAccount: true,
      seizeAddConnectedAccount,
    });

    expect(screen.getByTestId("connected-accounts")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    await waitFor(() => {
      expect(seizeAddConnectedAccount).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("shows an error toast when switching account fails", async () => {
    const seizeSwitchConnectedAccount = jest.fn().mockImplementation(() => {
      throw new Error("Switch failed");
    });

    const { setToast, onClose } = renderDropdown({
      profile: profileBase,
      address: "0xabc",
      isConnected: true,
      connectedAccounts: [
        { address: "0xabc", role: null, isActive: true, isConnected: true },
        { address: "0xdef", role: null, isActive: false, isConnected: true },
      ],
      seizeSwitchConnectedAccount,
    });

    fireEvent.click(screen.getByRole("button", { name: "Switch" }));

    await waitFor(() => {
      expect(seizeSwitchConnectedAccount).toHaveBeenCalledWith("0xdef");
      expect(setToast).toHaveBeenCalledWith(
        expect.objectContaining({ type: "error" })
      );
      expect(onClose).not.toHaveBeenCalled();
    });
  });
});
