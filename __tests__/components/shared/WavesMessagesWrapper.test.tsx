import { render, screen } from "@testing-library/react";
import React from "react";
import WavesMessagesWrapper from "@/components/shared/WavesMessagesWrapper";

const mockUseQuery = jest.fn();
const mockCloseRightSidebar = jest.fn();
const mockUsePublicWaveShellState = jest.fn();

jest.mock("@tanstack/react-query", () => ({
  keepPreviousData: {},
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
  useSearchParams: () => new URLSearchParams("wave=wave-1"),
  usePathname: () => "/waves",
}));

jest.mock("@/helpers/navigation.helpers", () => ({
  getActiveWaveIdFromUrl: () => "wave-1",
}));

jest.mock("@/hooks/useCreateModalState", () => ({
  __esModule: true,
  default: () => ({ isWaveModalOpen: false, close: jest.fn() }),
}));

jest.mock("@/hooks/useClosingDropId", () => ({
  useClosingDropId: () => ({
    effectiveDropId: undefined,
    beginClosingDrop: jest.fn(),
  }),
}));

jest.mock("@/hooks/useSidebarState", () => ({
  useSidebarState: () => ({
    isRightSidebarOpen: true,
    closeRightSidebar: mockCloseRightSidebar,
  }),
}));

jest.mock("@/components/waves/public/usePublicWaveShellState", () => ({
  usePublicWaveShellState: (...args: unknown[]) =>
    mockUsePublicWaveShellState(...args),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile: null }),
}));

jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ contentContainerStyle: undefined }),
}));

jest.mock("react-use", () => ({
  createBreakpoint: () => () => "LG",
}));

jest.mock("@/components/brain/left-sidebar/web/WebLeftSidebar", () => ({
  __esModule: true,
  default: ({ isCollapsed }: { isCollapsed?: boolean }) => (
    <div
      data-testid="left-sidebar"
      data-collapsed={String(Boolean(isCollapsed))}
    />
  ),
}));

jest.mock("@/components/brain/right-sidebar/BrainRightSidebar", () => ({
  __esModule: true,
  SidebarTab: {
    ABOUT: "ABOUT",
  },
  default: ({ variant, waveId }: { variant: string; waveId: string }) => (
    <div
      data-testid="right-sidebar"
      data-variant={variant}
      data-wave-id={waveId}
    />
  ),
}));

jest.mock("@/components/brain/BrainDesktopDrop", () => ({
  __esModule: true,
  default: () => <div data-testid="desktop-drop" />,
}));

describe("WavesMessagesWrapper", () => {
  beforeEach(() => {
    mockUseQuery.mockReturnValue({ data: undefined, error: undefined });
    mockCloseRightSidebar.mockClear();
    mockUsePublicWaveShellState.mockReturnValue({ status: "ready" });
  });

  it("renders the right sidebar in public read-only mode when the shell is ready", () => {
    render(
      <WavesMessagesWrapper isPublicReadOnly={true}>
        <div>content</div>
      </WavesMessagesWrapper>
    );

    expect(screen.getByTestId("right-sidebar")).toHaveAttribute(
      "data-wave-id",
      "wave-1"
    );
    expect(mockCloseRightSidebar).not.toHaveBeenCalled();
  });

  it("does not render the right sidebar in public read-only mode while loading", () => {
    mockUsePublicWaveShellState.mockReturnValue({ status: "loading" });

    render(
      <WavesMessagesWrapper isPublicReadOnly={true}>
        <div>content</div>
      </WavesMessagesWrapper>
    );

    expect(screen.queryByTestId("right-sidebar")).not.toBeInTheDocument();
    expect(mockCloseRightSidebar).not.toHaveBeenCalled();
  });

  it("does not render the right sidebar in public read-only mode when the wave is unavailable", () => {
    mockUsePublicWaveShellState.mockReturnValue({ status: "unavailable" });

    render(
      <WavesMessagesWrapper isPublicReadOnly={true}>
        <div>content</div>
      </WavesMessagesWrapper>
    );

    expect(screen.queryByTestId("right-sidebar")).not.toBeInTheDocument();
    expect(mockCloseRightSidebar).not.toHaveBeenCalled();
  });

  it("keeps authenticated flows using the right sidebar even if the public shell is not ready", () => {
    mockUsePublicWaveShellState.mockReturnValue({ status: "unavailable" });

    render(
      <WavesMessagesWrapper>
        <div>content</div>
      </WavesMessagesWrapper>
    );

    expect(screen.getByTestId("right-sidebar")).toHaveAttribute(
      "data-wave-id",
      "wave-1"
    );
    expect(mockCloseRightSidebar).not.toHaveBeenCalled();
  });
});
