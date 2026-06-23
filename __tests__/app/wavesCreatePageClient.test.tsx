import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";

const mockUseAuth = jest.fn();
const mockUseAuthenticatedContent = jest.fn();
const mockUseDeviceInfo = jest.fn();
const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("@/hooks/useAuthenticatedContent", () => ({
  useAuthenticatedContent: () => mockUseAuthenticatedContent(),
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => mockUseDeviceInfo(),
}));

jest.mock("@/components/common/ConnectWallet", () => ({
  __esModule: true,
  default: () => <div data-testid="connect-wallet">Connect Wallet</div>,
}));

jest.mock("@/components/waves/create-wave/CreateWave", () => ({
  __esModule: true,
  default: ({ profile }: { readonly profile: { readonly handle: string } }) => (
    <div data-testid="create-wave" data-profile-handle={profile.handle}>
      Create Wave
    </div>
  ),
}));

jest.mock("@/components/waves/WavesDesktop", () => ({
  __esModule: true,
  default: ({
    children,
    showLeftSidebar = true,
  }: {
    readonly children: ReactNode;
    readonly showLeftSidebar?: boolean;
  }) => (
    <div
      data-testid="waves-desktop"
      data-show-left-sidebar={String(showLeftSidebar)}
    >
      {children}
    </div>
  ),
}));

jest.mock("@/components/waves/WavesMobile", () => ({
  __esModule: true,
  default: ({ children }: { readonly children: ReactNode }) => (
    <div data-testid="waves-mobile">{children}</div>
  ),
}));

jest.mock("@/components/user/utils/set-up-profile/UserSetUpProfileCta", () => ({
  __esModule: true,
  default: () => <div data-testid="setup-profile">Set up profile</div>,
}));

import WavesCreatePageClient from "@/app/waves/create/page.client";

describe("WavesCreatePageClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDeviceInfo.mockReturnValue({ isApp: true, isMobileDevice: true });
  });

  it("renders the connect prompt inside WavesMobile for logged-out app users", () => {
    mockUseAuth.mockReturnValue({ connectedProfile: null });
    mockUseAuthenticatedContent.mockReturnValue({
      contentState: "not-authenticated",
    });

    render(<WavesCreatePageClient />);

    expect(screen.getByTestId("waves-mobile")).toContainElement(
      screen.getByTestId("connect-wallet")
    );
    expect(screen.queryByTestId("create-wave")).not.toBeInTheDocument();
    expect(screen.queryByTestId("waves-desktop")).not.toBeInTheDocument();
  });

  it("renders CreateWave instead of ConnectWallet when a profile is connected", () => {
    mockUseAuth.mockReturnValue({
      connectedProfile: {
        id: "profile-1",
        handle: "alice",
        normalised_handle: "alice",
      },
    });
    mockUseAuthenticatedContent.mockReturnValue({
      contentState: "ready",
    });

    render(<WavesCreatePageClient />);

    expect(screen.getByTestId("waves-mobile")).toContainElement(
      screen.getByTestId("create-wave")
    );
    expect(screen.getByTestId("create-wave")).toHaveAttribute(
      "data-profile-handle",
      "alice"
    );
    expect(screen.queryByTestId("connect-wallet")).not.toBeInTheDocument();
  });
});
