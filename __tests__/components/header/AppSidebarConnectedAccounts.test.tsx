import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AppSidebarConnectedAccounts from "@/components/header/AppSidebarConnectedAccounts";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
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
  useSeizeConnectContextMock.mockReturnValue({
    connectedAccounts: [
      {
        address: "0x1111111111111111111111111111111111111111",
        isActive: true,
        isConnected: true,
      },
      {
        address: "0x2222222222222222222222222222222222222222",
        isActive: false,
        isConnected: true,
      },
    ],
    connectedAccountUnreadNotifications: {},
    canAddConnectedAccount: true,
    seizeAddConnectedAccount: addAccount,
    seizeSwitchConnectedAccount: switchAccount,
    seizeConnectOpen: connectOpen,
  } as ReturnType<typeof useSeizeConnectContext>);
}

describe("AppSidebarConnectedAccounts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setUpContext();
    useAuthMock.mockReturnValue({ setToast } as ReturnType<typeof useAuth>);
    useIdentityMock.mockReturnValue({
      profile: { handle: "second" },
      isLoading: false,
    } as ReturnType<typeof useIdentity>);
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
