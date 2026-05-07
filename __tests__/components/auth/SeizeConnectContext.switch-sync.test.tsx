import {
  SeizeConnectProvider,
  useSeizeConnectContext,
} from "@/components/auth/SeizeConnectContext";
import * as authUtils from "@/services/auth/auth.utils";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

jest.mock("@reown/appkit/react", () => ({
  useAppKit: jest.fn(() => ({
    open: jest.fn(),
  })),
  useAppKitAccount: jest.fn(() => ({
    address: undefined,
    isConnected: false,
    status: "disconnected",
  })),
  useAppKitState: jest.fn(() => ({
    open: false,
  })),
  useDisconnect: jest.fn(() => ({
    disconnect: jest.fn(),
  })),
  useWalletInfo: jest.fn(() => ({
    walletInfo: null,
  })),
}));

jest.mock("viem", () => ({
  isAddress: jest.fn((address: string) => /^0x[a-fA-F0-9]{40}$/.test(address)),
  getAddress: jest.fn((address: string) => address.toLowerCase()),
}));

jest.mock("@/hooks/useConnectedAccountsUnreadNotifications", () => ({
  useConnectedAccountsUnreadNotifications: jest.fn(() => ({})),
}));

jest.mock("@/hooks/useUnreadNotifications", () => ({
  useUnreadNotifications: jest.fn(() => ({
    notifications: { unread_count: 0 },
    haveUnreadNotifications: false,
  })),
}));

jest.mock("@/services/auth/auth.utils", () => ({
  canStoreAnotherWalletAccount: jest.fn(() => true),
  getConnectedWalletAccounts: jest.fn(() => []),
  getWalletAddress: jest.fn(() => null),
  setActiveWalletAccount: jest.fn(() => true),
  removeAuthJwt: jest.fn(),
  WALLET_ACCOUNTS_UPDATED_EVENT: "6529-wallet-accounts-updated",
  PROFILE_SWITCHED_EVENT: "6529-profile-switched",
}));

const addressA = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const addressB = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const unknownAddress = "0xcccccccccccccccccccccccccccccccccccccccc";

const AddressProbe: React.FC = () => {
  const { address } = useSeizeConnectContext();
  return <div data-testid="active-address">{address ?? "undefined"}</div>;
};

const UnreadProbe: React.FC = () => {
  const { connectedAccountUnreadNotifications } = useSeizeConnectContext();
  return (
    <div data-testid="unread-map">
      {JSON.stringify(connectedAccountUnreadNotifications)}
    </div>
  );
};

const buildStoredAccount = (
  address: string,
  profileHandle: string | null = null,
  jwt: string | null = null
): authUtils.ConnectedWalletAccount => ({
  address,
  refreshToken: "dummy-refresh-token",
  role: null,
  jwt,
  profileId: null,
  profileHandle,
});

describe("SeizeConnectContext switch sync guard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    require("@/hooks/useConnectedAccountsUnreadNotifications").useConnectedAccountsUnreadNotifications.mockReturnValue(
      {}
    );
    require("@/hooks/useUnreadNotifications").useUnreadNotifications.mockReturnValue(
      {
        notifications: { unread_count: 0 },
        haveUnreadNotifications: false,
      }
    );
  });

  it("prefers stored active account while provider still reports previous known account", async () => {
    const { useAppKitAccount } = require("@reown/appkit/react");
    const mockGetWalletAddress =
      authUtils.getWalletAddress as jest.MockedFunction<
        typeof authUtils.getWalletAddress
      >;
    const mockGetConnectedWalletAccounts =
      authUtils.getConnectedWalletAccounts as jest.MockedFunction<
        typeof authUtils.getConnectedWalletAccounts
      >;

    const accountState = {
      address: addressA,
      isConnected: true,
      status: "connected",
    };
    let activeStoredAddress = addressB;

    (useAppKitAccount as jest.Mock).mockImplementation(() => accountState);
    mockGetWalletAddress.mockImplementation(() => activeStoredAddress);
    mockGetConnectedWalletAccounts.mockReturnValue([
      buildStoredAccount(addressA),
      buildStoredAccount(addressB),
    ]);

    const { rerender } = render(
      <SeizeConnectProvider>
        <AddressProbe />
      </SeizeConnectProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("active-address")).toHaveTextContent(addressB);
    });

    activeStoredAddress = addressA;
    accountState.address = addressB;

    rerender(
      <SeizeConnectProvider>
        <AddressProbe />
      </SeizeConnectProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("active-address")).toHaveTextContent(addressA);
    });
  });

  it("keeps unknown-wallet connect flow preferring live provider address", async () => {
    const { useAppKitAccount } = require("@reown/appkit/react");
    const mockGetWalletAddress =
      authUtils.getWalletAddress as jest.MockedFunction<
        typeof authUtils.getWalletAddress
      >;
    const mockGetConnectedWalletAccounts =
      authUtils.getConnectedWalletAccounts as jest.MockedFunction<
        typeof authUtils.getConnectedWalletAccounts
      >;

    (useAppKitAccount as jest.Mock).mockReturnValue({
      address: unknownAddress,
      isConnected: true,
      status: "connected",
    });
    mockGetWalletAddress.mockReturnValue(addressA);
    mockGetConnectedWalletAccounts.mockReturnValue([
      buildStoredAccount(addressA),
      buildStoredAccount(addressB),
    ]);

    render(
      <SeizeConnectProvider>
        <AddressProbe />
      </SeizeConnectProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("active-address")).toHaveTextContent(
        unknownAddress
      );
    });
  });

  it("preserves normal single-account behavior", async () => {
    const { useAppKitAccount } = require("@reown/appkit/react");
    const mockGetWalletAddress =
      authUtils.getWalletAddress as jest.MockedFunction<
        typeof authUtils.getWalletAddress
      >;
    const mockGetConnectedWalletAccounts =
      authUtils.getConnectedWalletAccounts as jest.MockedFunction<
        typeof authUtils.getConnectedWalletAccounts
      >;

    (useAppKitAccount as jest.Mock).mockReturnValue({
      address: addressA,
      isConnected: true,
      status: "connected",
    });
    mockGetWalletAddress.mockReturnValue(addressA);
    mockGetConnectedWalletAccounts.mockReturnValue([
      buildStoredAccount(addressA),
    ]);

    render(
      <SeizeConnectProvider>
        <AddressProbe />
      </SeizeConnectProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("active-address")).toHaveTextContent(addressA);
    });
  });

  it("polls inactive accounts only and merges the active unread count", async () => {
    const { useAppKitAccount } = require("@reown/appkit/react");
    const mockGetWalletAddress =
      authUtils.getWalletAddress as jest.MockedFunction<
        typeof authUtils.getWalletAddress
      >;
    const mockGetConnectedWalletAccounts =
      authUtils.getConnectedWalletAccounts as jest.MockedFunction<
        typeof authUtils.getConnectedWalletAccounts
      >;
    const mockUseConnectedAccountsUnreadNotifications =
      require("@/hooks/useConnectedAccountsUnreadNotifications")
        .useConnectedAccountsUnreadNotifications as jest.Mock;
    const mockUseUnreadNotifications = require("@/hooks/useUnreadNotifications")
      .useUnreadNotifications as jest.Mock;

    const activeAccount = buildStoredAccount(addressA, "alice");
    const inactiveAccount = buildStoredAccount(addressB, "bob");

    (useAppKitAccount as jest.Mock).mockReturnValue({
      address: addressA,
      isConnected: true,
      status: "connected",
    });
    mockGetWalletAddress.mockReturnValue(addressA);
    mockGetConnectedWalletAccounts.mockReturnValue([
      activeAccount,
      inactiveAccount,
    ]);
    mockUseConnectedAccountsUnreadNotifications.mockReturnValue({
      [addressB]: 4,
    });
    mockUseUnreadNotifications.mockReturnValue({
      notifications: { unread_count: 7 },
      haveUnreadNotifications: true,
    });

    render(
      <SeizeConnectProvider>
        <UnreadProbe />
      </SeizeConnectProvider>
    );

    await waitFor(() => {
      expect(mockUseConnectedAccountsUnreadNotifications).toHaveBeenCalledWith([
        inactiveAccount,
      ]);
      expect(mockUseUnreadNotifications).toHaveBeenCalledWith("alice");
    });

    const unreadMap = JSON.parse(
      screen.getByTestId("unread-map").textContent ?? "{}"
    );

    expect(unreadMap).toEqual({
      [addressA]: 7,
      [addressB]: 4,
    });
  });

  it("keeps the active JWT unread count when the active account has no profile handle", async () => {
    const { useAppKitAccount } = require("@reown/appkit/react");
    const mockGetWalletAddress =
      authUtils.getWalletAddress as jest.MockedFunction<
        typeof authUtils.getWalletAddress
      >;
    const mockGetConnectedWalletAccounts =
      authUtils.getConnectedWalletAccounts as jest.MockedFunction<
        typeof authUtils.getConnectedWalletAccounts
      >;
    const mockUseConnectedAccountsUnreadNotifications =
      require("@/hooks/useConnectedAccountsUnreadNotifications")
        .useConnectedAccountsUnreadNotifications as jest.Mock;
    const mockUseUnreadNotifications = require("@/hooks/useUnreadNotifications")
      .useUnreadNotifications as jest.Mock;

    const activeAccount = buildStoredAccount(addressA, null, "active-jwt");
    const inactiveAccount = buildStoredAccount(addressB, "bob", "inactive-jwt");

    (useAppKitAccount as jest.Mock).mockReturnValue({
      address: addressA,
      isConnected: true,
      status: "connected",
    });
    mockGetWalletAddress.mockReturnValue(addressA);
    mockGetConnectedWalletAccounts.mockReturnValue([
      activeAccount,
      inactiveAccount,
    ]);
    mockUseConnectedAccountsUnreadNotifications.mockReturnValue({
      [addressA]: 9,
      [addressB]: 4,
    });
    mockUseUnreadNotifications.mockReturnValue({
      notifications: { unread_count: 0 },
      haveUnreadNotifications: false,
    });

    render(
      <SeizeConnectProvider>
        <UnreadProbe />
      </SeizeConnectProvider>
    );

    await waitFor(() => {
      expect(mockUseConnectedAccountsUnreadNotifications).toHaveBeenCalledWith([
        activeAccount,
        inactiveAccount,
      ]);
      expect(mockUseUnreadNotifications).toHaveBeenCalledWith(null);
    });

    const unreadMap = JSON.parse(
      screen.getByTestId("unread-map").textContent ?? "{}"
    );

    expect(unreadMap).toEqual({
      [addressA]: 9,
      [addressB]: 4,
    });
  });
});
