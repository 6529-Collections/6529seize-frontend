import { fireEvent, render, screen } from "@testing-library/react";
import MyStreamWaveTabsHeader from "@/components/brain/my-stream/tabs/MyStreamWaveTabsHeader";
import { MyStreamWaveTab } from "@/types/waves.types";
import type { ReactNode } from "react";

let mockIsRightSidebarOpen = false;
const mockToggleRightSidebar = jest.fn();
let mockConnectedProfile: { handle: string } | null = { handle: "alice" };
let mockActiveProfileProxy: { created_by: { handle: string } } | null = null;

jest.mock("next/navigation", () => ({
  usePathname: () => "/waves/wave-1",
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => ({
    toString: () => "divider=1",
  }),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: mockConnectedProfile,
    activeProfileProxy: mockActiveProfileProxy,
  }),
}));

jest.mock("@/contexts/wave/WaveChatScrollContext", () => ({
  useWaveChatScrollOptional: () => null,
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));

jest.mock("@/hooks/useSidebarState", () => ({
  useSidebarState: () => ({
    isRightSidebarOpen: mockIsRightSidebarOpen,
    toggleRightSidebar: mockToggleRightSidebar,
  }),
}));

jest.mock("@/hooks/waves/useWaveShareCopyAction", () => ({
  useWaveShareCopyAction: () => ({
    mode: "copy",
    label: "Copy wave link",
    feedbackState: "idle",
    onClick: jest.fn(),
  }),
}));

jest.mock("@/components/waves/WavePicture", () => () => (
  <span data-testid="wave-picture" />
));

jest.mock(
  "@/components/waves/drops/search/WaveDropsSearchModal",
  () =>
    ({ isOpen, onSearchAll }: { isOpen: boolean; onSearchAll?: () => void }) =>
      isOpen ? (
        <div data-testid="wave-drops-search-modal">
          <button type="button" onClick={onSearchAll}>
            Search all 6529
          </button>
        </div>
      ) : null
);

jest.mock("@/components/header/header-search/HeaderSearchModal", () => () => (
  <div data-testid="header-search-modal" />
));

jest.mock("@/components/waves/header/WaveDescriptionPopover", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

jest.mock("@/components/waves/WaveTrustSignals", () => ({
  WaveTrustSignals: () => <span data-testid="wave-score">Score 71</span>,
}));

jest.mock("@/components/brain/my-stream/MyStreamActionTooltip", () => () => (
  <div data-testid="my-stream-action-tooltip" />
));

jest.mock("@/components/waves/header/rep/WaveRepButton", () => () => (
  <button type="button">Add REP</button>
));

const wave = {
  id: "wave-1",
  name: "Follow The Repo",
  description: "Follow the merged PRs",
  picture: null,
  author: { handle: "repo-author" },
  contributors_overview: [],
  chat: { scope: { group: { is_direct_message: false } } },
  wave_score: { visibility_score: 71 },
  wave_rep: { total_rep: 10, authenticated_user_contribution: null },
} as any;

describe("MyStreamWaveTabsHeader", () => {
  beforeEach(() => {
    mockIsRightSidebarOpen = false;
    mockToggleRightSidebar.mockClear();
    mockConnectedProfile = { handle: "alice" };
    mockActiveProfileProxy = null;
  });

  it("can expand Wave search into the site-wide search", () => {
    render(
      <MyStreamWaveTabsHeader
        wave={wave}
        activeContentTab={MyStreamWaveTab.CHAT}
        setActiveContentTab={jest.fn()}
        onSelectCuration={jest.fn()}
        isCompact={false}
        showBackButton={false}
        headerActionsTooltipId="header-actions"
        headerClassName="tw-flex"
        actionsClassName="tw-flex"
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Search messages in this wave" })
    );
    expect(screen.getByTestId("wave-drops-search-modal")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Search all 6529" }));
    expect(screen.queryByTestId("wave-drops-search-modal")).toBeNull();
    expect(screen.getByTestId("header-search-modal")).toBeInTheDocument();
  });

  it("keeps the score in the identity and REP beside the header icon buttons", () => {
    render(
      <MyStreamWaveTabsHeader
        wave={wave}
        activeContentTab={MyStreamWaveTab.CHAT}
        setActiveContentTab={jest.fn()}
        onSelectCuration={jest.fn()}
        isCompact={false}
        showBackButton={false}
        headerActionsTooltipId="header-actions"
        headerClassName="tw-flex"
        actionsClassName="tw-flex"
      />
    );

    expect(screen.getByTestId("wave-score")).toBeInTheDocument();
    const repButton = screen.getByRole("button", { name: "Add REP" });
    const searchButton = screen.getByRole("button", {
      name: "Search messages in this wave",
    });
    expect(repButton.parentElement).toBe(searchButton.parentElement);
    expect(repButton.nextElementSibling).toBe(searchButton);
    expect(screen.queryByRole("button", { name: "Copy wave link" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "Show right sidebar" }).textContent
    ).toBe("");
  });

  it("keeps the primary action first and places supplemental actions after REP", () => {
    render(
      <MyStreamWaveTabsHeader
        wave={wave}
        activeContentTab={MyStreamWaveTab.CHAT}
        setActiveContentTab={jest.fn()}
        onSelectCuration={jest.fn()}
        isCompact={false}
        showBackButton={false}
        headerActionsTooltipId="header-actions"
        headerClassName="tw-flex"
        actionsClassName="tw-flex"
        renderLeadingActions={() => (
          <button type="button" aria-label="Submit drop">
            Drop
          </button>
        )}
        renderTrailingActions={() => (
          <button type="button" aria-label="Switch to gallery view">
            Gallery
          </button>
        )}
      />
    );

    const dropButton = screen.getByRole("button", { name: "Submit drop" });
    const repButton = screen.getByRole("button", { name: "Add REP" });
    const galleryButton = screen.getByRole("button", {
      name: "Switch to gallery view",
    });

    expect(dropButton.parentElement?.firstElementChild).toBe(dropButton);
    expect(dropButton.nextElementSibling).toBe(repButton);
    expect(repButton.nextElementSibling).toBe(galleryButton);
  });

  it.each(["logged out", "author", "proxy", "DM"])(
    "hides header REP for a %s session or wave",
    (state) => {
      if (state === "logged out") mockConnectedProfile = null;
      if (state === "author") mockConnectedProfile = { handle: "REPO-AUTHOR" };
      if (state === "proxy") {
        mockActiveProfileProxy = { created_by: { handle: "alice" } };
      }
      render(
        <MyStreamWaveTabsHeader
          wave={{
            ...wave,
            chat: { scope: { group: { is_direct_message: state === "DM" } } },
          }}
          activeContentTab={MyStreamWaveTab.CHAT}
          setActiveContentTab={jest.fn()}
          onSelectCuration={jest.fn()}
          isCompact={false}
          showBackButton={false}
          headerActionsTooltipId="header-actions"
          headerClassName="tw-flex"
          actionsClassName="tw-flex"
        />
      );
      expect(screen.queryByRole("button", { name: "Add REP" })).toBeNull();
    }
  );

  it("shows a linked parent wave above a subwave title", () => {
    render(
      <MyStreamWaveTabsHeader
        wave={{
          ...wave,
          id: "child-wave",
          name: "CI-PRODUCTION",
          parent_wave: {
            id: "parent-wave",
            name: "Follow The Repo",
          },
        }}
        activeContentTab={MyStreamWaveTab.CHAT}
        setActiveContentTab={jest.fn()}
        onSelectCuration={jest.fn()}
        isCompact={false}
        showBackButton={false}
        headerActionsTooltipId="header-actions"
        headerClassName="tw-flex"
        actionsClassName="tw-flex"
      />
    );

    expect(
      screen.getByRole("navigation", { name: "Wave hierarchy" })
    ).toHaveTextContent(/Subwave of\s*Follow The Repo/);
    const parentLink = screen.getByRole("link", {
      name: "Subwave of Follow The Repo",
    });
    expect(parentLink).toHaveAttribute(
      "title",
      "Open parent wave: Follow The Repo"
    );
    expect(parentLink).toHaveAttribute("href", "/waves/parent-wave");
  });

  it("hides score actions in the compact mobile header", () => {
    render(
      <MyStreamWaveTabsHeader
        wave={wave}
        activeContentTab={MyStreamWaveTab.CHAT}
        setActiveContentTab={jest.fn()}
        onSelectCuration={jest.fn()}
        isCompact={true}
        showBackButton={false}
        headerActionsTooltipId="header-actions"
        headerClassName="tw-flex"
        actionsClassName="tw-flex"
      />
    );

    expect(screen.queryByTestId("wave-score")).toBeNull();
    expect(screen.queryByText("Add REP")).toBeNull();
  });

  it("exposes the right-sidebar toggle state and controlled panel", () => {
    const header = () => (
      <MyStreamWaveTabsHeader
        wave={wave}
        activeContentTab={MyStreamWaveTab.CHAT}
        setActiveContentTab={jest.fn()}
        onSelectCuration={jest.fn()}
        isCompact={false}
        showBackButton={false}
        headerActionsTooltipId="header-actions"
        headerClassName="tw-flex"
        actionsClassName="tw-flex"
      />
    );
    const { rerender } = render(header());

    const closedToggle = screen.getByRole("button", {
      name: "Show right sidebar",
    });
    expect(closedToggle).toHaveAttribute("aria-expanded", "false");
    expect(closedToggle).toHaveAttribute("aria-pressed", "false");
    expect(closedToggle).not.toHaveAttribute("aria-controls");
    fireEvent.click(closedToggle);
    expect(mockToggleRightSidebar).toHaveBeenCalledTimes(1);

    mockIsRightSidebarOpen = true;
    rerender(header());

    const openToggle = screen.getByRole("button", {
      name: "Hide right sidebar",
    });
    expect(openToggle).toHaveAttribute("aria-expanded", "true");
    expect(openToggle).toHaveAttribute("aria-pressed", "true");
    expect(openToggle).toHaveAttribute("aria-controls", "brain-right-sidebar");
  });
});
