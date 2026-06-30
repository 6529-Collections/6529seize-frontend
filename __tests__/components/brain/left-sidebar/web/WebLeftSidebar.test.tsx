import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import WebLeftSidebar from "@/components/brain/left-sidebar/web/WebLeftSidebar";
import { SidebarProvider } from "@/hooks/useSidebarState";

const usePathname = jest.fn();
let mockDialogMountCount = 0;

jest.mock("next/navigation", () => ({
  usePathname: () => usePathname(),
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
        <div data-testid="dialog">
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

  it("loads the shared quick-vote runtime from the footer without remounting it", async () => {
    usePathname.mockReturnValue("/waves");

    renderSidebar(<WebLeftSidebar />);

    expect(mockDialogMountCount).toBe(0);

    fireEvent.click(screen.getByTestId("footer"));
    await waitFor(() => {
      expect(screen.getByText("Session 1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Close Quick Vote" }));
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId("footer"));
    await waitFor(() => {
      expect(screen.getByText("Session 2")).toBeInTheDocument();
    });
    expect(mockDialogMountCount).toBe(2);
  });

  it("resets quick-vote state when switching between waves and messages", async () => {
    usePathname.mockReturnValue("/waves");

    const { rerender } = renderSidebar(<WebLeftSidebar />);

    expect(mockDialogMountCount).toBe(0);

    fireEvent.click(screen.getByTestId("footer"));
    await waitFor(() => {
      expect(screen.getByText("Session 1")).toBeInTheDocument();
    });

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
    expect(mockDialogMountCount).toBe(1);

    fireEvent.click(screen.getByTestId("footer"));
    await waitFor(() => {
      expect(screen.getByText("Session 1")).toBeInTheDocument();
    });
    expect(mockDialogMountCount).toBe(2);
  });

  it("hides the footer in messages view", () => {
    usePathname.mockReturnValue("/messages/thread");

    renderSidebar(<WebLeftSidebar />);

    expect(screen.getByTestId("messages-list")).toBeInTheDocument();
    expect(screen.queryByTestId("footer")).not.toBeInTheDocument();
    expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
  });
});
