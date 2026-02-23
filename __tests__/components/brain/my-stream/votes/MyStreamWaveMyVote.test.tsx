import MyStreamWaveMyVote from "@/components/brain/my-stream/votes/MyStreamWaveMyVote";
import { fireEvent, render, screen } from "@testing-library/react";

const mockMediaDisplay = jest.fn();
const mockIsCurationWave = jest.fn(() => false);

jest.mock("@/components/drops/view/item/content/media/MediaDisplay", () => ({
  __esModule: true,
  default: (props: any) => {
    mockMediaDisplay(props);
    return <div data-testid="media" />;
  },
}));

jest.mock("@/components/brain/my-stream/votes/MyStreamWaveMyVoteVotes", () => ({
  __esModule: true,
  default: () => <div data-testid="votes" />,
}));

jest.mock("@/components/brain/my-stream/votes/MyStreamWaveMyVoteInput", () => ({
  __esModule: true,
  default: () => <div data-testid="input" />,
}));

jest.mock("@/components/user/utils/UserCICAndLevel", () => ({
  __esModule: true,
  default: () => <div data-testid="cic" />,
  UserCICAndLevelSize: { SMALL: "SMALL" },
}));

jest.mock("@/components/waves/drop/SingleWaveDropPosition", () => ({
  __esModule: true,
  SingleWaveDropPosition: ({ rank }: any) => (
    <div data-testid="pos">{rank}</div>
  ),
  default: ({ rank }: any) => <div data-testid="pos">{rank}</div>,
}));

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettings: () => ({
    isCurationWave: mockIsCurationWave,
  }),
}));

describe("MyStreamWaveMyVote", () => {
  const drop: any = {
    id: "d1",
    title: "Drop Title",
    parts: [{ media: [{ url: "a", mime_type: "image/jpeg" }] }],
    metadata: [],
    wave: { id: "w1" },
    nft_links: [],
    author: { handle: "alice", cic: 1, level: 2 },
    rating: 0,
    raters_count: 3,
  };

  beforeEach(() => {
    mockMediaDisplay.mockClear();
    mockIsCurationWave.mockReset();
    mockIsCurationWave.mockReturnValue(false);
  });

  it("triggers onDropClick when no text selected", () => {
    const onDropClick = jest.fn();
    (globalThis.getSelection as any) = () => ({ toString: () => "" });
    const { container } = render(
      <MyStreamWaveMyVote drop={drop} onDropClick={onDropClick} />
    );
    fireEvent.click(container.firstChild!);
    expect(onDropClick).toHaveBeenCalledWith(drop);
  });

  it("does not trigger onDropClick when text selected", () => {
    const onDropClick = jest.fn();
    (globalThis.getSelection as any) = () => ({ toString: () => "sel" });
    const { container } = render(
      <MyStreamWaveMyVote drop={drop} onDropClick={onDropClick} />
    );
    fireEvent.click(container.firstChild!);
    expect(onDropClick).not.toHaveBeenCalled();
  });

  it("calls onToggleCheck when checkbox clicked", () => {
    const onToggleCheck = jest.fn();
    (globalThis.getSelection as any) = () => ({ toString: () => "" });
    const { container } = render(
      <MyStreamWaveMyVote
        drop={drop}
        onDropClick={jest.fn()}
        isChecked={false}
        onToggleCheck={onToggleCheck}
      />
    );
    const checkbox = container.querySelector(".tw-flex-shrink-0");
    fireEvent.click(checkbox!);
    expect(onToggleCheck).toHaveBeenCalledWith("d1");
  });

  it("uses curation nft preview media when drop has no attached media", () => {
    mockIsCurationWave.mockReturnValue(true);
    const curationDrop = {
      ...drop,
      parts: [{ media: [] }],
      nft_links: [
        {
          url_in_text: "https://opensea.io/assets/ethereum/0xabc/1",
          data: {
            media_uri: "https://cdn.example.com/fallback.png",
            media_preview: {
              status: "READY",
              card_url: "https://cdn.example.com/card.webp",
              small_url: "https://cdn.example.com/small.jpg",
              thumb_url: "https://cdn.example.com/thumb.jpg",
              mime_type: "image/webp",
            },
          },
        },
      ],
    };

    render(<MyStreamWaveMyVote drop={curationDrop} onDropClick={jest.fn()} />);

    expect(screen.getByTestId("media")).toBeInTheDocument();
    const props = mockMediaDisplay.mock.calls.at(-1)?.[0];
    expect(props?.media_url).toBe("https://cdn.example.com/card.webp");
    expect(props?.media_mime_type).toBe("image/webp");
  });

  it("falls back to media_uri when preview status is not ready", () => {
    mockIsCurationWave.mockReturnValue(true);
    const curationDrop = {
      ...drop,
      parts: [{ media: [] }],
      nft_links: [
        {
          url_in_text: "https://opensea.io/assets/ethereum/0xabc/1",
          data: {
            media_uri: "https://cdn.example.com/fallback.png",
            media_preview: {
              status: "PROCESSING",
              card_url: "https://cdn.example.com/card.webp",
              small_url: "https://cdn.example.com/small.jpg",
              thumb_url: "https://cdn.example.com/thumb.jpg",
              mime_type: "image/webp",
            },
          },
        },
      ],
    };

    render(<MyStreamWaveMyVote drop={curationDrop} onDropClick={jest.fn()} />);

    expect(screen.getByTestId("media")).toBeInTheDocument();
    const props = mockMediaDisplay.mock.calls.at(-1)?.[0];
    expect(props?.media_url).toBe("https://cdn.example.com/fallback.png");
    expect(props?.media_mime_type).toBe("image/png");
  });

  it("does not use nft preview media outside curation waves", () => {
    mockIsCurationWave.mockReturnValue(false);
    const nonCurationDrop = {
      ...drop,
      parts: [{ media: [] }],
      nft_links: [
        {
          url_in_text: "https://opensea.io/assets/ethereum/0xabc/1",
          data: {
            media_uri: "https://cdn.example.com/fallback.png",
            media_preview: {
              status: "READY",
              card_url: "https://cdn.example.com/card.webp",
              small_url: "https://cdn.example.com/small.jpg",
              thumb_url: "https://cdn.example.com/thumb.jpg",
              mime_type: "image/webp",
            },
          },
        },
      ],
    };

    render(
      <MyStreamWaveMyVote drop={nonCurationDrop} onDropClick={jest.fn()} />
    );

    expect(screen.queryByTestId("media")).not.toBeInTheDocument();
    expect(mockMediaDisplay).not.toHaveBeenCalled();
  });
});
