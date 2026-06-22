import { editSlice } from "@/store/editSlice";
import { configureStore } from "@reduxjs/toolkit";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";

const registerRef = jest.fn();
const setHeaderRef = jest.fn();
const usePathname = jest.fn();
const getSearchParams = jest.fn();
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

jest.mock("next/dynamic", () => () => {
  const MockDynamicComponent = () => <div data-testid="header" />;
  MockDynamicComponent.displayName = "MockDynamicComponent";
  return MockDynamicComponent;
});
jest.mock(
  "@/components/navigation/BottomNavigation",
  () =>
    function BottomNavigation() {
      return <div data-testid="bottom-nav" />;
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
  default: () => null,
}));
jest.mock("@/hooks/useMemesQuickVoteDialogController", () => ({
  useMemesQuickVoteDialogController: () => {
    const React = require("react");
    const [isQuickVoteOpen, setIsQuickVoteOpen] = React.useState(false);
    const [quickVoteSessionId, setQuickVoteSessionId] = React.useState(0);
    const nextSessionIdRef = React.useRef(1);
    const reservedSessionIdRef = React.useRef(null as number | null);
    const closeQuickVote = () => setIsQuickVoteOpen(false);
    const openQuickVote = () => {
      const sessionId =
        reservedSessionIdRef.current ?? nextSessionIdRef.current;
      reservedSessionIdRef.current = null;
      nextSessionIdRef.current = sessionId + 1;
      setQuickVoteSessionId(sessionId);
      setIsQuickVoteOpen(true);
    };

    return {
      closeQuickVote,
      dialogState: {
        isOpen: isQuickVoteOpen,
        onClose: closeQuickVote,
        sessionId: quickVoteSessionId,
      },
      isQuickVoteOpen,
      openQuickVote,
      prefetchQuickVote: () => {
        if (reservedSessionIdRef.current === null) {
          reservedSessionIdRef.current = nextSessionIdRef.current;
        }
      },
      quickVoteSessionId,
    };
  },
}));
jest.mock(
  "@/components/brain/left-sidebar/waves/memes-quick-vote/MemesQuickVoteDialog",
  () => ({
    __esModule: true,
    default: ({
      isOpen,
      onClose,
      sessionId,
    }: {
      readonly isOpen: boolean;
      readonly sessionId: number;
      readonly onClose: () => void;
    }) => {
      const React = require("react");

      React.useEffect(() => {
        mockDialogMountCount += 1;
      }, []);

      return isOpen ? (
        <div data-testid="quick-vote-dialog">
          <div>Session {sessionId}</div>
          <button type="button" onClick={onClose}>
            Close Quick Vote
          </button>
        </div>
      ) : null;
    },
  })
);

const AppLayout = require("@/components/layout/AppLayout").default;

describe("AppLayout", () => {
  let store: any;
  const bottomReserveProperty = "--stream-route-loading-bottom-reserve";
  const headerReserveProperty = "--stream-route-loading-header-reserve";

  beforeEach(() => {
    jest.clearAllMocks();
    store = configureStore({
      reducer: { edit: editSlice.reducer },
    });
    usePathname.mockReturnValue("/");
    getSearchParams.mockReturnValue(new URLSearchParams());
    mockDialogMountCount = 0;
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
    return render(<Provider store={store}>{children}</Provider>);
  };

  it("renders main content when no active view", () => {
    renderWithProvider(<AppLayout>child</AppLayout>);
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByText("child")).toBeInTheDocument();
    expect(screen.getByTestId("bottom-nav")).toBeInTheDocument();
  });

  it("sets stream loading reserve when bottom nav is visible", () => {
    const { container } = renderWithProvider(<AppLayout>child</AppLayout>);
    const appWrapper = container.firstElementChild as HTMLElement;

    expect(appWrapper.style.getPropertyValue(bottomReserveProperty)).toBe(
      "85px"
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
    const { rerender } = renderWithProvider(<AppLayout>child</AppLayout>);
    expect(screen.getByTestId("waves")).toBeInTheDocument();

    getSearchParams.mockReturnValue(new URLSearchParams("view=messages"));
    rerender(
      <Provider store={store}>
        <AppLayout>child</AppLayout>
      </Provider>
    );
    expect(screen.getByTestId("messages")).toBeInTheDocument();
  });

  it("uses root view params for app shell content instead of route children", () => {
    usePathname.mockReturnValue("/");
    getSearchParams.mockReturnValue(new URLSearchParams("view=waves"));

    const { rerender } = renderWithProvider(<AppLayout>child</AppLayout>);

    expect(screen.getByTestId("waves")).toBeInTheDocument();
    expect(screen.queryByText("child")).not.toBeInTheDocument();

    getSearchParams.mockReturnValue(new URLSearchParams("view=messages"));
    rerender(
      <Provider store={store}>
        <AppLayout>child</AppLayout>
      </Provider>
    );

    expect(screen.getByTestId("messages")).toBeInTheDocument();
    expect(screen.queryByText("child")).not.toBeInTheDocument();
  });

  it("owns a persistent quick-vote dialog for the waves view", () => {
    getSearchParams.mockReturnValue(new URLSearchParams("view=waves"));

    renderWithProvider(<AppLayout>child</AppLayout>);

    expect(mockDialogMountCount).toBe(1);

    fireEvent.click(
      screen.getByRole("button", { name: "Open quick vote from app layout" })
    );
    expect(screen.getByText("Session 1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close Quick Vote" }));
    expect(screen.queryByTestId("quick-vote-dialog")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Open quick vote from app layout" })
    );
    expect(screen.getByText("Session 2")).toBeInTheDocument();
    expect(mockDialogMountCount).toBe(1);
  });

  it("closes the quick-vote dialog when leaving the waves view", () => {
    getSearchParams.mockReturnValue(new URLSearchParams("view=waves"));

    const { rerender } = renderWithProvider(<AppLayout>child</AppLayout>);

    fireEvent.click(
      screen.getByRole("button", { name: "Open quick vote from app layout" })
    );
    expect(screen.getByText("Session 1")).toBeInTheDocument();

    getSearchParams.mockReturnValue(new URLSearchParams("view=messages"));
    rerender(
      <Provider store={store}>
        <AppLayout>child</AppLayout>
      </Provider>
    );

    expect(screen.getByTestId("messages")).toBeInTheDocument();
    expect(screen.queryByTestId("quick-vote-dialog")).not.toBeInTheDocument();

    getSearchParams.mockReturnValue(new URLSearchParams("view=waves"));
    rerender(
      <Provider store={store}>
        <AppLayout>child</AppLayout>
      </Provider>
    );

    expect(screen.getByTestId("waves")).toBeInTheDocument();
    expect(screen.queryByTestId("quick-vote-dialog")).not.toBeInTheDocument();
    expect(mockDialogMountCount).toBe(2);

    fireEvent.click(
      screen.getByRole("button", { name: "Open quick vote from app layout" })
    );
    expect(screen.getByText("Session 1")).toBeInTheDocument();
  });
});
