import React from "react";
import { render, renderHook, screen, waitFor } from "@testing-library/react";
import { EmojiProvider, useEmoji } from "../../contexts/EmojiContext";

// Mock fetch
global.fetch = jest.fn();

// Mock @emoji-mart/data
jest.mock("@emoji-mart/data", () => ({
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
  const { emojiMap, loading, categories, categoryIcons, findNativeEmoji } =
    useEmoji();

  return (
    <div>
      <div data-testid="loading">{loading ? "loading" : "loaded"}</div>
      <div data-testid="categories">{categories.join(",")}</div>
      <div data-testid="categoryIcons">
        {Object.keys(categoryIcons).join(",")}
      </div>
      <div data-testid="emojiMap">{emojiMap.length}</div>
      <div data-testid="nativeEmoji">
        {findNativeEmoji("smile")?.skins[0].native}
      </div>
    </div>
  );
};

describe("EmojiContext", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("provides default values and fetches emojis successfully", async () => {
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

    expect(screen.getByTestId("loading").textContent).toBe("loading");

    // Wait for fetch to complete
    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("loaded")
    );
    expect(screen.getByTestId("emojiMap").textContent).toBe("1");
    expect(screen.getByTestId("categories").textContent).toContain("6529");
    expect(screen.getByTestId("categoryIcons").textContent).toContain("6529");
    expect(screen.getByTestId("nativeEmoji").textContent).toBe("😊");
  });

  it("handles fetch failure gracefully", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
    });

    console.error = jest.fn(); // suppress expected error logs

    render(
      <EmojiProvider>
        <TestComponent />
      </EmojiProvider>
    );

    expect(screen.getByTestId("loading").textContent).toBe("loading");

    await waitFor(() =>
      expect(screen.getByTestId("loading").textContent).toBe("loaded")
    );
    expect(screen.getByTestId("emojiMap").textContent).toBe("0");
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

  it("findNativeEmoji returns null if emoji not found", () => {
    const fakeEmojiData = {
      emojis: {},
    };
    jest.doMock("@emoji-mart/data", () => fakeEmojiData);

    const { result } = renderHook(() => useEmoji(), {
      wrapper: ({ children }) => <EmojiProvider>{children}</EmojiProvider>,
    });

    const native = result.current.findNativeEmoji("nonexistent");
    expect(native).toBeNull();
  });
});
