import WavesLayout from "@/components/waves/layout/WavesLayout";
import { render, screen } from "@testing-library/react";
import React from "react";

const mockUseAuthenticatedContent = jest.fn();
const mockUseDeviceInfo = jest.fn();
const mockMarkMobileLaunchStep = jest.fn();
const mockScheduleMobileLaunchFlush = jest.fn();
const mockUsePathname = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

jest.mock("@/utils/monitoring/mobileLaunchTiming", () => ({
  markMobileLaunchStep: (...args: unknown[]) =>
    mockMarkMobileLaunchStep(...args),
  scheduleMobileLaunchFlush: (...args: unknown[]) =>
    mockScheduleMobileLaunchFlush(...args),
}));

jest.mock("next/dynamic", () => (loader: () => Promise<unknown>) => {
  const loaderSource = loader.toString();

  if (loaderSource.includes("WavesDesktop")) {
    return require("@/components/waves/WavesDesktop").default;
  }

  throw new Error(
    `Unexpected dynamic import in WavesLayout test: ${loaderSource}`
  );
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

jest.mock("@/components/brain/content/BrainContent", () => ({
  __esModule: true,
  default: ({ children }: { readonly children: React.ReactNode }) => (
    <div data-testid="brain-content">{children}</div>
  ),
}));

describe("WavesLayout", () => {
  beforeEach(() => {
    mockMarkMobileLaunchStep.mockClear();
    mockScheduleMobileLaunchFlush.mockClear();
    mockUseAuthenticatedContent.mockReturnValue({
      contentState: "not-authenticated",
    });
    mockUseDeviceInfo.mockReturnValue({ isApp: false, isMobileDevice: false });
    mockUsePathname.mockReturnValue("/waves");
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
    expect(mockMarkMobileLaunchStep).toHaveBeenCalledWith(
      "route_first_useful_content"
    );
    expect(mockScheduleMobileLaunchFlush).toHaveBeenCalledWith(
      "waves_content_visible",
      250
    );
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

  it("shows a loading skeleton while keeping real content hidden during auth loading", () => {
    mockUseAuthenticatedContent.mockReturnValue({
      contentState: "loading",
    });

    render(
      <WavesLayout>
        <div data-testid="wave-content">Real wave content</div>
      </WavesLayout>
    );

    expect(screen.getByTestId("waves-desktop")).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Loading waves" })
    ).toBeInTheDocument();
    expect(screen.queryByTestId("wave-content")).not.toBeInTheDocument();
    expect(screen.queryByTestId("connect-wallet")).not.toBeInTheDocument();
  });

  it("keeps a wave-shaped shell while a direct wave route authenticates", () => {
    mockUseAuthenticatedContent.mockReturnValue({
      contentState: "loading",
    });
    mockUsePathname.mockReturnValue("/waves/wave-123");

    render(
      <WavesLayout>
        <div data-testid="wave-content">Real wave content</div>
      </WavesLayout>
    );

    expect(
      screen.getByTestId("wave-view-loading-placeholder")
    ).toBeInTheDocument();
    expect(screen.getByTestId("posting-access-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("wave-content")).not.toBeInTheDocument();
  });

  it("keeps the wave content frame mounted when auth loading resolves", () => {
    mockUseAuthenticatedContent.mockReturnValue({
      contentState: "loading",
    });
    mockUsePathname.mockReturnValue("/waves/wave-123");

    const { rerender } = render(
      <WavesLayout>
        <div data-testid="wave-content">Real wave content</div>
      </WavesLayout>
    );
    const contentFrame = screen.getByTestId("brain-content");

    mockUseAuthenticatedContent.mockReturnValue({
      contentState: "ready",
    });
    rerender(
      <WavesLayout>
        <div data-testid="wave-content">Real wave content</div>
      </WavesLayout>
    );

    expect(screen.getByTestId("brain-content")).toBe(contentFrame);
    expect(screen.getByTestId("wave-content")).toBeInTheDocument();
    expect(
      screen.queryByTestId("wave-view-loading-placeholder")
    ).not.toBeInTheDocument();
  });

  it("renders Waves content while layout measurement is settling", () => {
    mockUseAuthenticatedContent.mockReturnValue({
      contentState: "measuring",
    });

    render(
      <WavesLayout>
        <div data-testid="wave-content">Real wave content</div>
      </WavesLayout>
    );

    expect(screen.getByTestId("waves-desktop")).toBeInTheDocument();
    expect(screen.getByTestId("wave-content")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
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
