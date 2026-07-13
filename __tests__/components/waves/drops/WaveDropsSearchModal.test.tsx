import WaveDropsSearchModal from "@/components/waves/drops/search/WaveDropsSearchModal";
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";

const useWaveDropsSearch = jest.fn();
const refetch = jest.fn(() => Promise.resolve());

jest.mock("@/hooks/useWaveDropsSearch", () => ({
  useWaveDropsSearch: (...args: unknown[]) => useWaveDropsSearch(...args),
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
  parts: [{ content: "A **modern** search result" }],
  author: { handle: "alice", primary_address: "0x1" },
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
    expect(screen.getByText("modern").tagName).toBe("MARK");
    fireEvent.click(resultButton);
    expect(onSelectSerialNo).toHaveBeenCalledWith(42);
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
