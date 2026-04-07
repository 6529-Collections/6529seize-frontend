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
    allowDropOverlay,
    allowRightSidebar,
    children,
    showLeftSidebar,
  }: {
    readonly allowDropOverlay?: boolean;
    readonly allowRightSidebar?: boolean;
    readonly children: React.ReactNode;
    readonly showLeftSidebar?: boolean;
  }) => (
    <div
      data-testid="waves-desktop"
      data-allow-drop-overlay={String(allowDropOverlay)}
      data-allow-right-sidebar={String(allowRightSidebar)}
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

jest.mock("@/components/header/user/HeaderUserConnect", () => ({
  __esModule: true,
  default: ({ label }: { readonly label?: string }) => (
    <button type="button">{label ?? "Connect Wallet"}</button>
  ),
}));

jest.mock("@/components/user/utils/set-up-profile/UserSetUpProfileCta", () => ({
  __esModule: true,
  default: () => <div data-testid="setup-profile">Set up profile</div>,
}));

jest.mock("@/components/waves/WaveScreenMessage", () => ({
  __esModule: true,
  default: ({
    action,
    description,
    title,
  }: {
    readonly action?: React.ReactNode;
    readonly description?: string;
    readonly title: string;
  }) => (
    <div data-testid="wave-screen-message">
      <h1>{title}</h1>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  ),
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
      "data-allow-drop-overlay",
      "false"
    );
    expect(screen.getByTestId("waves-desktop")).toHaveAttribute(
      "data-allow-right-sidebar",
      "false"
    );
    expect(screen.queryByTestId("wave-screen-message")).not.toBeInTheDocument();
  });

  it("keeps the select-wave prompt when no wave is selected", () => {
    render(
      <WavesLayout>
        <div data-testid="wave-content">Real wave content</div>
      </WavesLayout>
    );

    expect(screen.getByText("Select a Wave")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Connect your wallet to access waves and join the conversation."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Connect Wallet" })
    ).toBeInTheDocument();
    expect(screen.queryByTestId("wave-content")).not.toBeInTheDocument();
  });
});
