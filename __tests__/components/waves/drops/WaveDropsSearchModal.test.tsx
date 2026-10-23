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
