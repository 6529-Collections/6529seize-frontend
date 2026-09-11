import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WaveSmallLeaderboardItemContent } from "@/components/waves/small-leaderboard/WaveSmallLeaderboardItemContent";
import { MemesSubmissionAdditionalInfoKey } from "@/components/waves/memes/submission/types/OperationalData";

jest.mock("@/components/waves/drops/WaveDropPartContentMedias", () => () => (
  <div data-testid="medias" />
));
jest.mock(
  "@/components/waves/drops/proposal/ProposalCardContent",
  () => (props: any) => <div data-testid="proposal-card">{props.drop.id}</div>
);
const waveDropPartContentMarkdownMock = jest.fn(() => (
  <div data-testid="markdown" />
));
jest.mock("@/components/waves/drops/WaveDropPartContentMarkdown", () => ({
  __esModule: true,
  default: (props: any) => waveDropPartContentMarkdownMock(props),
}));

describe("WaveSmallLeaderboardItemContent", () => {
  const baseDrop = {
    parts: [{ media: [], id: 1 }],
    metadata: [],
    mentioned_users: [],
    referenced_nfts: [],
    wave: {},
    rank: 1,
  } as any;

  beforeEach(() => {
    waveDropPartContentMarkdownMock.mockClear();
  });

  it("calls onDropClick when content clicked", async () => {
    const onDropClick = jest.fn();
    const user = userEvent.setup();
    render(
      <WaveSmallLeaderboardItemContent
        drop={baseDrop}
        onDropClick={onDropClick}
      />
    );
    await user.click(
      screen.getByTestId("markdown").parentElement as HTMLElement
    );
    expect(onDropClick).toHaveBeenCalled();
  });

  it("shows preview image when available instead of media", () => {
    const dropWithPreview = {
      ...baseDrop,
      parts: [{ media: [{ url: "original.jpg" }], id: 1 }],
      metadata: [
        {
          data_key: MemesSubmissionAdditionalInfoKey.ADDITIONAL_MEDIA,
          data_value: JSON.stringify({
            preview_image: "https://example.com/preview.jpg",
          }),
        },
      ],
    };
    render(
      <WaveSmallLeaderboardItemContent
        drop={dropWithPreview}
        onDropClick={jest.fn()}
      />
    );
    expect(
      screen.getByRole("img", { name: "Preview image" })
    ).toBeInTheDocument();
    expect(screen.queryByTestId("medias")).not.toBeInTheDocument();
  });

  it("shows original media when no preview image", () => {
    const dropWithMedia = {
      ...baseDrop,
      parts: [{ media: [{ url: "original.jpg" }], id: 1 }],
    };
    render(
      <WaveSmallLeaderboardItemContent
        drop={dropWithMedia}
        onDropClick={jest.fn()}
      />
    );
    expect(screen.getByTestId("medias")).toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: "Preview image" })
    ).not.toBeInTheDocument();
  });

  it("forwards custom content presentation to markdown rendering", () => {
    render(
      <WaveSmallLeaderboardItemContent
        drop={baseDrop}
        onDropClick={jest.fn()}
        contentPresentation="quorumCompact"
      />
    );

    expect(waveDropPartContentMarkdownMock).toHaveBeenCalledWith(
      expect.objectContaining({
        contentPresentation: "quorumCompact",
      })
    );
  });

  it("uses the shared proposal card and retains the existing open action", async () => {
    const onDropClick = jest.fn();
    const user = userEvent.setup();
    render(
      <WaveSmallLeaderboardItemContent
        drop={{ ...baseDrop, id: "proposal-1" }}
        onDropClick={onDropClick}
        contentPresentation="proposalCard"
      />
    );

    await user.click(screen.getByTestId("proposal-card"));

    expect(onDropClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("markdown")).not.toBeInTheDocument();
    expect(screen.queryByTestId("medias")).not.toBeInTheDocument();
  });

  it("opens a proposal card from the keyboard", async () => {
    const onDropClick = jest.fn();
    const user = userEvent.setup();
    render(
      <WaveSmallLeaderboardItemContent
        drop={{ ...baseDrop, id: "proposal-1" }}
        onDropClick={onDropClick}
        contentPresentation="proposalCard"
      />
    );

    await user.tab();
    expect(screen.getByRole("button")).toHaveFocus();
    await user.keyboard(" ");

    expect(onDropClick).toHaveBeenCalledTimes(1);
  });
});
