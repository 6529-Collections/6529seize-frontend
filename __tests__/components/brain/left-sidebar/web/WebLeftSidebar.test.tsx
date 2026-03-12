import { render, screen } from "@testing-library/react";
import React from "react";
import WebLeftSidebar from "@/components/brain/left-sidebar/web/WebLeftSidebar";
import { SidebarProvider } from "@/hooks/useSidebarState";

const usePathname = jest.fn();

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
  default: ({ collapsed }: { collapsed?: boolean }) => (
    <div data-testid="footer">{collapsed ? "collapsed" : "expanded"}</div>
  ),
}));

describe("WebLeftSidebar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it("hides the footer in messages view", () => {
    usePathname.mockReturnValue("/messages/thread");

    renderSidebar(<WebLeftSidebar />);

    expect(screen.getByTestId("messages-list")).toBeInTheDocument();
    expect(screen.queryByTestId("footer")).not.toBeInTheDocument();
  });
});
