import HeaderSearchButton from "@/components/header/header-search/HeaderSearchButton";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// These tests share one module registry on purpose: whether a modal chunk has
// been fetched is the behavior under test, so the order below is meaningful.
let mockSiteModalLoads = 0;
let mockWaveModalLoads = 0;
let mockWaveModalMounts = 0;
let mockShortcutFilter: (event: KeyboardEvent) => boolean = () => false;
let mockShortcutHandler: (event: KeyboardEvent) => void = () => undefined;

// The repo-wide react-use mock stubs useKey out, so capture the shortcut here.
jest.mock("react-use", () => ({
  useKey: (
    filter: (event: KeyboardEvent) => boolean,
    handler: (event: KeyboardEvent) => void
  ) => {
    mockShortcutFilter = filter;
    mockShortcutHandler = handler;
  },
}));

jest.mock("@/components/header/header-search/HeaderSearchModal", () => {
  mockSiteModalLoads += 1;
  const { useEffect, useRef } = require("react");

  function MockHeaderSearchModal({ onClose }: { onClose: () => void }) {
    const inputRef = useRef(null as HTMLInputElement | null);
    useEffect(() => {
      inputRef.current?.focus();
    }, []);
    return (
      <div role="dialog" aria-label="Site search">
        <input ref={inputRef} aria-label="Site search input" />
        <button type="button" onClick={onClose}>
          Close site search
        </button>
      </div>
    );
  }

  return { __esModule: true, default: MockHeaderSearchModal };
});

jest.mock("@/components/waves/drops/search/WaveDropsSearchModal", () => {
  mockWaveModalLoads += 1;
  const { useEffect, useRef, useState } = require("react");

  // Like the real modal, state lives above the isOpen check so it survives a
  // close, and the input is focused whenever the modal opens.
  function MockWaveDropsSearchModal({
    isOpen,
    onClose,
  }: {
    isOpen: boolean;
    onClose: () => void;
  }) {
    const [query, setQuery] = useState("");
    const inputRef = useRef(null as HTMLInputElement | null);
    useEffect(() => {
      mockWaveModalMounts += 1;
    }, []);
    useEffect(() => {
      if (isOpen) inputRef.current?.focus();
    }, [isOpen]);
    if (!isOpen) return null;
    return (
      <div role="dialog" aria-label="Wave search">
        <input
          ref={inputRef}
          aria-label="Wave search input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="button" onClick={onClose}>
          Close wave search
        </button>
      </div>
    );
  }

  return { __esModule: true, default: MockWaveDropsSearchModal };
});

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
  usePathname: () => "/waves/wave-1",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/contexts/wave/WaveChatScrollContext", () => ({
  useWaveChatScrollOptional: () => null,
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: false }),
}));

const wave = { id: "wave-1", name: "Design Wave" } as any;

describe("lazy header search modals", () => {
  it("fetches neither chunk before search opens, then preloads the scoped one on intent", async () => {
    const user = userEvent.setup();
    render(<HeaderSearchButton wave={wave} />);

    expect(mockSiteModalLoads).toBe(0);
    expect(mockWaveModalLoads).toBe(0);
    expect(screen.queryByRole("dialog")).toBeNull();

    await user.hover(
      screen.getByRole("button", { name: "Search messages in Design Wave" })
    );

    // Hover warms the chunk for the modal this button would open, but opens
    // nothing and never touches the other modal.
    await waitFor(() => expect(mockWaveModalLoads).toBe(1));
    expect(mockSiteModalLoads).toBe(0);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("opens site search from the shortcut before its chunk loads, then focuses the input", async () => {
    render(<HeaderSearchButton wave={null} />);
    expect(mockSiteModalLoads).toBe(0);

    const trigger = screen.getByRole("button", { name: "Search 6529" });
    await waitFor(() => expect(trigger).toBeEnabled());

    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      cancelable: true,
    });
    expect(mockShortcutFilter(event)).toBe(true);
    act(() => {
      mockShortcutHandler(event);
    });

    expect(event.defaultPrevented).toBe(true);
    // The chunk is still in flight, so nothing is on screen yet. The open
    // intent is already recorded and must not be lost.
    expect(screen.queryByRole("dialog")).toBeNull();

    const input = await screen.findByRole("textbox", {
      name: "Site search input",
    });
    expect(mockSiteModalLoads).toBe(1);
    expect(input).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: "Close site search" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("mounts the wave modal on first open and keeps its query across a close", async () => {
    const user = userEvent.setup();
    render(<HeaderSearchButton wave={wave} />);
    const trigger = screen.getByRole("button", {
      name: "Search messages in Design Wave",
    });
    await waitFor(() => expect(trigger).toBeEnabled());
    expect(mockWaveModalMounts).toBe(0);

    await user.click(trigger);
    const input = await screen.findByRole("textbox", {
      name: "Wave search input",
    });
    expect(input).toHaveFocus();
    expect(mockWaveModalMounts).toBe(1);

    await user.type(input, "release notes");
    await user.click(screen.getByRole("button", { name: "Close wave search" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(trigger).toHaveFocus());

    await user.click(trigger);
    const reopened = await screen.findByRole("textbox", {
      name: "Wave search input",
    });
    expect(reopened).toHaveValue("release notes");
    expect(reopened).toHaveFocus();
    expect(mockWaveModalMounts).toBe(1);
  });
});
