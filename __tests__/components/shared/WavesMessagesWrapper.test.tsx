import WavesMessagesWrapper from "@/components/shared/WavesMessagesWrapper";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

let mockBreakpoint = "LG";
let mockWaveId: string | null = null;
let mockIsRightSidebarOpen = false;
let mockEffectiveDropId: string | undefined;

const mockChildMounted = jest.fn();
const mockCloseRightSidebar = jest.fn();
const mockRouterReplace = jest.fn();
const mockUseQuery = jest.fn();

jest.mock("react-use", () => ({
  createBreakpoint: () => () => mockBreakpoint,
}));

jest.mock("framer-motion", () => {
  const React = require("react");
  const MotionDiv = React.forwardRef(
    (
      {
        children,
        layout: _layout,
        layoutDependency: _layoutDependency,
        transition: _transition,
        ...props
      }: any,
      ref: React.ForwardedRef<HTMLDivElement>
    ) => (
      <div ref={ref} {...props}>
        {children}
      </div>
    )
  );

  return {
    domAnimation: {},
    LazyMotion: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    m: { div: MotionDiv },
    useReducedMotion: () => false,
  };
});

jest.mock("next/navigation", () => ({
  usePathname: () => "/waves",
  useRouter: () => ({ replace: mockRouterReplace }),
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/helpers/navigation.helpers", () => ({
  getActiveWaveIdFromUrl: () => mockWaveId,
}));

jest.mock("@tanstack/react-query", () => ({
  keepPreviousData: (value: unknown) => value,
  useQuery: (options: unknown) => mockUseQuery(options),
}));

jest.mock("@/hooks/useSidebarState", () => ({
  useSidebarState: () => ({
    closeRightSidebar: mockCloseRightSidebar,
    isRightSidebarOpen: mockIsRightSidebarOpen,
  }),
}));

jest.mock("@/hooks/useCreateModalState", () => ({
  __esModule: true,
  default: () => ({
    close: jest.fn(),
    isWaveModalOpen: false,
  }),
}));

jest.mock("@/hooks/useClosingDropId", () => ({
  useClosingDropId: () => ({
    beginClosingDrop: jest.fn(),
    effectiveDropId: mockEffectiveDropId,
  }),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile: null }),
}));

jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ contentContainerStyle: {} }),
}));

jest.mock("@/contexts/wave/WaveChatScrollContext", () => ({
  WaveChatScrollProvider: ({
    children,
  }: {
    readonly children: React.ReactNode;
  }) => <>{children}</>,
}));

jest.mock("@/components/brain/left-sidebar/web/WebLeftSidebar", () => ({
  __esModule: true,
  default: ({ isCollapsed }: { readonly isCollapsed: boolean }) => (
    <div
      data-testid="left-sidebar"
      data-collapsed={isCollapsed ? "true" : "false"}
    />
  ),
}));

jest.mock("@/components/brain/right-sidebar/BrainRightSidebar", () => ({
  __esModule: true,
  SidebarTab: { ABOUT: "ABOUT" },
  default: ({
    isOpen,
    variant,
    waveId,
  }: {
    readonly isOpen: boolean;
    readonly variant: string;
    readonly waveId: string | null | undefined;
  }) => (
    <div
      data-testid="right-sidebar"
      data-open={isOpen ? "true" : "false"}
      data-variant={variant}
      data-wave-id={waveId}
    />
  ),
}));

jest.mock("@/components/brain/BrainDesktopDrop", () => ({
  __esModule: true,
  default: () => <div data-testid="drop-overlay" />,
}));

jest.mock("@/components/waves/create-wave/CreateWaveModal", () => ({
  __esModule: true,
  default: () => <div data-testid="create-wave-modal" />,
}));

function MainContentProbe() {
  mockChildMounted();
  return <div data-testid="main-content">Main content</div>;
}

function renderWrapper() {
  return render(
    <WavesMessagesWrapper>
      <MainContentProbe />
    </WavesMessagesWrapper>
  );
}

describe("WavesMessagesWrapper", () => {
  beforeEach(() => {
    mockBreakpoint = "LG";
    mockWaveId = null;
    mockIsRightSidebarOpen = false;
    mockEffectiveDropId = undefined;
    jest.clearAllMocks();
    mockUseQuery.mockReturnValue({ data: undefined, error: null });
  });

  it("renders no-wave main content on desktop", () => {
    mockBreakpoint = "LG";
    mockWaveId = null;

    renderWrapper();

    expect(screen.getByTestId("main-content")).toBeInTheDocument();
    expect(mockChildMounted).toHaveBeenCalledTimes(1);
  });

  it("does not mount no-wave main content on small screens", () => {
    mockBreakpoint = "S";
    mockWaveId = null;

    renderWrapper();

    expect(screen.queryByTestId("main-content")).not.toBeInTheDocument();
    expect(screen.getByTestId("left-sidebar")).toBeInTheDocument();
    expect(mockChildMounted).not.toHaveBeenCalled();
  });

  it("renders selected wave main content on small screens", () => {
    mockBreakpoint = "S";
    mockWaveId = "wave-1";

    renderWrapper();

    expect(screen.getByTestId("main-content")).toBeInTheDocument();
    expect(screen.queryByTestId("left-sidebar")).not.toBeInTheDocument();
    expect(mockChildMounted).toHaveBeenCalledTimes(1);
  });

  it("coordinates the inline panel with the collapsed left rail", () => {
    mockBreakpoint = "LG";
    mockWaveId = "wave-1";
    mockIsRightSidebarOpen = true;

    renderWrapper();

    expect(screen.getByTestId("left-sidebar")).toHaveAttribute(
      "data-collapsed",
      "true"
    );
    expect(screen.getByTestId("right-sidebar")).toHaveAttribute(
      "data-open",
      "true"
    );
    expect(screen.getByTestId("right-sidebar")).toHaveAttribute(
      "data-variant",
      "inline"
    );
  });

  it("uses the overlay presentation without collapsing a mobile left rail", () => {
    mockBreakpoint = "S";
    mockWaveId = "wave-1";
    mockIsRightSidebarOpen = true;

    renderWrapper();

    expect(screen.queryByTestId("left-sidebar")).not.toBeInTheDocument();
    expect(screen.getByTestId("right-sidebar")).toHaveAttribute(
      "data-open",
      "true"
    );
    expect(screen.getByTestId("right-sidebar")).toHaveAttribute(
      "data-variant",
      "overlay"
    );
  });

  it("keeps one sidebar controller while crossing the layout breakpoint", () => {
    mockBreakpoint = "LG";
    mockWaveId = "wave-1";
    mockIsRightSidebarOpen = true;
    const { rerender } = renderWrapper();
    const controller = screen.getByTestId("right-sidebar");

    mockBreakpoint = "S";
    rerender(
      <WavesMessagesWrapper>
        <MainContentProbe />
      </WavesMessagesWrapper>
    );

    expect(screen.getByTestId("right-sidebar")).toBe(controller);
    expect(controller).toHaveAttribute("data-variant", "overlay");
    expect(controller).toHaveAttribute("data-open", "true");
  });

  it("auto-closes the sidebar when the active wave is deselected", async () => {
    mockIsRightSidebarOpen = true;

    renderWrapper();

    await waitFor(() => {
      expect(mockCloseRightSidebar).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByTestId("right-sidebar")).toHaveAttribute(
      "data-open",
      "false"
    );
  });

  it("suppresses the sidebar while a drop overlay is open", () => {
    mockWaveId = "wave-1";
    mockIsRightSidebarOpen = true;
    mockEffectiveDropId = "drop-1";
    mockUseQuery.mockReturnValue({ data: { id: "drop-1" }, error: null });

    renderWrapper();

    const dropOverlay = screen.getByTestId("drop-overlay");
    expect(dropOverlay).toBeInTheDocument();
    expect(screen.getByTestId("main-content")).not.toContainElement(
      dropOverlay
    );
    expect(screen.getByTestId("right-sidebar")).toHaveAttribute(
      "data-open",
      "false"
    );
  });

  it("keeps the open sidebar controller mounted when switching waves", () => {
    mockWaveId = "wave-1";
    mockIsRightSidebarOpen = true;
    const { rerender } = renderWrapper();
    const controller = screen.getByTestId("right-sidebar");

    mockWaveId = "wave-2";
    rerender(
      <WavesMessagesWrapper>
        <MainContentProbe />
      </WavesMessagesWrapper>
    );

    expect(screen.getByTestId("right-sidebar")).toBe(controller);
    expect(controller).toHaveAttribute("data-open", "true");
    expect(controller).toHaveAttribute("data-wave-id", "wave-2");
  });
});
