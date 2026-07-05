import { PULL_TO_REFRESH_TRANSFORM_ROOT_ATTRIBUTE } from "@/helpers/pull-to-refresh.helpers";
import { EditingDropProvider } from "@/contexts/EditingDropContext";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

const registerRef = jest.fn();
const setHeaderRef = jest.fn();
const usePathname = jest.fn();
const getSearchParams = jest.fn();
const mockPullToRefresh = jest.fn();
let mockDialogMountCount = 0;
let mockLayoutSpaces = {
  headerSpace: 0,
  pinnedSpace: 0,
  tabsSpace: 0,
  spacerSpace: 0,
  mobileTabsSpace: 0,
  mobileNavSpace: 0,
  contentSpace: 0,
  measurementsComplete: false,
};

jest.mock("next/dynamic", () => (loader: () => Promise<unknown>) => {
  const loaderSource = loader.toString();

  if (loaderSource.includes("../header/AppHeader")) {
    const MockDynamicHeader = () => <div data-testid="header" />;
    MockDynamicHeader.displayName = "MockDynamicHeader";
    return MockDynamicHeader;
  }

  if (loaderSource.includes("BrainMobileMessages")) {
    const MockDynamicMessages = () => {
      const React = require("react");
      const messagesModule = require("@/components/brain/mobile/BrainMobileMessages");
      const BrainMobileMessages = messagesModule.default ?? messagesModule;

      return React.createElement(BrainMobileMessages);
    };
    MockDynamicMessages.displayName = "MockDynamicMessages";
    return MockDynamicMessages;
  }

  throw new Error(
    `Unexpected dynamic import in AppLayout test: ${loaderSource}`
  );
});
jest.mock(
  "@/components/navigation/BottomNavigation",
  () =>
    function BottomNavigation({ hidden }: { readonly hidden?: boolean }) {
      return (
        <div data-testid="bottom-nav" data-hidden={`${Boolean(hidden)}`} />
      );
    }
);
jest.mock(
  "@/components/brain/mobile/BrainMobileWaves",
  () =>
    function BrainMobileWaves({
      onOpenQuickVote,
    }: {
      readonly onOpenQuickVote: () => void;
    }) {
      return (
        <div data-testid="waves">
          <button type="button" onClick={onOpenQuickVote}>
            Open quick vote from app layout
          </button>
        </div>
      );
    }
);
jest.mock(
  "@/components/brain/mobile/BrainMobileMessages",
  () =>
    function BrainMobileMessages() {
      return <div data-testid="messages" />;
    }
);
jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ registerRef, spaces: mockLayoutSpaces }),
}));
jest.mock("@/contexts/HeaderContext", () => ({
  useHeaderContext: () => ({ setHeaderRef }),
}));
jest.mock("@/hooks/useDeepLinkNavigation", () => ({
  useDeepLinkNavigation: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
  useSearchParams: () => getSearchParams(),
}));
jest.mock("@/components/providers/PullToRefresh", () => ({
  __esModule: true,
  default: (props: unknown) => {
    mockPullToRefresh(props);
    return null;
  },
}));
jest.mock(
  "@/components/brain/left-sidebar/waves/memes-quick-vote/MemesQuickVoteRuntimeLoader",
  () => ({
    __esModule: true,
    LazyMemesQuickVoteRuntime: ({
      intent,
      onIdle,
    }: {
      readonly intent: { readonly id: number };
      readonly onIdle: () => void;
    }) => {
      const React = require("react");

      React.useEffect(() => {
        mockDialogMountCount += 1;
      }, []);

      return (
        <div data-testid="quick-vote-dialog">
          <div>Session {intent.id}</div>
          <button
            type="button"
            onClick={() => {
              onIdle();
            }}
          >
            Close Quick Vote
          </button>
        </div>
      );
    },
    useMemesQuickVoteRuntimeLauncher: () => {
      const React = require("react");
      const [runtimeIntent, setRuntimeIntent] = React.useState(null);
      const nextIntentIdRef = React.useRef(0);

      return {
        openQuickVote: () => {
          nextIntentIdRef.current += 1;
          setRuntimeIntent({
            action: "open",
            id: nextIntentIdRef.current,
          });
        },
        prefetchQuickVote: jest.fn(),
        resetQuickVoteRuntime: () => setRuntimeIntent(null),
        runtimeIntent,
        shouldMountRuntime: runtimeIntent !== null,
      };
    },
  })
);

const AppLayout = require("@/components/layout/AppLayout").default;

describe("AppLayout", () => {
  const bottomReserveProperty = "--stream-route-loading-bottom-reserve";
  const headerReserveProperty = "--stream-route-loading-header-reserve";

  beforeEach(() => {
    jest.clearAllMocks();
    usePathname.mockReturnValue("/");
    getSearchParams.mockReturnValue(new URLSearchParams());
    mockDialogMountCount = 0;
    mockPullToRefresh.mockClear();
    mockLayoutSpaces = {
      headerSpace: 0,
      pinnedSpace: 0,
      tabsSpace: 0,
      spacerSpace: 0,
      mobileTabsSpace: 0,
      mobileNavSpace: 0,
      contentSpace: 0,
      measurementsComplete: false,
    };
  });

  const renderWithProvider = (children: React.ReactElement) => {
    return render(<EditingDropProvider>{children}</EditingDropProvider>);
  };

  it("renders main content when no active view", () => {
    renderWithProvider(<AppLayout>child</AppLayout>);
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByText("child")).toBeInTheDocument();
    expect(screen.getByTestId("bottom-nav")).toBeInTheDocument();
  });

  it("keeps bottom nav outside the pull-to-refresh scroll target", () => {
    const { container } = renderWithProvider(<AppLayout>child</AppLayout>);
    const scrollTarget = container.querySelector(
      '[data-mobile-bottom-nav-scroll-target="true"]'
    );
    const transformRoot = container.querySelector(
      `[${PULL_TO_REFRESH_TRANSFORM_ROOT_ATTRIBUTE}="true"]`
    );
    const bottomNav = screen.getByTestId("bottom-nav");

    expect(scrollTarget).toBeInTheDocument();
    expect(transformRoot).toBeInTheDocument();
    expect(scrollTarget).toContainElement(transformRoot as HTMLElement);
    expect(scrollTarget).not.toContainElement(bottomNav);
    expect(transformRoot).not.toContainElement(bottomNav);
    expect(mockPullToRefresh).toHaveBeenCalledWith(
      expect.objectContaining({
        contentRef: expect.objectContaining({ current: transformRoot }),
      })
    );
  });

  it("sets stream loading reserve when bottom nav is visible", () => {
    const { container } = renderWithProvider(<AppLayout>child</AppLayout>);
    const appWrapper = container.firstElementChild as HTMLElement;

    expect(appWrapper.style.getPropertyValue(bottomReserveProperty)).toBe(
      "104px"
    );
  });

  it("clears stream loading reserve when a drop hides bottom nav", () => {
    getSearchParams.mockReturnValue(new URLSearchParams("drop=drop-1"));

    const { container } = renderWithProvider(<AppLayout>child</AppLayout>);
    const appWrapper = container.firstElementChild as HTMLElement;

    expect(screen.queryByTestId("bottom-nav")).not.toBeInTheDocument();
    expect(appWrapper.style.getPropertyValue(bottomReserveProperty)).toBe(
      "0px"
    );
  });

  it("lets notification route content own floating bottom nav clearance", () => {
    usePathname.mockReturnValue("/notifications");

    const { container } = renderWithProvider(<AppLayout>child</AppLayout>);
    const appWrapper = container.firstElementChild as HTMLElement;

    expect(screen.getByTestId("bottom-nav")).toHaveAttribute(
      "data-hidden",
      "false"
    );
    expect(appWrapper.style.getPropertyValue(bottomReserveProperty)).toBe(
      "0px"
    );
  });

  it("lets waves and messages routes own floating bottom nav clearance", () => {
    usePathname.mockReturnValue("/waves");

    const { container, rerender } = renderWithProvider(
      <AppLayout>child</AppLayout>
    );
    const appWrapper = container.firstElementChild as HTMLElement;

    expect(appWrapper.style.getPropertyValue(bottomReserveProperty)).toBe(
      "0px"
    );

    usePathname.mockReturnValue("/messages");
    rerender(
      <EditingDropProvider>
        <AppLayout>child</AppLayout>
      </EditingDropProvider>
    );

    expect(appWrapper.style.getPropertyValue(bottomReserveProperty)).toBe(
      "0px"
    );
  });

  it("slides the bottom nav away and clears spacing on wave detail routes", () => {
    usePathname.mockReturnValue("/waves/wave-1");

    const { container } = renderWithProvider(<AppLayout>child</AppLayout>);
    const appWrapper = container.firstElementChild as HTMLElement;

    expect(screen.getByTestId("bottom-nav")).toHaveAttribute(
      "data-hidden",
      "true"
    );
    expect(appWrapper.style.getPropertyValue(bottomReserveProperty)).toBe(
      "0px"
    );
  });

  it("slides the bottom nav away and clears spacing on message detail routes", () => {
    usePathname.mockReturnValue("/messages/dm-1");

    const { container } = renderWithProvider(<AppLayout>child</AppLayout>);
    const appWrapper = container.firstElementChild as HTMLElement;

    expect(screen.getByTestId("bottom-nav")).toHaveAttribute(
      "data-hidden",
      "true"
    );
    expect(appWrapper.style.getPropertyValue(bottomReserveProperty)).toBe(
      "0px"
    );
  });

  it("uses measured header space for stream loading reserve", () => {
    mockLayoutSpaces = {
      ...mockLayoutSpaces,
      headerSpace: 72,
      measurementsComplete: true,
    };

    const { container } = renderWithProvider(<AppLayout>child</AppLayout>);
    const appWrapper = container.firstElementChild as HTMLElement;

    expect(appWrapper.style.getPropertyValue(headerReserveProperty)).toBe(
      "72px"
    );
  });

  it("uses header fallback reserve before layout measurement completes", () => {
    mockLayoutSpaces = {
      ...mockLayoutSpaces,
      headerSpace: 72,
      measurementsComplete: false,
    };

    const { container } = renderWithProvider(<AppLayout>child</AppLayout>);
    const appWrapper = container.firstElementChild as HTMLElement;

    expect(appWrapper.style.getPropertyValue(headerReserveProperty)).toBe(
      "100px"
    );
  });

  it("renders waves or messages view based on the view query param", () => {
    getSearchParams.mockReturnValue(new URLSearchParams("view=waves"));
    const { container, rerender } = renderWithProvider(
      <AppLayout>child</AppLayout>
    );
    const appWrapper = container.firstElementChild as HTMLElement;

    expect(screen.getByTestId("waves")).toBeInTheDocument();
    expect(appWrapper.style.getPropertyValue(bottomReserveProperty)).toBe(
      "0px"
    );

    getSearchParams.mockReturnValue(new URLSearchParams("view=messages"));
    rerender(
      <EditingDropProvider>
        <AppLayout>child</AppLayout>
      </EditingDropProvider>
    );
    expect(screen.getByTestId("messages")).toBeInTheDocument();
    expect(appWrapper.style.getPropertyValue(bottomReserveProperty)).toBe(
      "0px"
    );
  });

  it("uses root view params for app shell content instead of route children", () => {
    usePathname.mockReturnValue("/");
    getSearchParams.mockReturnValue(new URLSearchParams("view=waves"));

    const { rerender } = renderWithProvider(<AppLayout>child</AppLayout>);

    expect(screen.getByTestId("waves")).toBeInTheDocument();
    expect(screen.queryByText("child")).not.toBeInTheDocument();

    getSearchParams.mockReturnValue(new URLSearchParams("view=messages"));
    rerender(
      <EditingDropProvider>
        <AppLayout>child</AppLayout>
      </EditingDropProvider>
    );

    expect(screen.getByTestId("messages")).toBeInTheDocument();
    expect(screen.queryByText("child")).not.toBeInTheDocument();
  });

  it("loads a persistent quick-vote runtime for the waves view on demand", async () => {
    getSearchParams.mockReturnValue(new URLSearchParams("view=waves"));

    renderWithProvider(<AppLayout>child</AppLayout>);

    expect(mockDialogMountCount).toBe(0);

    fireEvent.click(
      screen.getByRole("button", { name: "Open quick vote from app layout" })
    );
    await waitFor(() => {
      expect(screen.getByText("Session 1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Close Quick Vote" }));
    expect(screen.queryByTestId("quick-vote-dialog")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Open quick vote from app layout" })
    );
    await waitFor(() => {
      expect(screen.getByText("Session 2")).toBeInTheDocument();
    });
    expect(mockDialogMountCount).toBe(2);
  });

  it("resets the quick-vote runtime when leaving the waves view", async () => {
    getSearchParams.mockReturnValue(new URLSearchParams("view=waves"));

    const { rerender } = renderWithProvider(<AppLayout>child</AppLayout>);

    fireEvent.click(
      screen.getByRole("button", { name: "Open quick vote from app layout" })
    );
    await waitFor(() => {
      expect(screen.getByText("Session 1")).toBeInTheDocument();
    });

    getSearchParams.mockReturnValue(new URLSearchParams("view=messages"));
    rerender(
      <EditingDropProvider>
        <AppLayout>child</AppLayout>
      </EditingDropProvider>
    );

    expect(screen.getByTestId("messages")).toBeInTheDocument();
    expect(screen.queryByTestId("quick-vote-dialog")).not.toBeInTheDocument();

    getSearchParams.mockReturnValue(new URLSearchParams("view=waves"));
    rerender(
      <EditingDropProvider>
        <AppLayout>child</AppLayout>
      </EditingDropProvider>
    );

    expect(screen.getByTestId("waves")).toBeInTheDocument();
    expect(screen.queryByTestId("quick-vote-dialog")).not.toBeInTheDocument();
    expect(mockDialogMountCount).toBe(1);

    fireEvent.click(
      screen.getByRole("button", { name: "Open quick vote from app layout" })
    );
    await waitFor(() => {
      expect(screen.getByText("Session 1")).toBeInTheDocument();
    });
    expect(mockDialogMountCount).toBe(2);
  });
});
