import { notifyReactionHistoryChange } from "@/helpers/reactions/reactionHistory";
import WaveDropActionsQuickReact from "@/components/waves/drops/WaveDropActionsQuickReact";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropReaction } from "@/hooks/drops/useDropReaction";
import { act, fireEvent, render, screen } from "@testing-library/react";

jest.mock("@/hooks/drops/useDropReaction", () => ({
  useDropReaction: jest.fn(),
}));

let mockLocale = "en-US";
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => mockLocale,
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
  mockLocale = "en-US";
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

  fireEvent.click(screen.getByRole("button", { name: /^React with / }));

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

  const button = screen.getByRole("button", { name: /^React with / });
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
    const buttons = screen.getAllByRole("button", { name: /^React with / });
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
      JSON.stringify({
        ...Object.fromEntries(
          Array.from({ length: 50 }, (_, i) => [`missing${i}`, 100 + i])
        ),
        heart: 9,
        smile: 8,
        wave: 7,
        fire: 6,
      })
    );
    render(<WaveDropActionsQuickReact drop={drop} isMobile={isMobile} />);
    expect(
      screen
        .getAllByRole("button", { name: /^React with / })
        .map((button) => button.textContent)
    ).toEqual(["❤️", "😄", "👋"]);
    expect(screen.queryByText("👍")).not.toBeInTheDocument();
    expect(mockFindNativeEmoji).not.toHaveBeenCalledWith("fire");
    expect(
      screen.getByRole("button", { name: "React with heart" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "React with smile" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "React with wave" })
    ).toBeInTheDocument();
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
  const buttons = screen.getAllByRole("button", { name: /^React with / });
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

it("reuses resolved emojis across rerenders and only requests data when needed", () => {
  mockFindNativeEmoji.mockImplementation((id: string) => nativeEmoji(id, "❤️"));
  localStorage.setItem("emoji-mart.frequently", JSON.stringify({ heart: 1 }));
  const { rerender } = render(<WaveDropActionsQuickReact drop={drop} />);
  expect(mockFindNativeEmoji).toHaveBeenCalledTimes(1);
  expect(mockLoadEmojiData).toHaveBeenCalledTimes(1);
  rerender(<WaveDropActionsQuickReact drop={drop} isMobile />);
  expect(mockFindNativeEmoji).toHaveBeenCalledTimes(1);
  act(() => {
    localStorage.setItem("emoji-mart.frequently", JSON.stringify({ heart: 2 }));
    notifyReactionHistoryChange();
  });
  expect(mockFindNativeEmoji).toHaveBeenCalledTimes(2);
  expect(mockLoadEmojiData).toHaveBeenCalledTimes(1);
});

it.each([
  ["en-US", "React with Thumbs up"],
  ["en-GB", "React with Thumbs up"],
  ["fr-FR", "Réagir avec Pouce levé"],
  ["es-ES", "Reaccionar con Pulgar arriba"],
  ["de-DE", "Mit Daumen hoch reagieren"],
])("localizes the fallback action in %s", (locale, label) => {
  mockLocale = locale;
  render(<WaveDropActionsQuickReact drop={drop} />);
  expect(screen.getByRole("button", { name: label })).toHaveTextContent("👍");
});

it.each([
  [false, false],
  [false, true],
  [true, false],
  [true, true],
])(
  "shows distinct reactions when saved IDs normalize to the same emoji (mobile=%s, loaded=%s)",
  (isMobile, thumbsUpLoaded) => {
    const natives = [nativeEmoji("heart", "❤️"), nativeEmoji("smile", "😄")];
    if (thumbsUpLoaded) natives.push(nativeEmoji("+1", "👍"));
    mockFindNativeEmoji.mockImplementation((id: string) =>
      natives.find((emoji) => emoji.id === id)
    );
    localStorage.setItem(
      "emoji-mart.frequently",
      JSON.stringify({
        "+1": 10,
        ":+1:": 9,
        ":+1::": 8,
        heart: 7,
        smile: 6,
      })
    );
    render(<WaveDropActionsQuickReact drop={drop} isMobile={isMobile} />);
    expect(
      screen.getAllByRole("button").map((button) => button.textContent)
    ).toEqual(["👍", "❤️", "😄"]);
    fireEvent.click(
      screen.getByRole("button", { name: "React with Thumbs up" })
    );
    expect(
      mockedUseDropReaction.mock.results[0]!.value.react
    ).toHaveBeenCalledWith(":+1:");
  }
);
