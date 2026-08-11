import NotificationsPage from "@/components/notifications/NotificationsPage";
import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { render, screen } from "@testing-library/react";

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/components/brain/notifications", () => ({
  __esModule: true,
  default: () => <div>Notifications feed</div>,
}));

jest.mock("@/components/brain/content/BrainContent", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock("@/components/common/ConnectWallet", () => ({
  __esModule: true,
  default: ({
    title = "Connect wallet gate",
    description,
    action,
  }: {
    title?: string;
    description?: string;
    action?: React.ReactNode;
  }) => (
    <div>
      <div>{title}</div>
      {description ? <div>{description}</div> : null}
      {action}
    </div>
  ),
}));

jest.mock("@/components/user/utils/set-up-profile/UserSetUpProfileCta", () => ({
  __esModule: true,
  default: () => <button type="button">Create profile</button>,
}));

jest.mock("@/hooks/useDropModal", () => ({
  useDropModal: () => ({
    activeDrop: null,
    isDropOpen: false,
    onDropClose: jest.fn(),
  }),
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));

jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({
    spaces: { headerSpace: 0 },
    notificationsViewStyle: {
      height: "640px",
      maxHeight: "640px",
    },
  }),
}));

const useSeizeConnectContextMock = jest.mocked(useSeizeConnectContext);
const useAuthMock = jest.mocked(useAuth);

describe("NotificationsPage", () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({
      connectedProfile: { handle: "alice" },
      fetchingProfile: false,
    } as ReturnType<typeof useAuth>);
  });

  it.each(["initializing", "connecting"] as const)(
    "shows a neutral loader while wallet auth is %s",
    (connectionState) => {
      useSeizeConnectContextMock.mockReturnValue({
        connectionState,
        hasValidWalletAuth: false,
      } as ReturnType<typeof useSeizeConnectContext>);

      render(<NotificationsPage />);

      const loadingStatus = screen.getByRole("status", {
        name: "Loading notifications",
      });
      expect(loadingStatus).toBeInTheDocument();
      expect(loadingStatus.parentElement).toHaveAttribute(
        "style",
        "height: 640px; max-height: 640px;"
      );
      expect(screen.queryByText("Connect wallet gate")).not.toBeInTheDocument();
    }
  );

  it("shows the wallet gate after initialization confirms no valid auth", () => {
    useSeizeConnectContextMock.mockReturnValue({
      connectionState: "disconnected",
      hasValidWalletAuth: false,
    } as ReturnType<typeof useSeizeConnectContext>);

    render(<NotificationsPage />);

    expect(screen.getByText("Connect wallet gate")).toBeInTheDocument();
  });

  it("shows notifications after authenticated wallet restoration", () => {
    useSeizeConnectContextMock.mockReturnValue({
      connectionState: "connected",
      hasValidWalletAuth: true,
    } as ReturnType<typeof useSeizeConnectContext>);

    render(<NotificationsPage />);

    expect(screen.getByText("Notifications feed")).toBeInTheDocument();
  });

  it("shows the create-profile gate when the wallet has no profile", () => {
    useSeizeConnectContextMock.mockReturnValue({
      connectionState: "connected",
      hasValidWalletAuth: true,
    } as ReturnType<typeof useSeizeConnectContext>);
    useAuthMock.mockReturnValue({
      connectedProfile: null,
      fetchingProfile: false,
    } as ReturnType<typeof useAuth>);

    render(<NotificationsPage />);

    expect(
      screen.getByText("You need to set up a profile to continue.")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Create a profile to access notifications.")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create profile" })
    ).toBeInTheDocument();
    expect(screen.queryByText("Notifications feed")).not.toBeInTheDocument();
  });
});
