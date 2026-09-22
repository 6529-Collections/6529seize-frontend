import { notifyReactionHistoryChange } from "@/helpers/reactions/reactionHistory";
import WaveDropActionsQuickReact from "@/components/waves/drops/WaveDropActionsQuickReact";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropReaction } from "@/hooks/drops/useDropReaction";
import { act, fireEvent, render, screen } from "@testing-library/react";

jest.mock("@/hooks/drops/useDropReaction", () => ({
  useDropReaction: jest.fn(),
}));

const mockFindNativeEmoji = jest.fn();
const mockFindCustomEmoji = jest.fn();
const mockLoadEmojiData = jest.fn().mockResolvedValue(undefined);

jest.mock("@/components/waves/drops/DropActionTooltip", () => ({
  __esModule: true,
  default: ({ children }: { children: import("react").ReactNode }) => children,
}));

jest.mock("@/contexts/EmojiContext", () => ({
  useEmoji: () => ({
    emojiMap: [],
    findNativeEmoji: mockFindNativeEmoji,
    findCustomEmoji: mockFindCustomEmoji,
    loadEmojiData: mockLoadEmojiData,
  }),
}));

const mockedUseDropReaction = jest.mocked(useDropReaction);
const drop = { id: "drop-1" } as ExtendedDrop;

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockFindNativeEmoji.mockReset();
  mockFindCustomEmoji.mockReset();
  mockedUseDropReaction.mockReturnValue({
    canReact: true,
    react: jest.fn(async () => undefined),
  });
});

it("reports an enabled mobile quick reaction without waiting for the request", () => {
  const react = jest.fn(() => new Promise<void>(() => undefined));
  const onReactionStarted = jest.fn();
  mockedUseDropReaction.mockReturnValue({ canReact: true, react });

  render(
    <WaveDropActionsQuickReact
      drop={drop}
      isMobile
      onReactionStarted={onReactionStarted}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: "Click to react" }));

  expect(react).toHaveBeenCalledWith(":+1:");
  expect(onReactionStarted).toHaveBeenCalledTimes(1);
  expect(react.mock.invocationCallOrder[0]).toBeLessThan(
    onReactionStarted.mock.invocationCallOrder[0]!
  );
});

it("does nothing when mobile quick reactions are disabled", () => {
  const react = jest.fn();
  const onReactionStarted = jest.fn();
  mockedUseDropReaction.mockReturnValue({ canReact: false, react });

  render(
    <WaveDropActionsQuickReact
      drop={drop}
      isMobile
      onReactionStarted={onReactionStarted}
    />
  );

  const button = screen.getByRole("button", { name: "Click to react" });
  expect(button).toBeDisabled();
  fireEvent.click(button);

  expect(react).not.toHaveBeenCalled();
  expect(onReactionStarted).not.toHaveBeenCalled();
});

const nativeEmoji = (id: string, native: string) => ({
  id,
  name: id,
  keywords: id,
  skins: [{ native }],
});

it.each([false, true])(
  "shows one actual thumbs-up fallback when saved emojis are unavailable (mobile=%s)",
  (isMobile) => {
    localStorage.setItem(
      "emoji-mart.frequently",
      JSON.stringify({ missing: 9, gone: 8, removed: 7 })
    );
    render(<WaveDropActionsQuickReact drop={drop} isMobile={isMobile} />);
    const buttons = screen.getAllByRole("button", { name: "Click to react" });
    expect(buttons).toHaveLength(1);
    expect(buttons[0]).toHaveTextContent("👍");
    fireEvent.click(buttons[0]!);
    expect(
      mockedUseDropReaction.mock.results[0]!.value.react
    ).toHaveBeenCalledWith(":+1:");
  }
);

it.each([false, true])(
  "shows the top three available emojis even without custom data (mobile=%s)",
  (isMobile) => {
    const natives = [
      nativeEmoji("heart", "❤️"),
      nativeEmoji("smile", "😄"),
      nativeEmoji("wave", "👋"),
      nativeEmoji("fire", "🔥"),
    ];
    mockFindNativeEmoji.mockImplementation((id: string) =>
      natives.find((emoji) => emoji.id === id)
    );
    localStorage.setItem(
      "emoji-mart.frequently",
      JSON.stringify({ missing: 20, heart: 9, smile: 8, wave: 7, fire: 6 })
    );
    render(<WaveDropActionsQuickReact drop={drop} isMobile={isMobile} />);
    expect(
      screen
        .getAllByRole("button", { name: "Click to react" })
        .map((button) => button.textContent)
    ).toEqual(["❤️", "😄", "👋"]);
    expect(screen.queryByText("👍")).not.toBeInTheDocument();
  }
);

it("updates quick reactions when a composer picker records an emoji", () => {
  mockFindNativeEmoji.mockImplementation((id: string) =>
    id === "heart" ? nativeEmoji(id, "❤️") : null
  );
  render(<WaveDropActionsQuickReact drop={drop} isMobile />);
  expect(screen.getByText("👍")).toBeInTheDocument();
  act(() => {
    localStorage.setItem("emoji-mart.frequently", JSON.stringify({ heart: 1 }));
    notifyReactionHistoryChange();
  });
  expect(screen.getByText("❤️")).toBeInTheDocument();
  expect(screen.queryByText("👍")).not.toBeInTheDocument();
});

it("keeps custom and native reactions in usage order", () => {
  mockFindCustomEmoji.mockImplementation((id: string) =>
    id === "6529"
      ? { id, name: "6529", skins: [{ src: "https://example.com/6529.webp" }] }
      : null
  );
  mockFindNativeEmoji.mockImplementation((id: string) =>
    id === "heart" ? nativeEmoji(id, "❤️") : null
  );
  localStorage.setItem(
    "emoji-mart.frequently",
    JSON.stringify({ "6529": 9, heart: 8 })
  );
  render(<WaveDropActionsQuickReact drop={drop} isMobile />);
  const buttons = screen.getAllByRole("button", { name: "Click to react" });
  expect(buttons).toHaveLength(2);
  expect(screen.getByRole("img", { name: "6529" })).toHaveAttribute(
    "src",
    "https://example.com/6529.webp"
  );
  expect(buttons[1]).toHaveTextContent("❤️");
  fireEvent.click(buttons[0]!);
  expect(
    mockedUseDropReaction.mock.results[0]!.value.react
  ).toHaveBeenCalledWith(":6529:");
});
