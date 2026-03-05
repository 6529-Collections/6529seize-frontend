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

const buildStoredAccount = (address: string) => ({
  address,
  role: null,
  profileId: null,
  profileHandle: null,
});

describe("SeizeConnectContext switch sync guard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
