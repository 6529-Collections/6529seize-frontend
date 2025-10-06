import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import WaveDropReactions from "@/components/waves/drops/WaveDropReactions";
import { useEmoji } from "@/contexts/EmojiContext";
import * as commonApi from "@/services/api/common-api"; // Import directly to mock methods

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: jest.fn(() => ({
    applyOptimisticDropUpdate: jest.fn(() => ({ rollback: jest.fn() })),
  })),
}));

// Mock useEmoji with sample emojiMap and findNativeEmoji
jest.mock("@/contexts/EmojiContext", () => ({
  useEmoji: jest.fn(),
}));

// Mock formatLargeNumber for predictable output (optional)
jest.mock("@/helpers/Helpers", () => ({
  formatLargeNumber: (num: number) => `${num}`,
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
  commonApiDelete: jest.fn(),
}));

describe("WaveDropReactions", () => {
  const getMyStreamMock = () =>
    (require("@/contexts/wave/MyStreamContext") as {
      useMyStream: jest.Mock;
    }).useMyStream;

  beforeEach(() => {
    // Reset call history without removing default implementations
    jest.clearAllMocks();
    getMyStreamMock().mockReturnValue({
      applyOptimisticDropUpdate: jest.fn(() => ({ rollback: jest.fn() })),
    });
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
      ],
      findNativeEmoji: (id: string) =>
        id === "nonexistent" ? { skins: [{ native: "😊" }] } : null,
    });

    render(
      <WaveDropReactions
        drop={
          {
            id: "test-drop",
            reactions: [
              { reaction: ":gm:", profiles: [{ handle: "test-handle-1" }] },
              { reaction: ":gm1:", profiles: [{ handle: "test-handle-2" }] },
            ],
          } as any
        }
      />
    );

    // Check that buttons render (should match emojiList length)
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(2);
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

    render(
      <WaveDropReactions
        drop={
          {
            id: "test-drop",
            reactions: [
              { reaction: ":gm:", profiles: [{ handle: "test-handle-1" }] },
            ],
          } as any
        }
      />
    );
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

    render(
      <WaveDropReactions
        drop={
          {
            id: "test-drop",
            reactions: [
              {
                reaction: ":grinning:",
                profiles: [{ handle: "test-handle-1" }],
              },
            ],
          } as any
        }
      />
    );
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

  it("toggles count and selected state on button click", async () => {
    (useEmoji as jest.Mock).mockReturnValue({
      emojiMap: [
        {
          category: "people",
          emojis: [{ id: "gm", skins: [{ src: "gm.png" }] }],
        },
      ],
      findNativeEmoji: () => null,
    });

    (commonApi.commonApiPost as jest.Mock).mockResolvedValue({
      id: "test-drop",
    });
    (commonApi.commonApiDelete as jest.Mock).mockResolvedValue({
      id: "test-drop",
    });

    render(
      <WaveDropReactions
        drop={
          {
            id: "test-drop",
            reactions: [
              {
                reaction: ":gm:",
                profiles: [
                  { handle: "test-handle-1" },
                  { handle: "test-handle-2" },
                ],
              },
            ],
          } as any
        }
      />
    );
    const button = screen.getAllByRole("button")[0];

    // Initial count text should match initialCount from emojiList
    expect(button).toHaveTextContent("2");

    // Click button to increment
    fireEvent.click(button);
    await waitFor(() => {
      expect(button).toHaveTextContent("3");
    });

    // Click button again to decrement
    fireEvent.click(button);
    await waitFor(() => {
      expect(button).toHaveTextContent("2");
    });
  });
});
