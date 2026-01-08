import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import WaveDropReactionsDetailDialog from "@/components/waves/drops/WaveDropReactionsDetailDialog";
import { useEmoji } from "@/contexts/EmojiContext";

jest.mock("@/contexts/EmojiContext", () => ({
  useEmoji: jest.fn(),
}));

const mockUseEmoji = useEmoji as jest.Mock;

const createEmojiContextValue = (
  emojiMap: Array<{
    category: string;
    emojis: Array<{ id: string; skins: Array<{ src: string }> }>;
  }> = [],
  findNativeEmoji: (
    id: string
  ) => { skins: Array<{ native: string }> } | null = () => null
) => ({
  emojiMap,
  loading: false,
  categories: [],
  categoryIcons: {},
  findNativeEmoji,
  findCustomEmoji: () => null,
});

const mockReactions = [
  {
    reaction: ":thumbsup:",
    profiles: [
      { id: "1", handle: "user1", pfp: "https://example.com/pfp1.jpg" },
      { id: "2", handle: "user2", pfp: null },
      { id: "3", handle: null, pfp: null },
    ],
  },
  {
    reaction: ":heart:",
    profiles: [{ id: "4", handle: "user4", pfp: "https://example.com/pfp4.jpg" }],
  },
];

describe("WaveDropReactionsDetailDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseEmoji.mockReturnValue(
      createEmojiContextValue([], (id: string) => {
        if (id === "thumbsup") return { skins: [{ native: "👍" }] };
        if (id === "heart") return { skins: [{ native: "❤️" }] };
        return null;
      })
    );
  });

  it("renders nothing when closed", () => {
    render(
      <WaveDropReactionsDetailDialog
        isOpen={false}
        onClose={jest.fn()}
        reactions={mockReactions as any}
      />
    );

    expect(screen.queryByText("Reactions")).not.toBeInTheDocument();
  });

  it("renders dialog with title when open", () => {
    render(
      <WaveDropReactionsDetailDialog
        isOpen={true}
        onClose={jest.fn()}
        reactions={mockReactions as any}
      />
    );

    expect(screen.getByText("Reactions")).toBeInTheDocument();
  });

  it("renders reaction buttons in sidebar", () => {
    render(
      <WaveDropReactionsDetailDialog
        isOpen={true}
        onClose={jest.fn()}
        reactions={mockReactions as any}
      />
    );

    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders profiles for selected reaction", () => {
    render(
      <WaveDropReactionsDetailDialog
        isOpen={true}
        onClose={jest.fn()}
        reactions={mockReactions as any}
        initialReaction=":thumbsup:"
      />
    );

    expect(screen.getByText("user1")).toBeInTheDocument();
    expect(screen.getByText("user2")).toBeInTheDocument();
  });

  it("switches reaction when clicking another reaction button", () => {
    render(
      <WaveDropReactionsDetailDialog
        isOpen={true}
        onClose={jest.fn()}
        reactions={mockReactions as any}
        initialReaction=":thumbsup:"
      />
    );

    expect(screen.getByText("user1")).toBeInTheDocument();

    const heartButton = screen.getByText("1").closest("button");
    if (heartButton) {
      fireEvent.click(heartButton);
    }

    expect(screen.getByText("user4")).toBeInTheDocument();
    expect(screen.queryByText("user1")).not.toBeInTheDocument();
  });

  it("renders profile links for users with handles", () => {
    render(
      <WaveDropReactionsDetailDialog
        isOpen={true}
        onClose={jest.fn()}
        reactions={mockReactions as any}
        initialReaction=":thumbsup:"
      />
    );

    const user1Link = screen.getByText("user1").closest("a");
    expect(user1Link).toHaveAttribute("href", "/user1");
  });

  it("renders profile avatars", () => {
    render(
      <WaveDropReactionsDetailDialog
        isOpen={true}
        onClose={jest.fn()}
        reactions={mockReactions as any}
        initialReaction=":thumbsup:"
      />
    );

    const avatars = screen.getAllByRole("img");
    expect(avatars.length).toBeGreaterThan(0);
  });

  it("calls onClose when dialog is closed", () => {
    const onClose = jest.fn();
    render(
      <WaveDropReactionsDetailDialog
        isOpen={true}
        onClose={onClose}
        reactions={mockReactions as any}
      />
    );

    const closeButton = screen.getByTitle("Close panel");
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it("defaults to first reaction when no initialReaction provided", () => {
    render(
      <WaveDropReactionsDetailDialog
        isOpen={true}
        onClose={jest.fn()}
        reactions={mockReactions as any}
      />
    );

    expect(screen.getByText("user1")).toBeInTheDocument();
  });
});
