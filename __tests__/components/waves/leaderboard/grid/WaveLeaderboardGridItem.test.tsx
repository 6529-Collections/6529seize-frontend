import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { WaveLeaderboardGridItem } from "@/components/waves/leaderboard/grid/WaveLeaderboardGridItem";

const startDropOpen = jest.fn();
let markdownProps: any;

jest.mock(
  "@/components/drops/view/item/content/media/MediaDisplay",
  () => () => <div data-testid="media" />
);

jest.mock(
  "@/components/waves/drops/WaveDropPartContentMarkdown",
  () => (props: any) => {
    markdownProps = props;
    return <div data-testid="markdown" />;
  }
);

jest.mock("@/components/waves/drops/winner/WinnerDropBadge", () => () => (
  <div data-testid="rank" />
));

jest.mock(
  "@/components/waves/leaderboard/gallery/WaveLeaderboardGalleryItemVotes",
  () => () => <div data-testid="votes" />
);

jest.mock("@/hooks/isMobileScreen", () => () => false);

jest.mock("@/utils/monitoring/dropOpenTiming", () => ({
  startDropOpen: (...args: any[]) => startDropOpen(...args),
}));

describe("WaveLeaderboardGridItem", () => {
  const baseDrop: any = {
    id: "d1",
    rank: 1,
    metadata: [],
    parts: [
      {
        media: [{ url: "media", mime_type: "image/jpeg" }],
        content: "hello",
      },
    ],
    wave: { id: "w1" },
    mentioned_users: [],
    mentioned_waves: [],
    referenced_nfts: [],
    winning_context: { decision_time: null },
  };

  beforeEach(() => {
    markdownProps = undefined;
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
    expect(markdownProps.marketplaceImageOnly).toBe(false);
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
    expect(viewport).toHaveClass("tw-h-[19rem]");
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
    expect(markdownProps.marketplaceImageOnly).toBe(true);
    expect(
      screen.queryByTestId("wave-leaderboard-grid-item-footer-d1")
    ).not.toBeInTheDocument();

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

  it("removes outer card border for marketplace-only image mode", () => {
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
    expect(card).not.toHaveClass("tw-border");
    expect(markdownProps.marketplaceImageOnly).toBe(true);
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
});
