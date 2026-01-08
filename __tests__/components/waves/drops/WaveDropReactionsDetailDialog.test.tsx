import WaveDropReactionsDetailDialog from "@/components/waves/drops/WaveDropReactionsDetailDialog";
import { useEmoji } from "@/contexts/EmojiContext";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

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
      { id: "profile-1", handle: "alice", pfp: "https://example.com/pfp1.jpg" },
      { id: "profile-2", handle: "bob", pfp: null },
      { id: "profile-3", handle: null, pfp: null },
    ],
  },
  {
    reaction: ":heart:",
    profiles: [
      {
        id: "profile-4",
        handle: "charlie",
        pfp: "https://example.com/pfp4.jpg",
      },
    ],
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

    expect(screen.getAllByText("alice").length).toBeGreaterThan(0);
    expect(screen.getAllByText("bob").length).toBeGreaterThan(0);
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

    expect(screen.getAllByText("alice").length).toBeGreaterThan(0);

    const heartButton = screen.getByText("1").closest("button");
    if (heartButton) {
      fireEvent.click(heartButton);
    }

    expect(screen.getAllByText("charlie").length).toBeGreaterThan(0);
    expect(screen.queryByText("alice")).not.toBeInTheDocument();
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

    const aliceLink = screen.getAllByText("alice")[0].closest("a");
    expect(aliceLink).toHaveAttribute("href", "/alice");
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

    expect(screen.getAllByText("alice").length).toBeGreaterThan(0);
  });
});
