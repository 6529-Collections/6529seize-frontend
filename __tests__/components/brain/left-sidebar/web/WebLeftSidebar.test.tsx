import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import WebLeftSidebar from "@/components/brain/left-sidebar/web/WebLeftSidebar";
import { SidebarProvider } from "@/hooks/useSidebarState";

const usePathname = jest.fn();
let mockDialogMountCount = 0;

jest.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
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
  "@/components/brain/left-sidebar/web/WebBrainLeftSidebarWaves",
  () => ({
    __esModule: true,
    default: () => <div data-testid="waves-list" />,
  })
);

jest.mock("@/components/brain/left-sidebar/web/WebDirectMessagesList", () => ({
  __esModule: true,
  default: () => <div data-testid="messages-list" />,
}));

jest.mock("@/components/brain/left-sidebar/waves/MemesWaveFooter", () => ({
  __esModule: true,
  default: ({
    collapsed,
    onOpenQuickVote,
  }: {
    readonly collapsed?: boolean;
    readonly onOpenQuickVote: () => void;
  }) => (
    <button type="button" data-testid="footer" onClick={onOpenQuickVote}>
      {collapsed ? "collapsed" : "expanded"}
    </button>
  ),
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
        <div data-testid="dialog">
          <div>Session {sessionId}</div>
          <button type="button" onClick={onClose}>
            Close Quick Vote
          </button>
        </div>
      ) : null;
    },
  })
);

describe("WebLeftSidebar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDialogMountCount = 0;
  });

  const renderSidebar = (ui: React.ReactNode) =>
    render(<SidebarProvider>{ui}</SidebarProvider>);

  it("renders the footer in the waves sidebar", () => {
    usePathname.mockReturnValue("/waves");

    renderSidebar(<WebLeftSidebar />);

    expect(screen.getByTestId("waves-list")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toHaveTextContent("expanded");
  });

  it("passes collapsed mode through to the footer", () => {
    usePathname.mockReturnValue("/waves");

    renderSidebar(<WebLeftSidebar isCollapsed />);

    expect(screen.getByTestId("footer")).toHaveTextContent("collapsed");
  });

  it("opens the shared quick-vote dialog from the footer without remounting it", () => {
    usePathname.mockReturnValue("/waves");

    renderSidebar(<WebLeftSidebar />);

    expect(mockDialogMountCount).toBe(1);

    fireEvent.click(screen.getByTestId("footer"));
    expect(screen.getByText("Session 1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Close Quick Vote" }));
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("footer"));
    expect(screen.getByText("Session 2")).toBeInTheDocument();
    expect(mockDialogMountCount).toBe(1);
  });

  it("resets quick-vote state when switching between waves and messages", () => {
    usePathname.mockReturnValue("/waves");

    const { rerender } = renderSidebar(<WebLeftSidebar />);

    expect(mockDialogMountCount).toBe(1);

    fireEvent.click(screen.getByTestId("footer"));
    expect(screen.getByText("Session 1")).toBeInTheDocument();

    usePathname.mockReturnValue("/messages/thread");
    rerender(
      <SidebarProvider>
        <WebLeftSidebar />
      </SidebarProvider>
    );

    expect(screen.getByTestId("messages-list")).toBeInTheDocument();
    expect(screen.queryByTestId("footer")).not.toBeInTheDocument();
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();

    usePathname.mockReturnValue("/waves");
    rerender(
      <SidebarProvider>
        <WebLeftSidebar />
      </SidebarProvider>
    );

    expect(screen.getByTestId("waves-list")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
    expect(mockDialogMountCount).toBe(2);

    fireEvent.click(screen.getByTestId("footer"));
    expect(screen.getByText("Session 1")).toBeInTheDocument();
  });

  it("hides the footer in messages view", () => {
    usePathname.mockReturnValue("/messages/thread");

    renderSidebar(<WebLeftSidebar />);

    expect(screen.getByTestId("messages-list")).toBeInTheDocument();
    expect(screen.queryByTestId("footer")).not.toBeInTheDocument();
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });
});
