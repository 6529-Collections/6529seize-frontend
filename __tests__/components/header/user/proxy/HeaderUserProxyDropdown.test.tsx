import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import HeaderUserProxyDropdown from "@/components/header/user/proxy/HeaderUserProxyDropdown";
import { AuthContext } from "@/components/auth/Auth";

jest.mock(
  "@/components/header/user/proxy/HeaderUserProxyDropdownItem",
  () => () => <div data-testid="item" />
);
jest.mock(
  "@/components/header/user/connected/HeaderUserConnectedAccounts",
  () => (props: any) => (
    <div data-testid="connected-accounts">
      <button onClick={props.onAddAccount}>Add</button>
    </div>
  )
);
jest.mock("@/components/auth/SeizeConnectContext");

const {
  useSeizeConnectContext: mockConnect,
} = require("@/components/auth/SeizeConnectContext");

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
    seizeDisconnect:
      options.seizeDisconnect || jest.fn().mockResolvedValue(undefined),
    seizeDisconnectAndLogout: jest.fn().mockResolvedValue(undefined),
    seizeSwitchConnectedAccount:
      options.seizeSwitchConnectedAccount || jest.fn(),
  });
  const authValue = {
    activeProfileProxy: null,
    setActiveProfileProxy: jest.fn(),
    receivedProfileProxies: [{ id: "proxy-1" }],
  } as any;
  const onClose = jest.fn();
  render(
    <AuthContext.Provider value={authValue}>
      <HeaderUserProxyDropdown
        isOpen
        profile={options.profile}
        onClose={onClose}
      />
    </AuthContext.Provider>
  );
  return { onClose, ...authValue, ...mockConnect.mock.results[0].value };
}

afterEach(() => jest.clearAllMocks());

describe("HeaderUserProxyDropdown", () => {
  it("shows profile handle as label", () => {
    renderDropdown({
      profile: profileBase,
      address: "0xabc",
      isConnected: true,
    });
    expect(screen.getByText("alice")).toBeInTheDocument();
  });

  it("connects wallet when not connected", () => {
    const seizeConnect = jest.fn();
    const { onClose } = renderDropdown({
      profile: profileBase,
      address: "0xabc",
      isConnected: false,
      seizeConnect,
    });
    fireEvent.click(screen.getAllByRole("button", { name: /connect/i })[0]);
    expect(seizeConnect).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
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
    expect(seizeDisconnect).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("falls back to wallet display when no handle", () => {
    const profile = { ...profileBase, handle: null };
    renderDropdown({ profile, address: "0xabc", isConnected: true });
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("shows add account action when at least one connected account is present", () => {
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
    expect(seizeAddConnectedAccount).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
