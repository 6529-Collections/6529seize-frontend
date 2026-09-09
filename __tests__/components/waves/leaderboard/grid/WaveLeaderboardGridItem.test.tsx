import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { WaveLeaderboardGridItem } from "@/components/waves/leaderboard/grid/WaveLeaderboardGridItem";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { ApiWaveParticipationSubmissionStrategyType } from "@/generated/models/ApiWaveParticipationSubmissionStrategyType";
import { MemesSubmissionAdditionalInfoKey } from "@/components/waves/memes/submission/types/OperationalData";

const startDropOpen = jest.fn();
let markdownProps: any;

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
  () => (props: any) => (
    <div
      data-testid="votes"
      data-winning-threshold={props.winningThreshold ?? ""}
      data-winning-threshold-min-duration={
        props.winningThresholdMinDurationMs ?? ""
      }
      data-is-voting-closed={String(props.isVotingClosed)}
    />
  )
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
  default: ({ onClick, className }: any) => (
    <button
      data-testid="vote-button"
      data-class-name={className}
      onClick={onClick}
    >
      Vote
    </button>
  ),
}));

jest.mock("@/components/waves/drops/WaveDropActionsOpen", () => ({
  __esModule: true,
  default: () => <button data-testid="desktop-open-action">Open drop</button>,
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
    drop_type: "PARTICIPATORY",
    metadata: [],
    parts: [
      {
        media: [{ url: "media", mime_type: "image/jpeg" }],
        content: "hello",
      },
    ],
    wave: {
      id: "w1",
      voting_credit_type: "NIC",
      submission_type: null,
    },
    author: { handle: "alice" },
    context_profile_context: { curatable: true, curated: false },
    raters_count: 7,
    rating: 10,
    rating_prediction: 10,
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
    markdownProps = undefined;
    startDropOpen.mockReset();
    useDeviceInfo.mockReturnValue({ hasTouchScreen: false });
    useLongPressInteraction.mockReturnValue({
      isActive: false,
      setIsActive: jest.fn(),
      touchHandlers: {},
    });
    useDropInteractionRules.mockReturnValue({ canShowVote: true });
  });

  it("renders a bounded summary and preserves compact footer controls", () => {
    render(
      <WaveLeaderboardGridItem
        drop={baseDrop}
        mode="compact"
        onDropClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("media")).toBeInTheDocument();
    const mediaWrapper = screen.getByTestId("media")
      .parentElement as HTMLElement;
    expect(mediaWrapper).toHaveClass("tw-aspect-square");
    expect(mediaWrapper).not.toHaveClass("tw-aspect-[16/9]");
    expect(mediaWrapper).toHaveClass("tw-flex");
    expect(mediaWrapper).toHaveClass("tw-items-center");
    expect(mediaWrapper).toHaveClass("tw-justify-center");
    expect(mediaWrapper).toHaveClass("tw-min-h-[14rem]");
    expect(mediaWrapper).toHaveClass("md:tw-min-h-[15rem]");
    expect(screen.queryByTestId("markdown")).not.toBeInTheDocument();
    expect(markdownProps).toBeUndefined();
    expect(screen.getByRole("heading", { name: "hello" })).toHaveClass(
      "tw-text-sm",
      "tw-text-iron-100"
    );
    expect(screen.getByText("Read full")).toHaveClass(
      "tw-text-xs",
      "tw-text-primary-400",
      "tw-min-h-11"
    );
    expect(screen.getByTestId("rank")).toBeInTheDocument();
    expect(screen.getByTestId("votes")).toBeInTheDocument();
    const voteButton = screen.getByTestId("vote-button");
    expect(voteButton).toBeInTheDocument();
    expect(voteButton).toHaveAttribute(
      "data-class-name",
      expect.stringContaining("tw-self-center")
    );
    expect(voteButton.parentElement).toHaveClass(
      "tw-items-center",
      "tw-self-center",
      "tw-flex-none"
    );
    expect(screen.getByLabelText("7 voters")).toBeInTheDocument();
    const footer = screen.getByTestId("wave-leaderboard-grid-item-footer-d1");
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass("tw-px-3");
    expect(footer).toHaveClass("tw-pt-1");
    expect(footer).toHaveClass("tw-pb-3");
    expect(footer.firstElementChild).toHaveClass("tw-mb-1");

    const card = screen.getByTestId("wave-leaderboard-grid-item-d1");
    const viewport = card.firstElementChild as HTMLElement;
    expect(card).toHaveClass("tw-p-0");
    expect(card).toHaveClass("tw-border");
    expect(card).toHaveClass("tw-bg-iron-950");
    expect(card).not.toHaveAttribute("role", "button");
    expect(card).not.toHaveAttribute("tabindex");
    expect(viewport).toHaveClass("tw-bg-iron-950");
  });

  it("opens compact media text through the read action", () => {
    const onDropClick = jest.fn();

    render(
      <WaveLeaderboardGridItem
        drop={baseDrop}
        mode="compact"
        onDropClick={onDropClick}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Open hello" }));

    expect(onDropClick).toHaveBeenCalledTimes(1);
    expect(onDropClick).toHaveBeenCalledWith(baseDrop);
    expect(startDropOpen).toHaveBeenCalledTimes(1);
    expect(startDropOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        dropId: "d1",
        waveId: "w1",
        source: "leaderboard_grid",
      })
    );
  });

  it("shows a plain open action for compact media cards without text", () => {
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

    expect(screen.queryByText("Read full text")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open Untitled drop" })
    ).toHaveTextContent("Open");
  });

  it("separates the brighter title from the quieter plain-text description", () => {
    render(
      <WaveLeaderboardGridItem
        drop={{
          ...baseDrop,
          title: "Bright title",
          parts: [
            {
              media: [],
              content:
                "**Bright title**\n\nDescription with [external text](https://example.com/path_(hidden)).",
            },
          ],
        }}
        mode="compact"
        onDropClick={jest.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: "Bright title" })).toHaveClass(
      "tw-text-iron-100",
      "tw-text-sm",
      "tw-font-semibold"
    );
    expect(screen.getByText("Description with external text.")).toHaveClass(
      "tw-text-iron-400",
      "tw-text-xs",
      "tw-line-clamp-6"
    );
    expect(screen.queryByRole("link", { name: "external text" })).toBeNull();
    expect(screen.getByRole("article")).not.toHaveTextContent(
      "example.com/path_(hidden)"
    );
    expect(screen.getAllByText("Bright title")).toHaveLength(1);
  });

  it("removes a case-insensitive non-ASCII title without clipping content", () => {
    render(
      <WaveLeaderboardGridItem
        drop={{
          ...baseDrop,
          title: "İSTANBUL",
          parts: [
            {
              media: [],
              content: "istanbul — Description remains intact.",
            },
          ],
        }}
        mode="compact"
        onDropClick={jest.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: "İSTANBUL" })).toBeVisible();
    expect(screen.getByText("Description remains intact.")).toBeVisible();
  });

  it("removes a canonically equivalent title by its normalized length", () => {
    render(
      <WaveLeaderboardGridItem
        drop={{
          ...baseDrop,
          title: "CAFÉ",
          parts: [
            {
              media: [],
              content: "cafe\u0301 — Decomposed title remains intact.",
            },
          ],
        }}
        mode="compact"
        onDropClick={jest.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: "CAFÉ" })).toBeVisible();
    expect(screen.getByText("Decomposed title remains intact.")).toBeVisible();
  });

  it("does not open compact drops from footer vote action", () => {
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
    expect(startDropOpen).not.toHaveBeenCalled();
  });

  it("keeps the current user's vote separate from the total and voter count", () => {
    render(
      <WaveLeaderboardGridItem
        drop={{
          ...baseDrop,
          context_profile_context: {
            ...baseDrop.context_profile_context,
            rating: -4,
          },
        }}
        mode="compact"
        onDropClick={jest.fn()}
      />
    );

    expect(screen.getByText("You:")).toBeInTheDocument();
    expect(screen.getByText("-4")).toHaveClass(
      "tw-font-mono",
      "tw-text-rose-400"
    );
    expect(screen.getByText("NIC")).toHaveClass("tw-text-rose-400");
    expect(screen.getByText("NIC")).not.toHaveClass("tw-font-mono");
    expect(screen.getByLabelText("7 voters")).toBeInTheDocument();
  });

  it("hides vote actions when voting is closed", () => {
    render(
      <WaveLeaderboardGridItem
        drop={baseDrop}
        mode="compact"
        onDropClick={jest.fn()}
        isVotingClosed={true}
      />
    );

    expect(screen.queryByTestId("vote-button")).toBeNull();
  });

  it("closes voting modal when voting closes", () => {
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
        onDropClick={jest.fn()}
        isVotingClosed={true}
      />
    );

    expect(screen.queryByTestId("modal")).toBeNull();
    expect(screen.queryByTestId("vote-button")).toBeNull();
  });

  it("hides vote action while controls are locked without passing closed state to votes", () => {
    render(
      <WaveLeaderboardGridItem
        drop={baseDrop}
        mode="compact"
        onDropClick={jest.fn()}
        winningThreshold={12}
        isVotingClosed={false}
        isVotingControlsLocked={true}
      />
    );

    expect(screen.queryByTestId("vote-button")).toBeNull();
    expect(screen.getByTestId("votes")).toHaveAttribute(
      "data-winning-threshold",
      "12"
    );
    expect(screen.getByTestId("votes")).toHaveAttribute(
      "data-is-voting-closed",
      "false"
    );
  });

  it("closes voting modal when controls become locked", () => {
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
        onDropClick={jest.fn()}
        isVotingControlsLocked={true}
      />
    );

    expect(screen.queryByTestId("modal")).toBeNull();
    expect(screen.queryByTestId("vote-button")).toBeNull();
  });

  it("passes approve status props to the compact vote display", () => {
    render(
      <WaveLeaderboardGridItem
        drop={baseDrop}
        mode="compact"
        onDropClick={jest.fn()}
        winningThreshold={12}
        winningThresholdMinDurationMs={120_000}
        isVotingClosed={true}
      />
    );

    expect(screen.getByTestId("votes")).toHaveAttribute(
      "data-winning-threshold",
      "12"
    );
    expect(screen.getByTestId("votes")).toHaveAttribute(
      "data-winning-threshold-min-duration",
      "120000"
    );
    expect(screen.getByTestId("votes")).toHaveAttribute(
      "data-is-voting-closed",
      "true"
    );
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
    expect(
      screen.queryByTestId("wave-leaderboard-grid-item-footer-d1")
    ).not.toBeInTheDocument();
    expect(
      screen.getByTestId("wave-leaderboard-grid-item-content-only-actions-d1")
    ).toHaveClass(
      "tw-opacity-0",
      "group-focus-within:tw-opacity-100",
      "desktop-hover:group-hover:tw-opacity-100",
      "touch-only:tw-opacity-100"
    );
    expect(screen.getByTestId("desktop-open-action")).toBeInTheDocument();
    expect(screen.getByTestId("vote-button")).toBeInTheDocument();
    expect(screen.getByTestId("media")).toBeInTheDocument();
    const mediaWrapper = screen.getByTestId("media")
      .parentElement as HTMLElement;
    expect(mediaWrapper).toHaveClass("tw-aspect-square");
    expect(mediaWrapper).not.toHaveClass("tw-aspect-[16/9]");
    expect(mediaWrapper).toHaveClass("tw-flex");
    expect(mediaWrapper).toHaveClass("tw-items-center");
    expect(mediaWrapper).toHaveClass("tw-justify-center");
    expect(mediaWrapper).toHaveClass("tw-min-h-[14rem]");
    expect(mediaWrapper).toHaveClass("md:tw-min-h-[15rem]");

    const card = screen.getByTestId("wave-leaderboard-grid-item-d1");
    const viewport = card.firstElementChild as HTMLElement;
    expect(card).toHaveClass("tw-p-0");
    expect(card).not.toHaveClass("tw-p-2");
    expect(card).toHaveClass("tw-border");
    expect(card).toHaveClass("tw-bg-iron-950");
    expect(viewport).not.toHaveClass("tw-max-h-[20rem]");
    expect(viewport).toHaveClass("tw-bg-iron-950");
    expect(viewport).not.toHaveClass("tw-h-[20rem]");
    expect(viewport).not.toHaveClass("tw-p-2");
    expect(viewport).not.toHaveClass("tw-p-3");
    expect(viewport).not.toHaveClass("tw-rounded-lg");
    expect(viewport).not.toHaveClass("tw-bg-iron-900/50");
    expect(screen.queryByTestId("markdown")).not.toBeInTheDocument();
    expect(markdownProps).toBeUndefined();
  });

  it("renders a compact plain-text summary without a media block", () => {
    render(
      <WaveLeaderboardGridItem
        drop={{
          ...baseDrop,
          parts: [{ media: [], content: "hello" }],
        }}
        mode="compact"
        onDropClick={jest.fn()}
      />
    );

    expect(screen.queryByTestId("media")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "hello" })).toBeInTheDocument();
    expect(screen.queryByTestId("markdown")).not.toBeInTheDocument();
    expect(markdownProps).toBeUndefined();
  });

  it("renders a bounded summary for content-only text-only drops", () => {
    render(
      <WaveLeaderboardGridItem
        drop={{
          ...baseDrop,
          parts: [{ media: [], content: "hello" }],
        }}
        mode="content_only"
        onDropClick={jest.fn()}
      />
    );

    expect(screen.queryByTestId("media")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "hello" })).toBeInTheDocument();
    expect(screen.queryByTestId("markdown")).not.toBeInTheDocument();
    expect(markdownProps).toBeUndefined();
  });

  it("does not render preview-only metadata as media", () => {
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
    expect(screen.getByRole("heading", { name: "hello" })).toBeInTheDocument();
    expect(screen.queryByTestId("markdown")).not.toBeInTheDocument();
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
      "data-media-url",
      "video.mp4"
    );
    expect(screen.getByTestId("media")).toHaveAttribute(
      "data-media-mime-type",
      "video/mp4"
    );
    expect(screen.getByTestId("media")).toHaveAttribute(
      "data-preview-image-url",
      "https://example.com/preview.jpg"
    );
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
    expect(card).toHaveClass("tw-bg-iron-950");
    expect(screen.queryByTestId("media")).not.toBeInTheDocument();
  });

  it("keeps the card surface inert and opens through the named action", () => {
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
    expect(startDropOpen).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Open hello" }));
    expect(onDropClick).toHaveBeenCalledWith(baseDrop);
    expect(startDropOpen).toHaveBeenCalledWith(
      expect.objectContaining({
        dropId: "d1",
        waveId: "w1",
        source: "leaderboard_grid",
      })
    );
  });

  it("renders a condensed identity summary in compact mode for identity waves", () => {
    render(
      <WaveLeaderboardGridItem
        drop={{
          ...baseDrop,
          wave: {
            ...baseDrop.wave,
            submission_type:
              ApiWaveParticipationSubmissionStrategyType.Identity,
          },
        }}
        mode="compact"
        onDropClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("identity")).toHaveAttribute(
      "data-variant",
      "condensed"
    );
  });

  it("renders a responsive identity block in content-only mode for identity waves", () => {
    render(
      <WaveLeaderboardGridItem
        drop={{
          ...baseDrop,
          wave: {
            ...baseDrop.wave,
            submission_type:
              ApiWaveParticipationSubmissionStrategyType.Identity,
          },
        }}
        mode="content_only"
        onDropClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("identity")).toHaveAttribute(
      "data-variant",
      "responsive"
    );
  });

  it("does not mount markdown links and keeps voting independent from opening", () => {
    const onDropClick = jest.fn();

    render(
      <WaveLeaderboardGridItem
        drop={{
          ...baseDrop,
          title: "hello",
          parts: [
            {
              media: [],
              content:
                "hello\n\nRead [the source](https://example.com/source) safely.",
            },
          ],
        }}
        mode="content_only"
        onDropClick={onDropClick}
      />
    );

    expect(screen.queryByTestId("markdown-link")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "the source" })).toBeNull();
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
    expect(screen.getByTestId("mobile-copy-action")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Vote" }));
    expect(screen.getByTestId("modal")).toBeInTheDocument();
    expect(setIsActive).toHaveBeenCalledWith(false);
  });

  it("shows copy action on touch devices when it is the only content-only action", () => {
    useDeviceInfo.mockReturnValue({ hasTouchScreen: true });
    useLongPressInteraction.mockReturnValue({
      isActive: true,
      setIsActive: jest.fn(),
      touchHandlers: {},
    });
    useDropInteractionRules.mockReturnValue({ canShowVote: false });

    render(
      <WaveLeaderboardGridItem
        drop={{
          ...baseDrop,
          drop_type: ApiDropType.Chat,
        }}
        mode="content_only"
        onDropClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("mobile-wrapper")).toBeInTheDocument();
    expect(screen.getByTestId("mobile-copy-action")).toBeInTheDocument();
    expect(screen.queryByTestId("mobile-open-action")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Vote" })
    ).not.toBeInTheDocument();
  });

  it("does not show desktop content-only actions for copy-only drops", () => {
    useDropInteractionRules.mockReturnValue({ canShowVote: false });

    render(
      <WaveLeaderboardGridItem
        drop={{
          ...baseDrop,
          drop_type: ApiDropType.Chat,
        }}
        mode="content_only"
        onDropClick={jest.fn()}
      />
    );

    expect(screen.queryByTestId("desktop-open-action")).not.toBeInTheDocument();
    expect(screen.queryByTestId("vote-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("mobile-copy-action")).not.toBeInTheDocument();
  });

  it("keeps the desktop open action when voting rules hide Vote", () => {
    useDropInteractionRules.mockReturnValue({ canShowVote: false });

    render(
      <WaveLeaderboardGridItem
        drop={baseDrop}
        mode="content_only"
        onDropClick={jest.fn()}
      />
    );

    expect(
      screen.getByTestId("wave-leaderboard-grid-item-content-only-actions-d1")
    ).toBeInTheDocument();
    expect(screen.getByTestId("desktop-open-action")).toBeInTheDocument();
    expect(screen.queryByTestId("vote-button")).not.toBeInTheDocument();
  });
});
