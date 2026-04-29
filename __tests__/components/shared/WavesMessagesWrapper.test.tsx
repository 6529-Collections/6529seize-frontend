import WavesMessagesWrapper from "@/components/shared/WavesMessagesWrapper";
import { render, screen } from "@testing-library/react";
import React from "react";

let mockBreakpoint = "LG";
let mockWaveId: string | null = null;

const mockChildMounted = jest.fn();
const mockCloseRightSidebar = jest.fn();
const mockRouterReplace = jest.fn();
const mockUseQuery = jest.fn();

jest.mock("react-use", () => ({
  createBreakpoint: () => () => mockBreakpoint,
}));

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
    isRightSidebarOpen: false,
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
    effectiveDropId: undefined,
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
  default: () => <div data-testid="left-sidebar" />,
}));

jest.mock("@/components/brain/right-sidebar/BrainRightSidebar", () => ({
  __esModule: true,
  SidebarTab: { ABOUT: "ABOUT" },
  default: () => <div data-testid="right-sidebar" />,
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
});
