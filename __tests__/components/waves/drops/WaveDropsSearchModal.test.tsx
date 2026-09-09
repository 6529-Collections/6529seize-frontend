import WaveDropsSearchModal from "@/components/waves/drops/search/WaveDropsSearchModal";
import { fireEvent, render, screen, within } from "@testing-library/react";
import React from "react";

const useWaveDropsSearch = jest.fn();
const useWaveSearchAuthors = jest.fn();
const refetch = jest.fn(() => Promise.resolve());

jest.mock("@/hooks/useWaveDropsSearch", () => ({
  useWaveDropsSearch: (...args: unknown[]) => useWaveDropsSearch(...args),
}));
jest.mock("@/hooks/useWaveSearchAuthors", () => ({
  useWaveSearchAuthors: (...args: unknown[]) => useWaveSearchAuthors(...args),
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
  serial_no: 42,
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
    setHookResult();
    useWaveSearchAuthors.mockReturnValue({
      data: [
        {
          id: "author-1",
          handle: "alice",
          pfp: "https://example.com/author.png",
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
    expect(screen.getByText("Design Wave")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Search all 6529" })
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByRole("textbox", {
        name: "Search messages in Design Wave",
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
      screen.getByRole("textbox", {
        name: "Search messages in Design Wave",
      }),
      { target: { value: "bob" } }
    );
    expect(screen.getByText("bob").tagName).toBe("MARK");
    fireEvent.click(screen.getByText("Documentation"));
    expect(onSelectSerialNo).toHaveBeenCalledWith(42);
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
    const input = screen.getByRole("textbox", {
      name: "Search messages in Design Wave",
    });
    fireEvent.change(input, { target: { value: "lo" } });
    expect(useWaveDropsSearch.mock.calls.at(-1)?.[0].enabled).toBe(false);
    fireEvent.change(input, { target: { value: "loo" } });
    expect(useWaveDropsSearch.mock.calls.at(-1)?.[0].enabled).toBe(true);

    fireEvent.change(input, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    fireEvent.click(screen.getByRole("button", { name: "alice" }));
    expect(useWaveDropsSearch.mock.calls.at(-1)?.[0]).toEqual(
      expect.objectContaining({
        term: "",
        authorId: "author-1",
        enabled: true,
      })
    );
  });

  it("moves focus into filters and restores it when filters close", () => {
    render(
      <WaveDropsSearchModal
        isOpen
        onClose={jest.fn()}
        wave={wave}
        onSelectSerialNo={jest.fn()}
      />
    );
    const filtersButton = screen.getByRole("button", { name: "Filters" });
    fireEvent.click(filtersButton);
    const filtersDialog = screen.getByRole("dialog", {
      name: "Search filters",
    });
    expect(filtersDialog).not.toHaveAttribute("aria-modal");
    expect(
      within(filtersDialog).getByRole("textbox", { name: "From" })
    ).toHaveFocus();
    const authorButton = within(filtersDialog).getByRole("button", {
      name: "alice",
    });
    authorButton.focus();
    fireEvent.click(authorButton);
    expect(
      within(filtersDialog).queryByRole("textbox", { name: "From" })
    ).not.toBeInTheDocument();
    expect(
      within(filtersDialog).queryByRole("group", { name: "Wave authors" })
    ).not.toBeInTheDocument();
    const clearAuthorButton = within(filtersDialog).getByRole("button", {
      name: "Clear author",
    });
    expect(filtersDialog.querySelector("img")).toHaveAttribute(
      "src",
      expect.stringContaining("author.png")
    );
    expect(clearAuthorButton).toHaveFocus();
    expect(useWaveSearchAuthors.mock.calls.at(-1)?.[0].enabled).toBe(false);
    fireEvent.click(clearAuthorButton);
    expect(
      within(filtersDialog).getByRole("textbox", { name: "From" })
    ).toHaveFocus();
    fireEvent.click(
      within(filtersDialog).getByRole("button", { name: "Close filters" })
    );
    expect(filtersButton).toHaveFocus();
  });

  it("rejects an inverted date range before requesting results", () => {
    render(
      <WaveDropsSearchModal
        isOpen
        onClose={jest.fn()}
        wave={wave}
        onSelectSerialNo={jest.fn()}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    const dateInputs = document.querySelectorAll('input[type="date"]');
    expect(dateInputs[0]).toHaveClass("[color-scheme:dark]");
    expect(dateInputs[1]).toHaveClass("[color-scheme:dark]");
    fireEvent.change(dateInputs[0]!, { target: { value: "2026-08-20" } });
    fireEvent.change(dateInputs[1]!, { target: { value: "2026-08-19" } });
    expect(
      screen.getByText('"After" must be earlier than "Before".')
    ).toBeInTheDocument();
    expect(useWaveDropsSearch.mock.calls.at(-1)?.[0].enabled).toBe(false);
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
      screen.getByRole("textbox", {
        name: "Search messages in Design Wave",
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
      screen.getByRole("textbox", {
        name: "Search messages in Design Wave",
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
      screen.getByRole("textbox", {
        name: "Search messages in Design Wave",
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
      screen.getByRole("textbox", {
        name: "Search messages in Design Wave",
      })
    ).toHaveValue("remember me");
  });
});
