import WavesLayout from "@/components/waves/layout/WavesLayout";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockUseAuthenticatedContent = jest.fn();
const mockUseDeviceInfo = jest.fn();
const mockGetActiveWaveIdFromUrl = jest.fn();
const mockUsePathname = jest.fn();
const mockUseSearchParams = jest.fn();

jest.mock("../../../hooks/useAuthenticatedContent", () => ({
  useAuthenticatedContent: () => mockUseAuthenticatedContent(),
}));

jest.mock("../../../hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => mockUseDeviceInfo(),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useSearchParams: () => mockUseSearchParams(),
}));

jest.mock("../../../helpers/navigation.helpers", () => ({
  getActiveWaveIdFromUrl: (...args: unknown[]) =>
    mockGetActiveWaveIdFromUrl(...args),
}));

jest.mock("@/components/waves/WavesDesktop", () => ({
  __esModule: true,
  default: ({
    allowMainContentWithoutWave,
    children,
    showLeftSidebar,
  }: {
    readonly allowMainContentWithoutWave?: boolean;
    readonly children: React.ReactNode;
    readonly showLeftSidebar?: boolean;
  }) => (
    <div
      data-testid="waves-desktop"
      data-allow-main-content-without-wave={String(
        allowMainContentWithoutWave
      )}
      data-show-left-sidebar={String(showLeftSidebar)}
    >
      {children}
    </div>
  ),
}));

jest.mock("@/components/waves/WavesMobile", () => ({
  __esModule: true,
  default: ({ children }: { readonly children: React.ReactNode }) => (
    <div data-testid="waves-mobile">{children}</div>
  ),
}));

jest.mock("@/components/common/ConnectWallet", () => ({
  __esModule: true,
  default: () => <div data-testid="connect-wallet">Connect Wallet</div>,
}));

jest.mock("@/components/user/utils/set-up-profile/UserSetUpProfileCta", () => ({
  __esModule: true,
  default: () => <div data-testid="setup-profile">Set up profile</div>,
}));

describe("WavesLayout", () => {
  beforeEach(() => {
    mockUseAuthenticatedContent.mockReturnValue({
      contentState: "not-authenticated",
    });
    mockUseDeviceInfo.mockReturnValue({ isApp: false, isMobileDevice: false });
    mockUsePathname.mockReturnValue("/waves/test-wave");
    mockUseSearchParams.mockReturnValue(new URLSearchParams("wave=test-wave"));
    mockGetActiveWaveIdFromUrl.mockReturnValue(null);
  });

  it("renders the selected wave content for logged-out users", () => {
    mockGetActiveWaveIdFromUrl.mockReturnValue("test-wave");

    render(
      <WavesLayout>
        <div data-testid="wave-content">Real wave content</div>
      </WavesLayout>
    );

    expect(screen.getByTestId("wave-content")).toBeInTheDocument();
    expect(screen.getByTestId("waves-desktop")).toHaveAttribute(
      "data-allow-main-content-without-wave",
      "false"
    );
    expect(screen.getByTestId("waves-desktop")).toHaveAttribute(
      "data-show-left-sidebar",
      "true"
    );
  });

  it("renders the default waves content for logged-out web users when no wave is selected", () => {
    render(
      <WavesLayout>
        <div data-testid="wave-content">Real wave content</div>
      </WavesLayout>
    );

    expect(screen.getByTestId("wave-content")).toBeInTheDocument();
    expect(screen.getByTestId("waves-desktop")).toHaveAttribute(
      "data-allow-main-content-without-wave",
      "true"
    );
    expect(screen.queryByTestId("connect-wallet")).not.toBeInTheDocument();
  });
});
