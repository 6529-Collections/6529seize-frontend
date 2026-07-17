import NotificationsPage from "@/components/notifications/NotificationsPage";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { render, screen } from "@testing-library/react";

jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: jest.fn(),
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
  default: () => <div>Connect wallet gate</div>,
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

describe("NotificationsPage", () => {
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
});
