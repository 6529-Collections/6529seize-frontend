import { fireEvent, render, screen } from "@testing-library/react";
import MyStreamWaveTabsHeader from "@/components/brain/my-stream/tabs/MyStreamWaveTabsHeader";
import { MyStreamWaveTab } from "@/types/waves.types";
import type { ReactNode } from "react";

jest.mock("next/navigation", () => ({
  usePathname: () => "/waves/wave-1",
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => ({
    toString: () => "divider=1",
  }),
}));

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: { handle: "alice" },
    activeProfileProxy: null,
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
    isRightSidebarOpen: false,
    toggleRightSidebar: jest.fn(),
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

  it("offsets the score actions row so the score icon aligns with the title", () => {
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

    const scoreActions = screen.getByText("Add REP").parentElement;

    expect(scoreActions).toHaveClass("-tw-ml-1.5");
    expect(scoreActions).toHaveClass("tw-mt-1");
  });

  it("keeps the compact mobile header to score only", () => {
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

    expect(screen.getByTestId("wave-score")).toBeInTheDocument();
    expect(screen.queryByText("Add REP")).toBeNull();
  });
});
