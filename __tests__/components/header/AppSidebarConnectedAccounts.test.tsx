import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppSidebarConnectedAccounts from "@/components/header/AppSidebarConnectedAccounts";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import type { AuthContextType } from "@/components/auth/authTypes";
import type { SeizeConnectContextType } from "@/components/auth/seizeConnectTypes";
import { ProfileConnectedStatus } from "@/entities/IProfile";
import { useIdentity } from "@/hooks/useIdentity";

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));

jest.mock("@/hooks/useIdentity", () => ({
  useIdentity: jest.fn(),
}));

const useAuthMock = jest.mocked(useAuth);
const useSeizeConnectContextMock = jest.mocked(useSeizeConnectContext);
const useIdentityMock = jest.mocked(useIdentity);
const switchAccount = jest.fn();
const addAccount = jest.fn();
const setToast = jest.fn();

function setUpContext({ connectOpen = false }: { connectOpen?: boolean } = {}) {
  const context: SeizeConnectContextType = {
    address: "0x1111111111111111111111111111111111111111",
    walletName: undefined,
    walletIcon: undefined,
    isSafeWallet: false,
    seizeConnect: jest.fn(),
    seizeConnectFresh: jest.fn().mockResolvedValue(undefined),
    seizeDisconnect: jest.fn().mockResolvedValue(undefined),
    seizeDisconnectAndLogout: jest.fn().mockResolvedValue(undefined),
    seizeDisconnectAndLogoutAll: jest.fn().mockResolvedValue(undefined),
    seizeAcceptConnection: jest.fn(),
    seizeConnectOpen: connectOpen,
    isConnected: true,
    canSignActiveWallet: true,
    hasActiveWalletAddress: true,
    hasValidWalletAuth: true,
    isAuthenticated: true,
    connectionState: "connected",
    walletState: {
      status: "connected",
      address: "0x1111111111111111111111111111111111111111",
    },
    hasInitializationError: false,
    initializationError: undefined,
    connectedAccounts: [
      {
        address: "0x1111111111111111111111111111111111111111",
        role: null,
        profileId: "profile-1",
        profileHandle: "first",
        isActive: true,
        isConnected: true,
      },
      {
        address: "0x2222222222222222222222222222222222222222",
        role: null,
        profileId: "profile-2",
        profileHandle: "second",
        isActive: false,
        isConnected: true,
      },
    ],
    connectedAccountUnreadNotifications: {},
    canAddConnectedAccount: true,
    seizeAddConnectedAccount: addAccount,
    seizeSwitchConnectedAccount: switchAccount,
  };
  useSeizeConnectContextMock.mockReturnValue(context);
}

describe("AppSidebarConnectedAccounts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setUpContext();
    const authContext: AuthContextType = {
      connectedProfile: null,
      isAuthenticated: true,
      fetchingProfile: false,
      connectionStatus: ProfileConnectedStatus.HAVE_PROFILE,
      receivedProfileProxies: [],
      activeProfileProxy: null,
      showWaves: true,
      sessionUpgradeRequired: false,
      requestAuth: jest.fn().mockResolvedValue({ success: true }),
      requestSessionUpgrade: jest.fn().mockResolvedValue({ success: true }),
      setToast,
      setActiveProfileProxy: jest.fn().mockResolvedValue(undefined),
    };
    useAuthMock.mockReturnValue(authContext);
    useIdentityMock.mockReturnValue({
      profile: { handle: "second" },
      isLoading: false,
    } as unknown as ReturnType<typeof useIdentity>);
  });

  it("switches profiles and closes the sidebar", async () => {
    const onNavigate = jest.fn();

    render(<AppSidebarConnectedAccounts onNavigate={onNavigate} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Switch to second" })
    );

    expect(switchAccount).toHaveBeenCalledWith(
      "0x2222222222222222222222222222222222222222"
    );
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("starts the add-profile flow and closes the sidebar", async () => {
    const onNavigate = jest.fn();

    render(<AppSidebarConnectedAccounts onNavigate={onNavigate} />);
    await userEvent.click(screen.getByRole("button", { name: "Add profile" }));

    expect(addAccount).toHaveBeenCalledTimes(1);
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  it("disables add-profile while the connection flow is open", () => {
    setUpContext({ connectOpen: true });

    render(<AppSidebarConnectedAccounts />);

    expect(
      screen.getByRole("button", { name: "Opening account connection" })
    ).toBeDisabled();
  });

  it("keeps the sidebar open and reports a failed add-profile flow", async () => {
    const onNavigate = jest.fn();
    addAccount.mockImplementation(() => {
      throw new Error("connect failed");
    });

    render(<AppSidebarConnectedAccounts onNavigate={onNavigate} />);
    await userEvent.click(screen.getByRole("button", { name: "Add profile" }));

    expect(onNavigate).not.toHaveBeenCalled();
    expect(setToast).toHaveBeenCalledWith({
      message: "Failed to open the account connection. Please try again.",
      type: "error",
    });
  });

  it("keeps the sidebar open and reports a failed switch", async () => {
    const onNavigate = jest.fn();
    switchAccount.mockImplementation(() => {
      throw new Error("switch failed");
    });

    render(<AppSidebarConnectedAccounts onNavigate={onNavigate} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Switch to second" })
    );

    expect(onNavigate).not.toHaveBeenCalled();
    expect(setToast).toHaveBeenCalledWith({
      message: "Failed to switch connected account. Please try again.",
      type: "error",
    });
  });
});
