import WaveDropReactions from "@/components/waves/drops/WaveDropReactions";
import { useEmoji } from "@/contexts/EmojiContext";
import * as commonApi from "@/services/api/common-api";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStream: jest.fn(() => ({
    applyOptimisticDropUpdate: jest.fn(() => ({ rollback: jest.fn() })),
  })),
}));

jest.mock("@/contexts/EmojiContext", () => ({
  useEmoji: jest.fn(),
}));

jest.mock("@/helpers/Helpers", () => ({
  formatLargeNumber: (num: number) => `${num}`,
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiPost: jest.fn(),
  commonApiDelete: jest.fn(),
}));

jest.mock("@/hooks/useIsTouchDevice", () => ({
  __esModule: true,
  default: jest.fn(() => false),
}));

jest.mock("@/hooks/useLongPressInteraction", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    longPressTriggered: false,
    touchHandlers: {
      onTouchStart: jest.fn(),
      onTouchMove: jest.fn(),
      onTouchEnd: jest.fn(),
      onTouchCancel: jest.fn(),
    },
  })),
}));

const mockUseEmoji = useEmoji as jest.Mock;

type NativeEmojiMock = { skins: Array<{ native: string }> };

const createEmojiContextValue = (
  emojiMap: Array<{
    category: string;
    emojis: Array<{ id: string; skins: Array<{ src: string }> }>;
  }> = [],
  findNativeEmoji: (id: string) => NativeEmojiMock | null = () => null
) => ({
  emojiMap,
  loading: false,
  categories: [],
  categoryIcons: {},
  findNativeEmoji,
  findCustomEmoji: (id: string) => {
    const normalized = id.replaceAll(":", "");
    for (const category of emojiMap) {
      const found = category.emojis.find((emoji) => emoji.id === normalized);
      if (found) {
        return found;
      }
    }
    return null;
  },
});

const createMockDrop = (overrides: Record<string, unknown> = {}) => ({
  id: "test-drop",
  wave: { id: "test-wave" },
  reactions: [],
  ...overrides,
});

describe("WaveDropReactions", () => {
  const getMyStreamMock = () =>
    (
      require("@/contexts/wave/MyStreamContext") as {
        useMyStream: jest.Mock;
      }
    ).useMyStream;

  beforeEach(() => {
    // Reset call history without removing default implementations
    jest.clearAllMocks();
    getMyStreamMock().mockReturnValue({
      applyOptimisticDropUpdate: jest.fn(() => ({ rollback: jest.fn() })),
    });
  });

  it("renders multiple WaveDropReaction buttons", () => {
    mockUseEmoji.mockReturnValue(
      createEmojiContextValue(
        [
          {
            category: "people",
            emojis: [{ id: "gm", skins: [{ src: "/gm.png" }] }],
          },
          {
            category: "people",
            emojis: [{ id: "gm1", skins: [{ src: "/gm1.png" }] }],
          },
        ],
        (id: string) =>
          id === "nonexistent" ? { skins: [{ native: "😊" }] } : null
      )
    );

    render(
      <WaveDropReactions
        drop={
          createMockDrop({
            reactions: [
              {
                reaction: ":gm:",
                profiles: [{ handle: "test-handle-1", id: "1" }],
              },
              {
                reaction: ":gm1:",
                profiles: [{ handle: "test-handle-2", id: "2" }],
              },
            ],
          }) as any
        }
      />
    );

    // Check that buttons render (should match emojiList length)
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(2);
  });

  it("renders with emoji image when emoji found", () => {
    mockUseEmoji.mockReturnValue(
      createEmojiContextValue(
        [
          {
            category: "people",
            emojis: [{ id: "gm", skins: [{ src: "/gm.png" }] }],
          },
        ],
        () => null
      )
    );

    render(
      <WaveDropReactions
        drop={
          createMockDrop({
            reactions: [
              {
                reaction: ":gm:",
                profiles: [{ handle: "test-handle-1", id: "1" }],
              },
            ],
          }) as any
        }
      />
    );
    const img = screen
      .getAllByRole("img")
      .find((el) => el.getAttribute("src")?.includes("gm.png"));
    expect(img).toBeInTheDocument();
  });

  it("renders with native emoji when not found in emojiMap", () => {
    mockUseEmoji.mockReturnValue(
      createEmojiContextValue([], (id: string) =>
        id === "grinning" ? { skins: [{ native: "😊" }] } : null
      )
    );

    render(
      <WaveDropReactions
        drop={
          createMockDrop({
            reactions: [
              {
                reaction: ":grinning:",
                profiles: [{ handle: "test-handle-1", id: "1" }],
              },
            ],
          }) as any
        }
      />
    );
    const span = screen.getAllByText("😊")[0];
    expect(span).toBeInTheDocument();
  });

  it("returns null if no emoji found", () => {
    mockUseEmoji.mockReturnValue(createEmojiContextValue());

    render(<WaveDropReactions drop={createMockDrop() as any} />);
    // Since no emoji is found, these buttons will render nothing
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("toggles count and selected state on button click", async () => {
    mockUseEmoji.mockReturnValue(
      createEmojiContextValue(
        [
          {
            category: "people",
            emojis: [{ id: "gm", skins: [{ src: "/gm.png" }] }],
          },
        ],
        () => null
      )
    );

    (commonApi.commonApiPost as jest.Mock).mockResolvedValue({
      id: "test-drop",
    });
    (commonApi.commonApiDelete as jest.Mock).mockResolvedValue({
      id: "test-drop",
    });

    render(
      <WaveDropReactions
        drop={
          createMockDrop({
            reactions: [
              {
                reaction: ":gm:",
                profiles: [
                  { handle: "test-handle-1", id: "1" },
                  { handle: "test-handle-2", id: "2" },
                ],
              },
            ],
          }) as any
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

  it("shows 'and X more' in tooltip when more than 3 profiles", async () => {
    mockUseEmoji.mockReturnValue(
      createEmojiContextValue(
        [
          {
            category: "people",
            emojis: [{ id: "gm", skins: [{ src: "/gm.png" }] }],
          },
        ],
        () => null
      )
    );

    render(
      <WaveDropReactions
        drop={
          createMockDrop({
            reactions: [
              {
                reaction: ":gm:",
                profiles: [
                  { handle: "user1", id: "1" },
                  { handle: "user2", id: "2" },
                  { handle: "user3", id: "3" },
                  { handle: "user4", id: "4" },
                  { handle: "user5", id: "5" },
                ],
              },
            ],
          }) as any
        }
      />
    );

    const reactionButton = screen.getAllByRole("button")[0];
    fireEvent.mouseEnter(reactionButton);

    await waitFor(() => {
      const moreButton = screen.queryByText(/and 2 others/);
      expect(moreButton).toBeInTheDocument();
    });
  });

  it("opens detail dialog when 'and X more' is clicked", async () => {
    mockUseEmoji.mockReturnValue(
      createEmojiContextValue(
        [
          {
            category: "people",
            emojis: [{ id: "gm", skins: [{ src: "/gm.png" }] }],
          },
        ],
        () => null
      )
    );

    render(
      <WaveDropReactions
        drop={
          createMockDrop({
            reactions: [
              {
                reaction: ":gm:",
                profiles: [
                  { handle: "user1", id: "1" },
                  { handle: "user2", id: "2" },
                  { handle: "user3", id: "3" },
                  { handle: "user4", id: "4" },
                ],
              },
            ],
          }) as any
        }
      />
    );

    const reactionButton = screen.getAllByRole("button")[0];
    fireEvent.mouseEnter(reactionButton);

    await waitFor(() => {
      const moreButton = screen.getByText(/and 1 other/);
      fireEvent.click(moreButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Reactions")).toBeInTheDocument();
    });
  });

  it("adds touch handlers for long press on touch devices", () => {
    const mockUseIsTouchDevice = require("@/hooks/useIsTouchDevice").default;
    mockUseIsTouchDevice.mockReturnValue(true);

    mockUseEmoji.mockReturnValue(
      createEmojiContextValue(
        [
          {
            category: "people",
            emojis: [{ id: "gm", skins: [{ src: "/gm.png" }] }],
          },
        ],
        () => null
      )
    );

    render(
      <WaveDropReactions
        drop={
          createMockDrop({
            reactions: [
              {
                reaction: ":gm:",
                profiles: [{ handle: "user1", id: "1" }],
              },
            ],
          }) as any
        }
      />
    );

    const reactionButton = screen.getAllByRole("button")[0];
    expect(reactionButton).toBeInTheDocument();

    mockUseIsTouchDevice.mockReturnValue(false);
  });

  it("renders profile handles as clickable links in tooltip", async () => {
    mockUseEmoji.mockReturnValue(
      createEmojiContextValue(
        [
          {
            category: "people",
            emojis: [{ id: "gm", skins: [{ src: "/gm.png" }] }],
          },
        ],
        () => null
      )
    );

    render(
      <WaveDropReactions
        drop={
          createMockDrop({
            reactions: [
              {
                reaction: ":gm:",
                profiles: [
                  { handle: "user1", id: "1" },
                  { handle: "user2", id: "2" },
                ],
              },
            ],
          }) as any
        }
      />
    );

    const reactionButton = screen.getAllByRole("button")[0];
    fireEvent.mouseEnter(reactionButton);

    await waitFor(() => {
      const user1Link = screen.getByRole("link", { name: "user1" });
      expect(user1Link).toHaveAttribute("href", "/user1");
    });
  });
});
