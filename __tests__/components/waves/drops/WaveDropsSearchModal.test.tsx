import type { SupportedLocale } from "@/i18n/locales";

let mockLocale: SupportedLocale = "en-US";
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => mockLocale,
}));

jest.mock("@/contexts/EmojiContext", () => ({
  useEmoji: () => ({
    findCustomEmoji: (id: string) =>
      id === "el_fafo_angy" ? { skins: [{ src: "/custom-emoji.webp" }] } : null,
    findNativeEmoji: (id: string) =>
      id === "smile" ? { skins: [{ native: "😄" }] } : null,
    loadEmojiData: jest.fn(() => Promise.resolve()),
  }),
}));

import WaveDropsSearchModal from "@/components/waves/drops/search/WaveDropsSearchModal";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));
const useWaveDropsSearch = jest.fn();
const mockPush = jest.fn();
const mockUseQuery = jest.fn();
const refetch = jest.fn(() => Promise.resolve());
jest.mock("@/contexts/wave/MyStreamContext", () => ({
  useMyStreamOptional: () => null,
}));

jest.mock("@/hooks/useWaveDropsSearch", () => ({
  useWaveDropsSearch: (...args: unknown[]) => useWaveDropsSearch(...args),
}));
jest.mock("@tanstack/react-query", () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({ connectedProfile: null, activeProfileProxy: null }),
}));
jest.mock("@/hooks/useDebouncedValue", () => ({
  useDebouncedValue: (value: unknown) => value,
}));

jest.mock("focus-trap-react", () => ({
  FocusTrap: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("react-use", () => ({
  useClickAway: jest.fn(),
  useKeyPressEvent: jest.fn(),
  useDebounce: (callback: () => void, _delay: number, deps: unknown[]) => {
    React.useEffect(callback, deps);
  },
}));

const wave = { id: "wave-1", name: "Design Wave" } as any;
const result = {
  stableKey: "drop-1",
  stableHash: "a1b2c3",
  serial_no: 42,
  wave: { id: "wave-1", name: "Design Wave" },
  title: null,
  parts: [
    {
      content:
        "A **modern** search result\n\n[Documentation](https://example.com) for @[bob] in #[team] with $[token]",
    },
  ],
  author: {
    handle: "alice",
    primary_address: "0x1",
    pfp: "https://example.com/alice.png",
  },
  created_at: Date.UTC(2026, 6, 13, 10, 30),
} as any;

const setHookResult = (overrides: Record<string, unknown> = {}) => {
  useWaveDropsSearch.mockReturnValue({
    drops: [result],
    isLoading: false,
    isFetching: false,
    isError: false,
    hasNextPage: false,
    fetchNextPage: jest.fn(() => Promise.resolve()),
    isFetchingNextPage: false,
    refetch,
    ...overrides,
  });
};

describe("WaveDropsSearchModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocale = "en-US";
    setHookResult();
    mockUseQuery.mockReturnValue({
      data: [
        {
          kind: "from",
          id: "author-1",
          label: "alice",
          author: { id: "author-1", handle: "alice", pfp: null },
        },
      ],
      isFetching: false,
    });
  });

  it("shows scope and compact, valid message results", () => {
    const onSelectSerialNo = jest.fn();
    render(
      <WaveDropsSearchModal
        isOpen
        onClose={jest.fn()}
        wave={wave}
        onSelectSerialNo={onSelectSerialNo}
        onSearchAll={jest.fn()}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Search messages" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove wave filter Design Wave" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Search all 6529" })
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByRole("combobox", {
        name: "Search messages",
      }),
      { target: { value: "modern" } }
    );

    const resultButton = screen.getByRole("button", {
      name: "Open message 42 by alice",
    });
    expect(resultButton.querySelector("button")).toBeNull();
    expect(resultButton.querySelector("a")).toBeNull();
    expect(screen.getByText("Documentation")).toHaveClass(
      "tw-text-primary-300"
    );
    expect(screen.getByText("@bob")).toHaveClass("tw-text-primary-300");
    expect(screen.getByText("#team")).toHaveClass("tw-text-primary-300");
    expect(screen.getByText("$token")).toHaveClass("tw-text-primary-300");
    expect(resultButton).not.toHaveTextContent("@[bob]");
    expect(resultButton).not.toHaveTextContent("#[team]");
    expect(resultButton.querySelector("img")).toHaveAttribute(
      "src",
      expect.stringContaining("alice.png")
    );
    expect(screen.getByText("modern").tagName).toBe("MARK");
    fireEvent.change(
      screen.getByRole("combobox", {
        name: "Search messages",
      }),
      { target: { value: "bob" } }
    );
    expect(screen.getByText("bob").tagName).toBe("MARK");
    fireEvent.click(screen.getByText("Documentation"));
    expect(onSelectSerialNo).toHaveBeenCalledWith(42);
  });

  it("renders emoji without breaking highlights or literal code", () => {
    setHookResult({
      drops: [
        {
          ...result,
          parts: [
            {
              content:
                "Wednesday **:el_fafo_angy:** :smile: :unknown_emoji: `:el_fafo_angy:`\n\n```\n:el_fafo_angy:\n```",
            },
          ],
        },
      ],
    });
    render(
      <WaveDropsSearchModal
        isOpen
        onClose={jest.fn()}
        wave={wave}
        onSelectSerialNo={jest.fn()}
        onSearchAll={jest.fn()}
      />
    );
    fireEvent.change(
      screen.getByRole("combobox", { name: "Search messages" }),
      { target: { value: "Wednesday" } }
    );
    const row = screen.getByRole("button", {
      name: "Open message 42 by alice",
    });
    const emoji = screen.getByRole("img", { name: "Emoji :el_fafo_angy:" });
    expect(emoji).toHaveAttribute("src", "/custom-emoji.webp");
    expect(emoji.closest("strong")).not.toBeNull();
    expect(row.querySelector("mark")).toHaveTextContent("Wednesday");
    expect(row).toHaveTextContent("😄 :unknown_emoji:");
    const code = row.querySelectorAll("code");
    expect(code).toHaveLength(2);
    code.forEach((element) => {
      expect(element).toHaveTextContent(":el_fafo_angy:");
      expect(element.querySelector("img")).toBeNull();
    });
  });

  it("keeps adjacent repeated emoji segments uniquely keyed", () => {
    const consoleError = jest.spyOn(console, "error");
    try {
      setHookResult({
        drops: [
          {
            ...result,
            parts: [
              { content: ":el_fafo_angy::el_fafo_angy: modern :smile::smile:" },
            ],
          },
        ],
      });
      render(
        <WaveDropsSearchModal
          isOpen
          onClose={jest.fn()}
          wave={wave}
          onSelectSerialNo={jest.fn()}
          onSearchAll={jest.fn()}
        />
      );
      fireEvent.change(
        screen.getByRole("combobox", { name: "Search messages" }),
        { target: { value: "modern" } }
      );
      expect(
        screen.getAllByRole("img", { name: "Emoji :el_fafo_angy:" })
      ).toHaveLength(2);
      expect(
        screen.getByRole("button", { name: "Open message 42 by alice" })
      ).toHaveTextContent("😄😄");
      expect(consoleError.mock.calls.flat().join(" ")).not.toContain(
        "same key"
      );
    } finally {
      consoleError.mockRestore();
    }
  });

  it.each([
    ["en-US", "Emoji"],
    ["en-GB", "Emoji"],
    ["fr-FR", "Émoji"],
    ["es-ES", "Emoji"],
    ["de-DE", "Emoji"],
  ] as const)("labels custom emojis in %s", (locale, label) => {
    mockLocale = locale;
    setHookResult({
      drops: [{ ...result, parts: [{ content: "modern :el_fafo_angy:" }] }],
    });
    render(
      <WaveDropsSearchModal
        isOpen
        onClose={jest.fn()}
        wave={wave}
        onSelectSerialNo={jest.fn()}
        onSearchAll={jest.fn()}
      />
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "modern" },
    });
    expect(
      screen.getByRole("img", { name: `${label} :el_fafo_angy:` })
    ).toBeInTheDocument();
  });

  it.each([
    "- modern :el_fafo_angy:",
    "1. modern :el_fafo_angy:",
    "#### modern :el_fafo_angy:",
    "##### modern :el_fafo_angy:",
    "###### modern :el_fafo_angy:",
  ])("renders emojis in Markdown blocks: %s", (content) => {
    setHookResult({ drops: [{ ...result, parts: [{ content }] }] });
    render(
      <WaveDropsSearchModal
        isOpen
        onClose={jest.fn()}
        wave={wave}
        onSelectSerialNo={jest.fn()}
        onSearchAll={jest.fn()}
      />
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "modern" },
    });
    expect(
      screen.getByRole("img", { name: "Emoji :el_fafo_angy:" })
    ).toBeInTheDocument();
    expect(screen.getByText("modern").tagName).toBe("MARK");
  });

  it("names each result through one valid label id", () => {
    // Stable keys are raw hash bytes: they can hold white space and control
    // characters, which must not reach the id that names the result. Two
    // drops can also share a hash, and each still needs its own label.
    setHookResult({
      drops: [
        { ...result, stableKey: "k\u0007|\u001f e\n\tZ", stableHash: "0f1e2d" },
        {
          ...result,
          stableKey: "q\r\n x",
          stableHash: "0f1e2d",
          serial_no: 43,
        },
      ],
    });
    render(
      <WaveDropsSearchModal
        isOpen
        onClose={jest.fn()}
        wave={wave}
        onSelectSerialNo={jest.fn()}
      />
    );
    fireEvent.change(
      screen.getByRole("combobox", { name: "Search messages" }),
      {
        target: { value: "modern" },
      }
    );

    const labelIds = [42, 43].map((serialNo) => {
      const resultButton = screen.getByRole("button", {
        name: `Open message ${serialNo} by alice`,
      });
      const labelId = resultButton.getAttribute("aria-labelledby") ?? "";
      // One token: an id list splits on white space.
      expect(labelId).toMatch(/^\S+$/);
      expect(document.getElementById(labelId)).toHaveTextContent(
        `Open message ${serialNo} by alice`
      );
      return labelId;
    });
    expect(new Set(labelIds).size).toBe(2);
  });

  it("requires three text characters but permits a valid filter-only search", () => {
    render(
      <WaveDropsSearchModal
        isOpen
        onClose={jest.fn()}
        wave={wave}
        onSelectSerialNo={jest.fn()}
      />
    );
    const input = screen.getByRole("combobox", {
      name: "Search messages",
    });
    fireEvent.change(input, { target: { value: "lo" } });
    expect(useWaveDropsSearch.mock.calls.at(-1)?.[0].enabled).toBe(false);
    fireEvent.change(input, { target: { value: "loo" } });
    expect(useWaveDropsSearch.mock.calls.at(-1)?.[0].enabled).toBe(true);

    fireEvent.change(input, { target: { value: "" } });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "from: ali" } });
    fireEvent.click(screen.getByRole("option", { name: "@ alice" }));
    expect(useWaveDropsSearch.mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({
        term: "",
        authorId: "author-1",
        enabled: true,
      })
    );
  });

  it("keeps focus after choosing an author and supports clearing chips", () => {
    render(
      <WaveDropsSearchModal
        isOpen
        onClose={jest.fn()}
        wave={wave}
        onSelectSerialNo={jest.fn()}
      />
    );
    const input = screen.getByRole("combobox", { name: "Search messages" });
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: "from: ali" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(input).toHaveFocus();
    fireEvent.change(input, { target: { value: "modern" } });
    fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
    expect(input).toHaveValue("");
    expect(
      screen.getByRole("button", { name: "Remove wave filter Design Wave" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Remove author filter alice" })
    ).toBeInTheDocument();
    expect(useWaveDropsSearch.mock.calls.at(-1)?.[0]).toMatchObject({
      term: "",
      authorId: "author-1",
      enabled: true,
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Remove author filter alice" })
    );
    expect(useWaveDropsSearch.mock.calls.at(-1)?.[0].enabled).toBe(false);
    fireEvent.change(input, { target: { value: "modern" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Remove wave filter Design Wave" })
    );
    expect(useWaveDropsSearch.mock.calls.at(-1)?.[0]).toMatchObject({
      wave: null,
      allowGlobalSearch: true,
      enabled: true,
    });
  });

  it("opens a message from another Wave instead of scrolling the origin", () => {
    setHookResult({
      drops: [
        {
          ...result,
          wave: { id: "other-wave", name: "Other Wave", is_dm_wave: false },
        },
      ],
    });
    const onSelectSerialNo = jest.fn();
    const onClose = jest.fn();
    render(
      <WaveDropsSearchModal
        isOpen
        onClose={onClose}
        wave={wave}
        onSelectSerialNo={onSelectSerialNo}
      />
    );
    fireEvent.change(
      screen.getByRole("combobox", { name: "Search messages" }),
      { target: { value: "modern" } }
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Remove wave filter Design Wave" })
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Open message 42 by alice in Other Wave",
      })
    );
    expect(mockPush).toHaveBeenCalledWith("/waves/other-wave?serialNo=42");
    expect(onSelectSerialNo).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("allows continuation when an authorized page has no visible results", () => {
    const fetchNextPage = jest.fn(() => Promise.resolve());
    setHookResult({ drops: [], hasNextPage: true, fetchNextPage });
    render(
      <WaveDropsSearchModal
        isOpen
        onClose={jest.fn()}
        wave={wave}
        onSelectSerialNo={jest.fn()}
      />
    );
    fireEvent.change(
      screen.getByRole("combobox", { name: "Search messages" }),
      { target: { value: "modern" } }
    );
    expect(screen.queryByText("No messages found")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    expect(fetchNextPage).toHaveBeenCalled();
  });

  it("offers retry when message search fails", () => {
    setHookResult({ drops: [], isError: true });
    render(
      <WaveDropsSearchModal
        isOpen
        onClose={jest.fn()}
        wave={wave}
        onSelectSerialNo={jest.fn()}
      />
    );
    fireEvent.change(
      screen.getByRole("combobox", {
        name: "Search messages",
      }),
      { target: { value: "broken" } }
    );

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalled();
  });

  it("shows an author initial when the result has no profile picture", () => {
    setHookResult({
      drops: [
        {
          ...result,
          author: { ...result.author, pfp: null },
        },
      ],
    });
    render(
      <WaveDropsSearchModal
        isOpen
        onClose={jest.fn()}
        wave={wave}
        onSelectSerialNo={jest.fn()}
      />
    );
    fireEvent.change(
      screen.getByRole("combobox", {
        name: "Search messages",
      }),
      { target: { value: "modern" } }
    );

    const resultButton = screen.getByRole("button", {
      name: "Open message 42 by alice",
    });
    expect(resultButton.querySelector("img")).toBeNull();
    expect(resultButton).toHaveTextContent("A");
  });

  it("keeps the query when the same wave search is reopened", () => {
    const { rerender } = render(
      <WaveDropsSearchModal
        isOpen
        onClose={jest.fn()}
        wave={wave}
        onSelectSerialNo={jest.fn()}
      />
    );
    fireEvent.change(
      screen.getByRole("combobox", {
        name: "Search messages",
      }),
      { target: { value: "remember me" } }
    );

    rerender(
      <WaveDropsSearchModal
        isOpen={false}
        onClose={jest.fn()}
        wave={wave}
        onSelectSerialNo={jest.fn()}
      />
    );
    rerender(
      <WaveDropsSearchModal
        isOpen
        onClose={jest.fn()}
        wave={wave}
        onSelectSerialNo={jest.fn()}
      />
    );

    expect(
      screen.getByRole("combobox", {
        name: "Search messages",
      })
    ).toHaveValue("remember me");
  });
});
