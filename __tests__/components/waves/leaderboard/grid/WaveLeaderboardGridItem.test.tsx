import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { WaveLeaderboardGridItem } from "@/components/waves/leaderboard/grid/WaveLeaderboardGridItem";

const startDropOpen = jest.fn();
let markdownProps: any;
const toggleCuration = jest.fn();

jest.mock(
  "@/components/drops/view/item/content/media/MediaDisplay",
  () => () => <div data-testid="media" />
);

jest.mock(
  "@/components/waves/drops/WaveDropPartContentMarkdown",
  () => (props: any) => {
    markdownProps = props;
    return (
      <div data-testid="markdown">
        <a data-testid="markdown-link" href="https://example.com">
          external
        </a>
      </div>
    );
  }
);

jest.mock("@/components/waves/drops/winner/WinnerDropBadge", () => () => (
  <div data-testid="rank" />
));

jest.mock(
  "@/components/waves/leaderboard/gallery/WaveLeaderboardGalleryItemVotes",
  () => () => <div data-testid="votes" />
);

jest.mock("@/components/waves/drops/DropCurationButton", () => ({
  __esModule: true,
  default: () => <button data-testid="curate-action">Curate</button>,
}));

jest.mock("@/hooks/isMobileScreen", () => () => false);

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/useLongPressInteraction", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("@/hooks/drops/useDropInteractionRules", () => ({
  useDropInteractionRules: jest.fn(),
}));

jest.mock("@/hooks/drops/useDropCurationMutation", () => ({
  useDropCurationMutation: jest.fn(),
}));

jest.mock("@/components/voting", () => ({
  VotingModal: ({ isOpen }: any) =>
    isOpen ? <div data-testid="modal" /> : null,
  MobileVotingModal: ({ isOpen }: any) =>
    isOpen ? <div data-testid="mobile-modal" /> : null,
}));

jest.mock("@/components/voting/VotingModalButton", () => ({
  __esModule: true,
  default: ({ onClick }: any) => (
    <button data-testid="vote-button" onClick={onClick}>
      Vote
    </button>
  ),
}));

jest.mock("@/components/waves/drops/WaveDropActionsOpen", () => ({
  __esModule: true,
  default: () => <button data-testid="open-action">Open</button>,
}));

jest.mock("@/components/waves/drops/WaveDropMobileMenuOpen", () => ({
  __esModule: true,
  default: () => <button data-testid="mobile-open-action">Open drop</button>,
}));

jest.mock(
  "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper",
  () => ({
    __esModule: true,
    default: ({ isOpen, children }: any) =>
      isOpen ? <div data-testid="mobile-wrapper">{children}</div> : null,
  })
);

jest.mock("@/utils/monitoring/dropOpenTiming", () => ({
  startDropOpen: (...args: any[]) => startDropOpen(...args),
}));

const useDeviceInfo = require("@/hooks/useDeviceInfo").default as jest.Mock;
const useLongPressInteraction = require("@/hooks/useLongPressInteraction")
  .default as jest.Mock;
const useDropInteractionRules = require("@/hooks/drops/useDropInteractionRules")
  .useDropInteractionRules as jest.Mock;
const useDropCurationMutation = require("@/hooks/drops/useDropCurationMutation")
  .useDropCurationMutation as jest.Mock;

describe("WaveLeaderboardGridItem", () => {
  const baseDrop: any = {
    id: "d1",
    rank: 1,
    drop_type: "PARTICIPATORY",
    metadata: [],
    parts: [
      {
        media: [{ url: "media", mime_type: "image/jpeg" }],
        content: "hello",
      },
    ],
    wave: { id: "w1" },
    context_profile_context: { curatable: true, curated: false },
    mentioned_users: [],
    mentioned_waves: [],
    referenced_nfts: [],
    winning_context: { decision_time: null },
  };

  beforeEach(() => {
    markdownProps = undefined;
    toggleCuration.mockReset();
    useDeviceInfo.mockReturnValue({ hasTouchScreen: false });
    useLongPressInteraction.mockReturnValue({
      isActive: false,
      setIsActive: jest.fn(),
      touchHandlers: {},
    });
    useDropInteractionRules.mockReturnValue({ canShowVote: true });
    useDropCurationMutation.mockReturnValue({
      toggleCuration,
      isPending: false,
    });
  });

  it("renders compact footer with rank and votes", () => {
    render(
      <WaveLeaderboardGridItem
        drop={baseDrop}
        mode="compact"
        onDropClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("media")).toBeInTheDocument();
    expect(screen.getByTestId("markdown")).toBeInTheDocument();
    expect(screen.getByTestId("rank")).toBeInTheDocument();
    expect(screen.getByTestId("votes")).toBeInTheDocument();
    expect(screen.getByTestId("curate-action")).toBeInTheDocument();
    expect(screen.getByTestId("vote-button")).toBeInTheDocument();
    expect(markdownProps.marketplaceCompact).toBe(false);
    expect(
      screen.getByTestId("wave-leaderboard-grid-item-footer-d1")
    ).toBeInTheDocument();

    const card = screen.getByTestId("wave-leaderboard-grid-item-d1");
    const viewport = card.firstElementChild as HTMLElement;
    const content = viewport.firstElementChild as HTMLElement;
    expect(card).toHaveClass("tw-h-[26rem]");
    expect(card).toHaveClass("tw-p-3");
    expect(card).toHaveClass("tw-border");
    expect(card).toHaveClass("tw-bg-iron-950");
    expect(viewport).toHaveClass("tw-h-[15rem]");
    expect(viewport).toHaveClass("tw-p-3");
    expect(viewport).toHaveClass("tw-rounded-lg");
    expect(viewport).toHaveClass("tw-bg-iron-900/50");
    expect(content).toHaveClass("tw-space-y-3");
  });

  it("hides compact footer in content-only mode", () => {
    render(
      <WaveLeaderboardGridItem
        drop={baseDrop}
        mode="content_only"
        onDropClick={jest.fn()}
      />
    );

    expect(screen.queryByTestId("rank")).not.toBeInTheDocument();
    expect(screen.queryByTestId("votes")).not.toBeInTheDocument();
    expect(markdownProps.marketplaceCompact).toBe(true);
    expect(
      screen.queryByTestId("wave-leaderboard-grid-item-footer-d1")
    ).not.toBeInTheDocument();
    const contentOnlyActions = screen.getByTestId(
      "wave-leaderboard-grid-item-content-only-actions-d1"
    );
    expect(contentOnlyActions).toBeInTheDocument();
    expect(contentOnlyActions).toHaveClass("tw-z-0");
    expect(screen.getByTestId("open-action")).toBeInTheDocument();
    expect(screen.getByTestId("curate-action")).toBeInTheDocument();
    expect(screen.getByTestId("vote-button")).toBeInTheDocument();

    const card = screen.getByTestId("wave-leaderboard-grid-item-d1");
    const viewport = card.firstElementChild as HTMLElement;
    const content = viewport.firstElementChild as HTMLElement;
    expect(card).not.toHaveClass("tw-h-[26rem]");
    expect(card).not.toHaveClass("tw-h-[23rem]");
    expect(card).toHaveClass("tw-p-2");
    expect(card).not.toHaveClass("tw-p-0");
    expect(card).not.toHaveClass("tw-p-3");
    expect(card).toHaveClass("tw-border");
    expect(card).not.toHaveClass("tw-bg-iron-950");
    expect(viewport).toHaveClass("tw-max-h-[20rem]");
    expect(viewport).not.toHaveClass("tw-h-[20rem]");
    expect(viewport).not.toHaveClass("tw-p-2");
    expect(viewport).not.toHaveClass("tw-p-3");
    expect(viewport).not.toHaveClass("tw-rounded-lg");
    expect(viewport).not.toHaveClass("tw-bg-iron-900/50");
    expect(content).toHaveClass("tw-space-y-1");
    expect(content).not.toHaveClass("tw-space-y-3");
  });

  it("keeps marketplace-only card border while removing inner padding", () => {
    const marketplaceOnlyDrop = {
      ...baseDrop,
      parts: [
        {
          media: [],
          content:
            "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/1",
        },
      ],
    };

    render(
      <WaveLeaderboardGridItem
        drop={marketplaceOnlyDrop}
        mode="content_only"
        onDropClick={jest.fn()}
      />
    );

    const card = screen.getByTestId("wave-leaderboard-grid-item-d1");
    expect(card).toHaveClass("tw-p-0");
    expect(card).not.toHaveClass("tw-p-2");
    expect(card).toHaveClass("tw-border");
    expect(markdownProps.marketplaceCompact).toBe(true);
    expect(screen.queryByTestId("media")).not.toBeInTheDocument();
  });

  it("opens drop on click", () => {
    const onDropClick = jest.fn();

    render(
      <WaveLeaderboardGridItem
        drop={baseDrop}
        mode="compact"
        onDropClick={onDropClick}
      />
    );

    fireEvent.click(screen.getByTestId("wave-leaderboard-grid-item-d1"));
    expect(onDropClick).toHaveBeenCalledWith(baseDrop);
    expect(startDropOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        dropId: "d1",
        waveId: "w1",
        source: "leaderboard_grid",
      })
    );
  });

  it("does not open drop when clicking links or action buttons", () => {
    const onDropClick = jest.fn();

    render(
      <WaveLeaderboardGridItem
        drop={baseDrop}
        mode="content_only"
        onDropClick={onDropClick}
      />
    );

    fireEvent.click(screen.getByTestId("markdown-link"));
    fireEvent.click(screen.getByTestId("open-action"));
    fireEvent.click(screen.getByTestId("curate-action"));
    fireEvent.click(screen.getByTestId("vote-button"));

    expect(onDropClick).not.toHaveBeenCalled();
  });

  it("shows long-press action sheet on touch devices for content-only mode", () => {
    const setIsActive = jest.fn();
    useDeviceInfo.mockReturnValue({ hasTouchScreen: true });
    useLongPressInteraction.mockReturnValue({
      isActive: true,
      setIsActive,
      touchHandlers: {},
    });

    render(
      <WaveLeaderboardGridItem
        drop={baseDrop}
        mode="content_only"
        onDropClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("mobile-wrapper")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-open-action")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Curate drop" })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Curate drop" }));

    expect(toggleCuration).toHaveBeenCalledWith({
      dropId: "d1",
      waveId: "w1",
      isCuratable: true,
      isCurated: false,
    });
    expect(setIsActive).toHaveBeenCalledWith(false);

    fireEvent.click(screen.getByRole("button", { name: "Vote" }));
    expect(screen.getByTestId("modal")).toBeInTheDocument();
  });
});
