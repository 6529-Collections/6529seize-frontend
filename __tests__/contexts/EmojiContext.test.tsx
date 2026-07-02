import React from "react";
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { EmojiProvider, useEmoji } from "@/contexts/EmojiContext";

// Mock fetch
global.fetch = jest.fn();

jest.mock("@emoji-mart/data", () => ({
  __esModule: true,
  default: {
    emojis: {
      smile: {
        id: "smile",
        name: "Smile",
        keywords: "smiling face",
        skins: [{ native: "😊" }],
      },
    },
  },
  emojis: {
    smile: {
      id: "smile",
      name: "Smile",
      keywords: "smiling face",
      skins: [{ native: "😊" }],
    },
  },
}));

// Test component to consume the context
const TestComponent = () => {
  const {
    emojiMap,
    loading,
    categories,
    categoryIcons,
    findNativeEmoji,
    loadEmojiData,
  } = useEmoji();

  return (
    <div>
      <button type="button" onClick={() => void loadEmojiData()}>
        Load emoji
      </button>
      <div data-testid="loading">{loading ? "loading" : "loaded"}</div>
      <div data-testid="categories">{categories.join(",")}</div>
      <div data-testid="categoryIcons">
        {Object.keys(categoryIcons).join(",")}
      </div>
      <div data-testid="emojiMap">{emojiMap.length}</div>
      <div data-testid="nativeEmoji">
        {findNativeEmoji("smile")?.skins[0]?.native}
      </div>
    </div>
  );
};

describe("EmojiContext", () => {
  beforeEach(() => {
    globalThis.__resetEmojiContextCachesForTests?.();
    jest.resetAllMocks();
  });

  it("provides defaults and loads emojis on demand", async () => {
    const fakeEmojiList = JSON.stringify(["smile", "grin"]);
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => JSON.parse(fakeEmojiList),
    });

    render(
      <EmojiProvider>
        <TestComponent />
      </EmojiProvider>
    );

    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getByTestId("loading").textContent).toBe("loaded");
    expect(screen.getByTestId("emojiMap").textContent).toBe("0");
    expect(screen.getByTestId("nativeEmoji").textContent).toBe("");

    fireEvent.click(screen.getByRole("button", { name: /load emoji/i }));

    await waitFor(() => {
      expect(screen.getByTestId("nativeEmoji").textContent).toBe("😊");
      expect(screen.getByTestId("emojiMap").textContent).toBe("1");
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("loading").textContent).toBe("loaded");
    expect(screen.getByTestId("categories").textContent).toContain("6529");
    expect(screen.getByTestId("categoryIcons").textContent).toContain("6529");
  });

  it("handles fetch failure gracefully and retries later", async () => {
    const fakeEmojiList = JSON.stringify(["retry_smile"]);
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: false,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => JSON.parse(fakeEmojiList),
      });

    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    render(
      <EmojiProvider>
        <TestComponent />
      </EmojiProvider>
    );

    expect(fetch).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /load emoji/i }));

    await waitFor(() => expect(consoleErrorSpy).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("emojiMap").textContent).toBe("0");

    fireEvent.click(screen.getByRole("button", { name: /load emoji/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId("emojiMap").textContent).toBe("1");
    });
    consoleErrorSpy.mockRestore();
  });

  it("throws error if useEmoji is used outside of provider", () => {
    const BrokenComponent = () => {
      useEmoji();
      return null;
    };

    expect(() => render(<BrokenComponent />)).toThrow(
      "useEmoji must be used within an EmojiProvider"
    );
  });

  it("findNativeEmoji returns null if emoji not found", async () => {
    const { result } = renderHook(() => useEmoji(), {
      wrapper: ({ children }) => <EmojiProvider>{children}</EmojiProvider>,
    });

    await act(async () => {
      await result.current.loadNativeEmojis();
    });

    const native = result.current.findNativeEmoji("nonexistent");
    expect(native).toBeNull();
  });
});
