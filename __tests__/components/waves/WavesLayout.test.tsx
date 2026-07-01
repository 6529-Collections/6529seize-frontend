import WavesLayout from "@/components/waves/layout/WavesLayout";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockUseAuthenticatedContent = jest.fn();
const mockUseDeviceInfo = jest.fn();

jest.mock("next/dynamic", () => (loader: () => Promise<unknown>) => {
  const loaderSource = loader.toString();

  if (loaderSource.includes("WavesDesktop")) {
    return require("@/components/waves/WavesDesktop").default;
  }

  throw new Error(`Unexpected dynamic import in WavesLayout test: ${loaderSource}`);
});

jest.mock("../../../hooks/useAuthenticatedContent", () => ({
  useAuthenticatedContent: () => mockUseAuthenticatedContent(),
}));

jest.mock("../../../hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => mockUseDeviceInfo(),
}));

jest.mock("@/components/waves/WavesDesktop", () => ({
  __esModule: true,
  default: ({
    children,
    showLeftSidebar = true,
  }: {
    readonly children: React.ReactNode;
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
  default: ({ children }: { readonly children: React.ReactNode }) => (
    <div data-testid="waves-mobile">{children}</div>
  ),
}));

jest.mock("@/components/common/ConnectWallet", () => ({
  __esModule: true,
  default: () => <div data-testid="connect-wallet">Connect Wallet</div>,
}));

describe("WavesLayout", () => {
  beforeEach(() => {
    mockUseAuthenticatedContent.mockReturnValue({
      contentState: "not-authenticated",
    });
    mockUseDeviceInfo.mockReturnValue({ isApp: false, isMobileDevice: false });
  });

  it("renders WavesDesktop and children for logged-out web users", () => {
    render(
      <WavesLayout>
        <div data-testid="wave-content">Real wave content</div>
      </WavesLayout>
    );

    expect(screen.getByTestId("wave-content")).toBeInTheDocument();
    expect(screen.getByTestId("waves-desktop")).toHaveAttribute(
      "data-show-left-sidebar",
      "true"
    );
    expect(screen.queryByTestId("waves-mobile")).not.toBeInTheDocument();
  });

  it("renders WavesMobile and children for logged-out app users", () => {
    mockUseDeviceInfo.mockReturnValue({ isApp: true, isMobileDevice: true });

    render(
      <WavesLayout>
        <div data-testid="wave-content">Real wave content</div>
      </WavesLayout>
    );

    expect(screen.getByTestId("wave-content")).toBeInTheDocument();
    expect(screen.getByTestId("waves-mobile")).toBeInTheDocument();
    expect(screen.queryByTestId("waves-desktop")).not.toBeInTheDocument();
    expect(screen.queryByTestId("connect-wallet")).not.toBeInTheDocument();
  });

  it("keeps the Waves shell mounted without children while auth state is loading", () => {
    mockUseAuthenticatedContent.mockReturnValue({
      contentState: "loading",
    });

    render(
      <WavesLayout>
        <div data-testid="wave-content">Real wave content</div>
      </WavesLayout>
    );

    expect(screen.getByTestId("waves-desktop")).toBeInTheDocument();
    expect(screen.queryByTestId("wave-content")).not.toBeInTheDocument();
    expect(screen.queryByTestId("connect-wallet")).not.toBeInTheDocument();
  });

  it("renders Waves content read-only when profile setup is needed", () => {
    mockUseAuthenticatedContent.mockReturnValue({
      contentState: "needs-profile",
    });
    mockUseDeviceInfo.mockReturnValue({ isApp: true, isMobileDevice: true });

    render(
      <WavesLayout>
        <div data-testid="wave-content">Real wave content</div>
      </WavesLayout>
    );

    expect(screen.getByTestId("wave-content")).toBeInTheDocument();
    expect(screen.queryByTestId("waves-desktop")).not.toBeInTheDocument();
    expect(screen.getByTestId("waves-mobile")).toBeInTheDocument();
    expect(screen.queryByTestId("connect-wallet")).not.toBeInTheDocument();
  });

  it("shows unavailable message instead of Waves content when content is not available", () => {
    mockUseAuthenticatedContent.mockReturnValue({
      contentState: "not-available",
    });
    mockUseDeviceInfo.mockReturnValue({ isApp: true, isMobileDevice: true });

    render(
      <WavesLayout>
        <div data-testid="wave-content">Real wave content</div>
      </WavesLayout>
    );

    expect(
      screen.getByText("This content is not available.")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("wave-content")).not.toBeInTheDocument();
    expect(screen.queryByTestId("waves-desktop")).not.toBeInTheDocument();
    expect(screen.queryByTestId("waves-mobile")).not.toBeInTheDocument();
    expect(screen.queryByTestId("connect-wallet")).not.toBeInTheDocument();
  });
});
