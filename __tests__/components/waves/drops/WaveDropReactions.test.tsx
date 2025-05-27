import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import WaveDropReactions from "../../../../components/waves/drops/WaveDropReactions";
import { useEmoji } from "../../../../contexts/EmojiContext";

// Mock useEmoji with sample emojiMap and findNativeEmoji
jest.mock("../../../../contexts/EmojiContext", () => ({
  useEmoji: jest.fn(),
}));

// Mock formatLargeNumber for predictable output (optional)
jest.mock("../../../../helpers/Helpers", () => ({
  formatLargeNumber: (num: number) => `${num}`,
}));

describe("WaveDropReactions", () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.resetAllMocks();
  });

  it("renders multiple WaveDropReaction buttons", () => {
    (useEmoji as jest.Mock).mockReturnValue({
      emojiMap: [
        {
          category: "people",
          emojis: [{ id: "gm", skins: [{ src: "gm.png" }] }],
        },
        {
          category: "people",
          emojis: [{ id: "gm1", skins: [{ src: "gm1.png" }] }],
        },
        {
          category: "people",
          emojis: [{ id: "grinning", skins: [{ src: "grinning.png" }] }],
        },
        {
          category: "people",
          emojis: [{ id: "grimacing", skins: [{ src: "grimacing.png" }] }],
        },
        {
          category: "people",
          emojis: [{ id: "6529er", skins: [{ src: "6529er.png" }] }],
        },
        {
          category: "people",
          emojis: [{ id: "om_seize", skins: [{ src: "om_seize.png" }] }],
        },
        {
          category: "people",
          emojis: [{ id: "punkshake", skins: [{ src: "punkshake.png" }] }],
        },
      ],
      findNativeEmoji: (id: string) =>
        id === "nonexistent" ? { skins: [{ native: "😊" }] } : null,
    });

    render(<WaveDropReactions drop={{ id: "test-drop" } as any} />);

    // Check that buttons render (should match emojiList length)
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(15); // Matches the emojiList length
  });

  it("renders with emoji image when emoji found", () => {
    (useEmoji as jest.Mock).mockReturnValue({
      emojiMap: [
        {
          category: "people",
          emojis: [{ id: "gm", skins: [{ src: "gm.png" }] }],
        },
      ],
      findNativeEmoji: () => null,
    });

    render(<WaveDropReactions drop={{ id: "test-drop" } as any} />);
    const img = screen
      .getAllByRole("img")
      .find((el) => el.getAttribute("src") === "gm.png");
    expect(img).toBeInTheDocument();
  });

  it("renders with native emoji when not found in emojiMap", () => {
    (useEmoji as jest.Mock).mockReturnValue({
      emojiMap: [],
      findNativeEmoji: (id: string) =>
        id === "grinning" ? { skins: [{ native: "😊" }] } : null,
    });

    render(<WaveDropReactions drop={{ id: "test-drop" } as any} />);
    const span = screen.getAllByText("😊")[0];
    expect(span).toBeInTheDocument();
  });

  it("returns null if no emoji found", () => {
    (useEmoji as jest.Mock).mockReturnValue({
      emojiMap: [],
      findNativeEmoji: () => null,
    });

    render(<WaveDropReactions drop={{ id: "test-drop" } as any} />);
    // Since no emoji is found, these buttons will render nothing
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("toggles count and selected state on button click", () => {
    (useEmoji as jest.Mock).mockReturnValue({
      emojiMap: [
        {
          category: "people",
          emojis: [{ id: "gm", skins: [{ src: "gm.png" }] }],
        },
      ],
      findNativeEmoji: () => null,
    });

    render(<WaveDropReactions drop={{ id: "test-drop" } as any} />);
    const button = screen.getAllByRole("button")[0];

    // Initial count text should match initialCount from emojiList
    expect(button).toHaveTextContent("10");

    // Click button to increment
    fireEvent.click(button);
    expect(button).toHaveTextContent("11");

    // Click button again to decrement
    fireEvent.click(button);
    expect(button).toHaveTextContent("10");
  });
});
