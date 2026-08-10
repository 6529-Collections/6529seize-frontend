import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { WaveLeaderboardGridItem } from "@/components/waves/leaderboard/grid/WaveLeaderboardGridItem";
import { MemesSubmissionAdditionalInfoKey } from "@/components/waves/memes/submission/types/OperationalData";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import { ApiWaveParticipationSubmissionStrategyType } from "@/generated/models/ApiWaveParticipationSubmissionStrategyType";

const startDropOpen = jest.fn();
const markdownRenderer = jest.fn();

jest.mock("@/components/ipfs/IPFSContext", () => ({
  resolveIpfsUrlSync: (url: string) => url,
}));

jest.mock(
  "@/components/drops/view/item/content/media/MediaDisplay",
  () => (props: any) => (
    <div
      data-testid="media"
      data-media-url={props.media_url}
      data-media-mime-type={props.media_mime_type}
      data-preview-image-url={props.previewImageUrl ?? ""}
    />
  )
);

jest.mock(
  "@/components/waves/drops/WaveDropPartContentMarkdown",
  () => (props: any) => {
    markdownRenderer(props);
    return <div data-testid="markdown" />;
  }
);

jest.mock("@/components/waves/drops/winner/WinnerDropBadge", () => () => (
  <div data-testid="rank" />
));

jest.mock(
  "@/components/waves/drops/participation/ratings/ParticipationDropVoteDetailsTrigger",
  () => () => <button data-testid="voters">Voters</button>
);

jest.mock(
  "@/components/waves/leaderboard/identity/WaveLeaderboardIdentity",
  () => ({
    WaveLeaderboardIdentity: ({ drop, variant }: any) =>
      drop.wave?.submission_type === "IDENTITY" ? (
        <div data-testid="identity" data-variant={variant} />
      ) : null,
  })
);

jest.mock("@/hooks/isMobileScreen", () => () => false);
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/hooks/waves/useApprovalDropStatus", () => ({
  useApprovalDropStatus: () => ({ kind: "needs", remaining: 7 }),
}));

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

jest.mock("@/components/voting", () => ({
  VotingModal: ({ isOpen }: any) =>
    isOpen ? <div data-testid="modal" /> : null,
  MobileVotingModal: ({ isOpen }: any) =>
    isOpen ? <div data-testid="mobile-modal" /> : null,
}));

jest.mock("@/components/voting/VotingModalButton", () => ({
  __esModule: true,
  default: ({ onClick, children, className }: any) => (
    <button data-testid="vote-button" className={className} onClick={onClick}>
      {children ?? "Vote"}
    </button>
  ),
}));

jest.mock("@/components/waves/drops/WaveDropMobileMenuOpen", () => ({
  __esModule: true,
  default: () => <button data-testid="mobile-open-action">Open drop</button>,
}));
jest.mock("@/components/waves/drops/WaveDropMobileMenuCopyLink", () => ({
  __esModule: true,
  default: () => <button data-testid="mobile-copy-action">Copy link</button>,
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

describe("WaveLeaderboardGridItem", () => {
  const baseDrop: any = {
    id: "d1",
    rank: 1,
    title: "Example title",
    drop_type: ApiDropType.Participatory,
    rating: 45,
    realtime_rating: 48,
    rating_prediction: 51,
    raters_count: 4,
    metadata: [],
    parts: [
      {
        media: [{ url: "media", mime_type: "image/jpeg" }],
        content: "Example title\n\nA concise description.",
      },
    ],
    wave: {
      id: "w1",
      voting_credit_type: ApiWaveCreditType.Tdh,
      submission_type: null,
    },
    author: { id: "alice-id", handle: "alice" },
    context_profile_context: {
      curatable: true,
      curated: false,
      rating: 3,
    },
    mentioned_users: [],
    mentioned_waves: [],
    referenced_nfts: [],
    winning_context: { decision_time: null },
  };
  const previewMetadata = [
    {
      data_key: MemesSubmissionAdditionalInfoKey.ADDITIONAL_MEDIA,
      data_value: JSON.stringify({
        preview_image: "https://example.com/preview.jpg",
      }),
    },
  ];

  beforeEach(() => {
    markdownRenderer.mockReset();
    startDropOpen.mockReset();
    useDeviceInfo.mockReturnValue({ hasTouchScreen: false });
    useLongPressInteraction.mockReturnValue({
      isActive: false,
      setIsActive: jest.fn(),
      touchHandlers: {},
    });
    useDropInteractionRules.mockReturnValue({ canShowVote: true });
  });

  it("keeps the existing square media frame and renders a scannable footer", () => {
    render(
      <WaveLeaderboardGridItem
        drop={baseDrop}
        mode="compact"
        onDropClick={jest.fn()}
      />
    );

    const mediaWrapper = screen.getByTestId("media")
      .parentElement as HTMLElement;
    expect(mediaWrapper).toHaveClass("tw-aspect-square");
    expect(mediaWrapper).toHaveClass("tw-min-h-[14rem]");
    expect(mediaWrapper).toHaveClass("md:tw-min-h-[15rem]");
    expect(mediaWrapper).not.toHaveClass("tw-aspect-[16/9]");

    expect(screen.queryByTestId("markdown")).not.toBeInTheDocument();
    expect(markdownRenderer).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Example title" })
    ).toBeInTheDocument();
    expect(screen.getByText("Current")).toBeInTheDocument();
    expect(screen.getByText("Projected")).toBeInTheDocument();
    expect(screen.getByText("Your vote")).toBeInTheDocument();
    expect(screen.getByTestId("rank")).toBeInTheDocument();
    expect(screen.getByTestId("voters")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open Example title" })
    ).toBeInTheDocument();

    const card = screen.getByTestId("wave-leaderboard-grid-item-d1");
    expect(card.tagName).toBe("ARTICLE");
    expect(card).toHaveClass("tw-flex", "tw-h-full", "tw-flex-col");
    expect(card).not.toHaveAttribute("role", "button");
    expect(card).not.toHaveAttribute("tabindex");
  });

  it("opens only from the explicit Open action", () => {
    const onDropClick = jest.fn();
    render(
      <WaveLeaderboardGridItem
        drop={baseDrop}
        mode="compact"
        onDropClick={onDropClick}
      />
    );

    fireEvent.click(screen.getByTestId("wave-leaderboard-grid-item-d1"));
    expect(onDropClick).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Open Example title" }));
    expect(onDropClick).toHaveBeenCalledWith(baseDrop);
    expect(startDropOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        dropId: "d1",
        waveId: "w1",
        source: "leaderboard_grid",
      })
    );
  });

  it("renders a bounded plain-text preview when media is unavailable", () => {
    render(
      <WaveLeaderboardGridItem
        drop={{
          ...baseDrop,
          parts: [
            {
              media: [],
              content:
                "Example title — **Bold** [linked words](https://example.com) remain readable.",
            },
          ],
        }}
        mode="compact"
        onDropClick={jest.fn()}
      />
    );

    expect(screen.queryByTestId("media")).not.toBeInTheDocument();
    expect(screen.queryByTestId("markdown")).not.toBeInTheDocument();
    expect(screen.getByText("Bold linked words remain readable.")).toHaveClass(
      "tw-line-clamp-8"
    );
    expect(screen.getAllByText("Example title")).toHaveLength(1);
  });

  it("truncates long text previews at a word boundary", () => {
    render(
      <WaveLeaderboardGridItem
        drop={{
          ...baseDrop,
          parts: [
            {
              media: [],
              content: Array.from({ length: 100 }, () => "readable").join(" "),
            },
          ],
        }}
        mode="compact"
        onDropClick={jest.fn()}
      />
    );

    const preview = screen.getByText(/readable…$/);
    expect(preview).toHaveClass("tw-line-clamp-8");
    expect(preview.textContent?.length).toBeLessThanOrEqual(321);
  });

  it("does not treat preview-only metadata as submitted media", () => {
    render(
      <WaveLeaderboardGridItem
        drop={{
          ...baseDrop,
          metadata: previewMetadata,
          parts: [{ media: [], content: "hello" }],
        }}
        mode="content_only"
        onDropClick={jest.fn()}
      />
    );

    expect(screen.queryByTestId("media")).not.toBeInTheDocument();
    expect(screen.getByText("hello")).toBeInTheDocument();
  });

  it("passes preview image metadata to non-image media", () => {
    render(
      <WaveLeaderboardGridItem
        drop={{
          ...baseDrop,
          metadata: previewMetadata,
          parts: [
            {
              media: [{ url: "video.mp4", mime_type: "video/mp4" }],
              content: "hello",
            },
          ],
        }}
        mode="compact"
        onDropClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("media")).toHaveAttribute(
      "data-preview-image-url",
      "https://example.com/preview.jpg"
    );
  });

  it("keeps one consistent Open action when media has no body text", () => {
    render(
      <WaveLeaderboardGridItem
        drop={{
          ...baseDrop,
          parts: [
            {
              media: [{ url: "media", mime_type: "image/jpeg" }],
              content: "",
            },
          ],
        }}
        mode="compact"
        onDropClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("media")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open Example title" })
    ).toHaveClass("tw-min-h-11");
    expect(
      screen.queryByRole("button", { name: "Read full text" })
    ).not.toBeInTheDocument();
  });

  it("uses the same square preview frame for content-only text drops", () => {
    render(
      <WaveLeaderboardGridItem
        drop={{
          ...baseDrop,
          parts: [{ media: [], content: "Text-led submission" }],
        }}
        mode="content_only"
        onDropClick={jest.fn()}
      />
    );

    const preview = screen.getByText("Text-led submission").parentElement
      ?.parentElement as HTMLElement;
    expect(preview).toHaveClass(
      "tw-aspect-square",
      "tw-min-h-[14rem]",
      "md:tw-min-h-[15rem]"
    );
  });

  it("removes markdown links from the preview tab order", () => {
    render(
      <WaveLeaderboardGridItem
        drop={{
          ...baseDrop,
          parts: [
            {
              media: [],
              content: "Read [CAIP-19](https://example.com/caip-19) next.",
            },
          ],
        }}
        mode="compact"
        onDropClick={jest.fn()}
      />
    );

    expect(screen.getByText("Read CAIP-19 next.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "CAIP-19" })).toBeNull();
    expect(markdownRenderer).not.toHaveBeenCalled();
  });

  it("keeps negative metric values on one line and visually distinct", () => {
    render(
      <WaveLeaderboardGridItem
        drop={{
          ...baseDrop,
          rating: -2_107_196,
          rating_prediction: -2_000_000,
          context_profile_context: {
            ...baseDrop.context_profile_context,
            rating: -12,
          },
        }}
        mode="compact"
        onDropClick={jest.fn()}
      />
    );

    const currentValue = screen
      .getByTestId("wave-leaderboard-grid-metric-current")
      .querySelector("dd span");
    const userValue = screen
      .getByTestId("wave-leaderboard-grid-metric-your-vote")
      .querySelector("dd span");
    expect(currentValue).toHaveClass(
      "tw-whitespace-nowrap",
      "tw-text-rose-400"
    );
    expect(userValue).toHaveClass("tw-whitespace-nowrap", "tw-text-rose-400");
    expect(currentValue).toHaveTextContent("-2,107,196");
    expect(userValue).toHaveTextContent("-12");
  });

  it("shows labeled approval metrics and status", () => {
    render(
      <WaveLeaderboardGridItem
        drop={baseDrop}
        mode="compact"
        winningThreshold={52}
        winningThresholdMinDurationMs={120_000}
        onDropClick={jest.fn()}
      />
    );

    expect(screen.getByText("Reached")).toBeInTheDocument();
    expect(screen.getByText("Required")).toBeInTheDocument();
    expect(screen.getByText("Votes now")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Needs 7 TDH")).toBeInTheDocument();
  });

  it("uses the same footer shell without rank metrics in content-only mode", () => {
    render(
      <WaveLeaderboardGridItem
        drop={baseDrop}
        mode="content_only"
        onDropClick={jest.fn()}
      />
    );

    expect(
      screen.getByTestId("wave-leaderboard-grid-item-footer-d1")
    ).toBeInTheDocument();
    expect(screen.queryByTestId("rank")).not.toBeInTheDocument();
    expect(screen.queryByText("Projected")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open Example title" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("vote-button")).toHaveClass("tw-min-h-11");
  });

  it("does not open the drop from the Vote action", () => {
    const onDropClick = jest.fn();
    render(
      <WaveLeaderboardGridItem
        drop={baseDrop}
        mode="compact"
        onDropClick={onDropClick}
      />
    );

    fireEvent.click(screen.getByTestId("vote-button"));
    expect(onDropClick).not.toHaveBeenCalled();
    expect(screen.getByTestId("modal")).toBeInTheDocument();
  });

  it("hides voting actions and closes the modal when voting becomes locked", () => {
    const { rerender } = render(
      <WaveLeaderboardGridItem
        drop={baseDrop}
        mode="compact"
        onDropClick={jest.fn()}
      />
    );

    fireEvent.click(screen.getByTestId("vote-button"));
    expect(screen.getByTestId("modal")).toBeInTheDocument();

    rerender(
      <WaveLeaderboardGridItem
        drop={baseDrop}
        mode="compact"
        isVotingControlsLocked={true}
        onDropClick={jest.fn()}
      />
    );
    expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
    expect(screen.queryByTestId("vote-button")).not.toBeInTheDocument();
  });

  it("hides the Vote action when voting is closed", () => {
    render(
      <WaveLeaderboardGridItem
        drop={baseDrop}
        mode="compact"
        isVotingClosed={true}
        onDropClick={jest.fn()}
      />
    );

    expect(screen.queryByTestId("vote-button")).toBeNull();
    expect(
      screen.getByRole("button", { name: "Open Example title" })
    ).toBeInTheDocument();
  });

  it("closes an open voting modal when voting closes", () => {
    const { rerender } = render(
      <WaveLeaderboardGridItem
        drop={baseDrop}
        mode="compact"
        onDropClick={jest.fn()}
      />
    );
    fireEvent.click(screen.getByTestId("vote-button"));
    expect(screen.getByTestId("modal")).toBeInTheDocument();

    rerender(
      <WaveLeaderboardGridItem
        drop={baseDrop}
        mode="compact"
        isVotingClosed={true}
        onDropClick={jest.fn()}
      />
    );
    expect(screen.queryByTestId("modal")).toBeNull();
  });

  it("keeps vote summaries visible while voting controls are locked", () => {
    render(
      <WaveLeaderboardGridItem
        drop={baseDrop}
        mode="compact"
        isVotingControlsLocked={true}
        onDropClick={jest.fn()}
      />
    );

    expect(screen.getByText("Current")).toBeInTheDocument();
    expect(screen.getByText("Projected")).toBeInTheDocument();
    expect(screen.queryByTestId("vote-button")).toBeNull();
  });

  it("renders marketplace-only submissions as plain preview text", () => {
    const marketplaceUrl =
      "https://opensea.io/item/ethereum/0x495f947276749ce646f68ac8c248420045cb7b5e/1";
    render(
      <WaveLeaderboardGridItem
        drop={{
          ...baseDrop,
          parts: [{ media: [], content: marketplaceUrl }],
        }}
        mode="content_only"
        onDropClick={jest.fn()}
      />
    );

    expect(screen.getByText(marketplaceUrl)).toHaveClass("tw-line-clamp-8");
    expect(screen.queryByTestId("media")).toBeNull();
    expect(screen.queryByRole("link", { name: marketplaceUrl })).toBeNull();
  });

  it("does not show desktop Open or Vote actions for copy-only chat drops", () => {
    useDropInteractionRules.mockReturnValue({ canShowVote: false });

    render(
      <WaveLeaderboardGridItem
        drop={{ ...baseDrop, drop_type: ApiDropType.Chat }}
        mode="content_only"
        onDropClick={jest.fn()}
      />
    );

    expect(screen.queryByText("Open", { selector: "button" })).toBeNull();
    expect(screen.queryByTestId("vote-button")).toBeNull();
    expect(screen.queryByTestId("mobile-copy-action")).toBeNull();
  });

  it("renders the established identity variants", () => {
    const identityDrop = {
      ...baseDrop,
      wave: {
        ...baseDrop.wave,
        submission_type: ApiWaveParticipationSubmissionStrategyType.Identity,
      },
    };
    const { rerender } = render(
      <WaveLeaderboardGridItem
        drop={identityDrop}
        mode="compact"
        onDropClick={jest.fn()}
      />
    );
    expect(screen.getByTestId("identity")).toHaveAttribute(
      "data-variant",
      "condensed"
    );

    rerender(
      <WaveLeaderboardGridItem
        drop={identityDrop}
        mode="content_only"
        onDropClick={jest.fn()}
      />
    );
    expect(screen.getByTestId("identity")).toHaveAttribute(
      "data-variant",
      "responsive"
    );
  });

  it("preserves the touch long-press action sheet", () => {
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
    expect(screen.getByTestId("mobile-copy-action")).toBeInTheDocument();

    const mobileVote = screen
      .getByTestId("mobile-wrapper")
      .querySelector("button:last-child") as HTMLButtonElement;
    fireEvent.click(mobileVote);
    expect(setIsActive).toHaveBeenCalledWith(false);
  });

  it("keeps copy as the only touch action for chat drops", () => {
    useDeviceInfo.mockReturnValue({ hasTouchScreen: true });
    useLongPressInteraction.mockReturnValue({
      isActive: true,
      setIsActive: jest.fn(),
      touchHandlers: {},
    });
    useDropInteractionRules.mockReturnValue({ canShowVote: false });

    render(
      <WaveLeaderboardGridItem
        drop={{ ...baseDrop, drop_type: ApiDropType.Chat }}
        mode="content_only"
        onDropClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("mobile-copy-action")).toBeInTheDocument();
    expect(screen.queryByTestId("mobile-open-action")).not.toBeInTheDocument();
    expect(screen.queryByTestId("vote-button")).not.toBeInTheDocument();
  });
});
