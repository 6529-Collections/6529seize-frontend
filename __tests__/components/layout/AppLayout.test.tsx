import { editSlice } from "@/store/editSlice";
import { configureStore } from "@reduxjs/toolkit";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { Provider } from "react-redux";

const useViewContext = jest.fn();
const registerRef = jest.fn();
const setHeaderRef = jest.fn();
const usePathname = jest.fn();
const useSearchParams = jest.fn();
let mockDialogMountCount = 0;

jest.mock("next/dynamic", () => () => {
  const MockDynamicComponent = () => <div data-testid="header" />;
  MockDynamicComponent.displayName = "MockDynamicComponent";
  return MockDynamicComponent;
});
jest.mock("@/components/navigation/ViewContext", () => ({
  useViewContext: () => useViewContext(),
}));
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
  useLayout: () => ({ registerRef }),
}));
jest.mock("@/contexts/HeaderContext", () => ({
  useHeaderContext: () => ({ setHeaderRef }),
}));
jest.mock("@/hooks/useDeepLinkNavigation", () => ({
  useDeepLinkNavigation: jest.fn(),
}));
jest.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
  useSearchParams: () => useSearchParams(),
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

    return {
      closeQuickVote: () => setIsQuickVoteOpen(false),
      isQuickVoteOpen,
      openQuickVote: () => {
        const sessionId =
          reservedSessionIdRef.current ?? nextSessionIdRef.current;
        reservedSessionIdRef.current = null;
        nextSessionIdRef.current = sessionId + 1;
        setQuickVoteSessionId(sessionId);
        setIsQuickVoteOpen(true);
      },
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

  beforeEach(() => {
    jest.clearAllMocks();
    store = configureStore({
      reducer: { edit: editSlice.reducer },
    });
    usePathname.mockReturnValue("/");
    useSearchParams.mockReturnValue({ get: () => null } as any);
    mockDialogMountCount = 0;
  });

  const renderWithProvider = (children: React.ReactElement) => {
    return render(<Provider store={store}>{children}</Provider>);
  };

  it("renders main content when no active view", () => {
    useViewContext.mockReturnValue({ activeView: null });
    renderWithProvider(<AppLayout>child</AppLayout>);
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByText("child")).toBeInTheDocument();
    expect(screen.getByTestId("bottom-nav")).toBeInTheDocument();
  });

  it("renders waves or messages view based on activeView", () => {
    useViewContext.mockReturnValue({ activeView: "waves" });
    const { rerender } = renderWithProvider(<AppLayout>child</AppLayout>);
    expect(screen.getByTestId("waves")).toBeInTheDocument();

    useViewContext.mockReturnValue({ activeView: "messages" });
    rerender(
      <Provider store={store}>
        <AppLayout>child</AppLayout>
      </Provider>
    );
    expect(screen.getByTestId("messages")).toBeInTheDocument();
  });

  it("owns a persistent quick-vote dialog for the waves view", () => {
    useViewContext.mockReturnValue({ activeView: "waves" });

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
    useViewContext.mockReturnValue({ activeView: "waves" });

    const { rerender } = renderWithProvider(<AppLayout>child</AppLayout>);

    fireEvent.click(
      screen.getByRole("button", { name: "Open quick vote from app layout" })
    );
    expect(screen.getByText("Session 1")).toBeInTheDocument();

    useViewContext.mockReturnValue({ activeView: "messages" });
    rerender(
      <Provider store={store}>
        <AppLayout>child</AppLayout>
      </Provider>
    );

    expect(screen.getByTestId("messages")).toBeInTheDocument();
    expect(screen.queryByTestId("quick-vote-dialog")).not.toBeInTheDocument();

    useViewContext.mockReturnValue({ activeView: "waves" });
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
