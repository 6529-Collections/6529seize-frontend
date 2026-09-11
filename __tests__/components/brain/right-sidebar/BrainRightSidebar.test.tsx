import {
  render,
  screen,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

let mockPrefersReducedMotion = false;

jest.mock("framer-motion", () => ({
  ...jest.requireActual("framer-motion"),
  useReducedMotion: () => mockPrefersReducedMotion,
}));

jest.mock("@tanstack/react-query", () => ({
  useQuery: jest.fn(),
  keepPreviousData: {},
}));

const WaveContentMock = jest.fn((props: any) => <div data-testid="content" />);
jest.mock("@/components/brain/right-sidebar/WaveContent", () => ({
  __esModule: true,
  WaveContent: (props: any) => WaveContentMock(props),
}));

const closeRightSidebar = jest.fn();
const refetch = jest.fn();
jest.mock("@/hooks/useSidebarState", () => {
  return {
    __esModule: true,
    SidebarProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    useSidebarState: () => ({
      isRightSidebarOpen: true,
      toggleRightSidebar: jest.fn(),
      openRightSidebar: jest.fn(),
      closeRightSidebar,
    }),
  };
});

import BrainRightSidebar from "@/components/brain/right-sidebar/BrainRightSidebar";
import {
  Mode,
  SidebarTab,
} from "@/components/brain/right-sidebar/BrainRightSidebarTypes";
import { SidebarProvider } from "@/hooks/useSidebarState";
import { useQuery } from "@tanstack/react-query";

const mockUseQuery = useQuery as jest.Mock;

describe("BrainRightSidebar", () => {
  const wave = { id: "1", wave: { type: "RANK" } } as any;
  const setActiveTab = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPrefersReducedMotion = false;
    mockUseQuery.mockReturnValue({
      data: wave,
      isError: false,
      refetch,
    });
    closeRightSidebar.mockClear();
  });

  const renderSidebar = (ui: React.ReactNode) =>
    render(<SidebarProvider>{ui}</SidebarProvider>);

  it("renders WaveContent with fetched wave data", () => {
    renderSidebar(
      <BrainRightSidebar
        isOpen={true}
        waveId="1"
        activeTab={SidebarTab.ABOUT}
        setActiveTab={setActiveTab}
      />
    );
    expect(WaveContentMock).toHaveBeenCalledWith(
      expect.objectContaining({
        wave,
        mode: Mode.CONTENT,
        activeTab: SidebarTab.ABOUT,
        setActiveTab,
      })
    );
    expect(screen.getByTestId("content")).toBeInTheDocument();
  });

  it("toggles collapsed state when button clicked", async () => {
    const user = userEvent.setup();
    renderSidebar(
      <BrainRightSidebar
        isOpen={true}
        waveId="1"
        activeTab={SidebarTab.ABOUT}
        setActiveTab={setActiveTab}
      />
    );
    await user.click(
      screen.getByRole("button", { name: /close wave details/i })
    );
    expect(closeRightSidebar).toHaveBeenCalledTimes(1);
  });

  it("renders a deliberate loading state while wave data is unavailable", () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isError: false,
      refetch,
    });
    renderSidebar(
      <BrainRightSidebar
        isOpen={true}
        waveId="1"
        activeTab={SidebarTab.ABOUT}
        setActiveTab={setActiveTab}
      />
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading wave details"
    );
    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
  });

  it("offers a retry when wave details fail to load", async () => {
    const user = userEvent.setup();
    mockUseQuery.mockReturnValue({
      data: undefined,
      isError: true,
      refetch,
    });
    renderSidebar(
      <BrainRightSidebar
        isOpen={true}
        waveId="1"
        activeTab={SidebarTab.ABOUT}
        setActiveTab={setActiveTab}
      />
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Wave details couldn't be loaded."
    );
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("keeps the inline panel mounted until its exit motion completes", async () => {
    const sidebar = (isOpen: boolean) => (
      <SidebarProvider>
        <BrainRightSidebar
          isOpen={isOpen}
          variant="inline"
          waveId="1"
          activeTab={SidebarTab.ABOUT}
          setActiveTab={setActiveTab}
        />
      </SidebarProvider>
    );
    const { rerender } = render(sidebar(true));

    const panel = screen.getByRole("complementary", {
      name: "Wave details",
    });
    rerender(sidebar(false));

    expect(screen.getByTestId("brain-right-sidebar-slot")).toHaveAttribute(
      "data-state",
      "closed"
    );
    expect(panel).toBeInTheDocument();
    await waitForElementToBeRemoved(panel);
  });

  it("removes the overlay panel and backdrop after exit motion completes", async () => {
    const sidebar = (isOpen: boolean) => (
      <SidebarProvider>
        <BrainRightSidebar
          isOpen={isOpen}
          variant="overlay"
          waveId="1"
          activeTab={SidebarTab.ABOUT}
          setActiveTab={setActiveTab}
        />
      </SidebarProvider>
    );
    const { rerender } = render(sidebar(true));

    const panel = screen.getByRole("dialog", { name: "Wave details" });
    expect(
      screen.getByTestId("brain-right-sidebar-backdrop")
    ).toBeInTheDocument();
    rerender(sidebar(false));

    await waitForElementToBeRemoved(panel);
    expect(
      screen.queryByTestId("brain-right-sidebar-backdrop")
    ).not.toBeInTheDocument();
  });

  it("does not steal focus from a nested portalled dialog", async () => {
    renderSidebar(
      <BrainRightSidebar
        isOpen={true}
        variant="overlay"
        waveId="1"
        activeTab={SidebarTab.ABOUT}
        setActiveTab={setActiveTab}
      />
    );

    const closeButton = screen.getByRole("button", {
      name: /close wave details/i,
    });
    await waitFor(() => expect(closeButton).toHaveFocus());

    const nestedDialog = document.createElement("div");
    nestedDialog.setAttribute("role", "dialog");
    const nestedDialogButton = document.createElement("button");
    nestedDialog.appendChild(nestedDialogButton);
    document.body.appendChild(nestedDialog);
    nestedDialogButton.focus();

    expect(nestedDialogButton).toHaveFocus();
    nestedDialog.remove();
  });

  it("redirects compact-menu focus restoration to the overlay", async () => {
    renderSidebar(
      <BrainRightSidebar
        isOpen={true}
        variant="overlay"
        waveId="1"
        activeTab={SidebarTab.ABOUT}
        setActiveTab={setActiveTab}
      />
    );

    const closeButton = screen.getByRole("button", {
      name: /close wave details/i,
    });
    await waitFor(() => expect(closeButton).toHaveFocus());

    const compactTrigger = document.createElement("button");
    compactTrigger.dataset["compactWaveActionsTrigger"] = "true";
    document.body.appendChild(compactTrigger);
    compactTrigger.focus();

    expect(closeButton).toHaveFocus();
    compactTrigger.remove();
  });

  it("removes the panel without movement when reduced motion is preferred", async () => {
    mockPrefersReducedMotion = true;
    const sidebar = (isOpen: boolean) => (
      <SidebarProvider>
        <BrainRightSidebar
          isOpen={isOpen}
          variant="inline"
          waveId="1"
          activeTab={SidebarTab.ABOUT}
          setActiveTab={setActiveTab}
        />
      </SidebarProvider>
    );
    const { rerender } = render(sidebar(true));

    rerender(sidebar(false));

    await waitFor(() => {
      expect(
        screen.queryByRole("complementary", { name: "Wave details" })
      ).not.toBeInTheDocument();
    });
  });
});
