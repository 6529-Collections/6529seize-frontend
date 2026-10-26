import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";

const registerRef = jest.fn();
const mockReplace = jest.fn();
const mockSetTab = jest.fn();
const mockRequestScroll = jest.fn();
let mockPathname = "/waves/w1";
let mockSearchParams = "curation=c1&divider=1";
let mockScroll: { requestScrollToSerialNo: typeof mockRequestScroll } | null =
  null;
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(mockSearchParams),
  useRouter: () => ({ replace: mockReplace }),
}));
jest.mock("@/components/brain/ContentTabContext", () => ({
  useContentTab: () => ({ setActiveContentTab: mockSetTab }),
}));
jest.mock("@/contexts/wave/WaveChatScrollContext", () => ({
  useWaveChatScrollOptional: () => mockScroll,
}));
jest.mock("@/components/waves/drops/search/LazyWaveDropsSearchModal", () => ({
  __esModule: true,
  default: ({
    isOpen,
    onClose,
    onSearchAll,
    onSelectSerialNo,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onSearchAll: () => void;
    onSelectSerialNo: (serial: number) => void;
  }) =>
    isOpen ? (
      <div role="dialog" aria-label="Message search">
        <input aria-label="Query" autoFocus />
        <button onClick={onSearchAll}>Search all</button>
        <button onClick={() => onSelectSerialNo(42)}>Result</button>
        <button onClick={onClose}>Close search</button>
      </div>
    ) : null,
}));
jest.mock("@/components/header/header-search/LazyHeaderSearchModal", () => ({
  __esModule: true,
  default: () => <div role="dialog" aria-label="Site search" />,
}));

jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ registerRef }),
}));

jest.mock("@/hooks/useWave", () => ({
  useWave: jest.fn(),
}));

jest.mock("@/components/brain/my-stream/tabs/MyStreamWaveTabsMeme", () => ({
  __esModule: true,
  default: () => {
    const { useOpenMyStreamWaveSearch } = jest.requireActual(
      "@/components/brain/my-stream/tabs/MyStreamWaveSearch"
    );
    const { open, trigger } = useOpenMyStreamWaveSearch();
    return (
      <button ref={trigger} data-testid="meme" onClick={open}>
        Search messages
      </button>
    );
  },
}));

jest.mock("@/components/brain/my-stream/tabs/MyStreamWaveTabsDefault", () => ({
  __esModule: true,
  default: () => {
    const { useOpenMyStreamWaveSearch } = jest.requireActual(
      "@/components/brain/my-stream/tabs/MyStreamWaveSearch"
    );
    const { open, trigger } = useOpenMyStreamWaveSearch();
    return (
      <button ref={trigger} data-testid="default" onClick={open}>
        Search messages
      </button>
    );
  },
}));

import { MyStreamWaveTabs } from "@/components/brain/my-stream/tabs/MyStreamWaveTabs";
import { MyStreamWaveTab } from "@/types/waves.types";
import type { ApiWave } from "@/generated/models/ApiWave";
const { useWave } = require("@/hooks/useWave");

describe("MyStreamWaveTabs", () => {
  const wave: ApiWave = { id: "w1", name: "Wave 1" } as ApiWave;
  const mockToggleViewMode = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = "/waves/w1";
    mockSearchParams = "curation=c1&divider=1";
    mockScroll = null;
  });

  it("renders meme tabs when wave is a memes wave and registers ref", () => {
    (useWave as jest.Mock).mockReturnValue({ isMemesWave: true });
    render(
      <MyStreamWaveTabs
        wave={wave}
        competitionSubmissionReady
        viewMode="chat"
        onToggleViewMode={mockToggleViewMode}
        showGalleryToggle={false}
      />
    );
    const container = document.getElementById("tabs-container");
    expect(screen.getByTestId("meme")).toBeInTheDocument();
    expect(screen.queryByTestId("default")).toBeNull();
    expect(registerRef).toHaveBeenCalledWith("tabs", container);
  });

  it("renders default tabs when wave is not a memes wave", () => {
    (useWave as jest.Mock).mockReturnValue({ isMemesWave: false });
    render(
      <MyStreamWaveTabs
        wave={wave}
        viewMode="chat"
        onToggleViewMode={mockToggleViewMode}
        showGalleryToggle={true}
      />
    );
    expect(screen.getByTestId("default")).toBeInTheDocument();
    expect(screen.queryByTestId("meme")).toBeNull();
  });

  it("keeps the shared tabs while the native submission target is unresolved", () => {
    (useWave as jest.Mock).mockReturnValue({ isMemesWave: true });
    render(
      <MyStreamWaveTabs
        wave={wave}
        viewMode="chat"
        onToggleViewMode={mockToggleViewMode}
        showGalleryToggle={false}
      />
    );
    expect(screen.getByTestId("default")).toBeInTheDocument();
    expect(screen.queryByTestId("meme")).toBeNull();
  });

  it("keeps the same open search, query and focus while competition resolution replaces the header", async () => {
    (useWave as jest.Mock).mockReturnValue({ isMemesWave: true });
    const selectCuration = jest.fn();
    const tabs = (ready: boolean, id = "w1") => (
      <MyStreamWaveTabs
        wave={{ id, name: "Wave" } as ApiWave}
        competitionSubmissionReady={ready}
        viewMode="chat"
        onToggleViewMode={jest.fn()}
        showGalleryToggle={false}
        onSelectCuration={selectCuration}
      />
    );
    const { rerender } = render(tabs(false));
    fireEvent.click(screen.getByRole("button", { name: "Search messages" }));
    const input = screen.getByRole("textbox", { name: "Query" });
    fireEvent.change(input, { target: { value: "preserve this query" } });
    expect(input).toHaveFocus();
    rerender(tabs(true));
    expect(screen.getByTestId("meme")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBe(input);
    expect(input).toHaveValue("preserve this query");
    expect(input).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Close search" }));
    await waitFor(() => expect(screen.getByTestId("meme")).toHaveFocus());
    fireEvent.click(screen.getByTestId("meme"));
    const reopenedInput = screen.getByRole("textbox");
    // Refetching back to shared tabs must also preserve the dialog.
    rerender(tabs(false));
    expect(screen.getByRole("textbox")).toBe(reopenedInput);
    fireEvent.click(screen.getByRole("button", { name: "Result" }));
    expect(selectCuration).toHaveBeenCalledWith(null);
    expect(mockReplace).toHaveBeenCalledWith(
      "/waves/w1?divider=1&serialNo=42",
      {
        scroll: false,
      }
    );
    fireEvent.click(screen.getByRole("button", { name: "Search all" }));
    expect(screen.queryByRole("dialog", { name: "Message search" })).toBeNull();
    expect(
      screen.getByRole("dialog", { name: "Site search" })
    ).toBeInTheDocument();
    rerender(tabs(true, "w2"));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("selects a message in place when the current route has a scroll context", () => {
    mockScroll = { requestScrollToSerialNo: mockRequestScroll };
    (useWave as jest.Mock).mockReturnValue({ isMemesWave: false });
    const onSelectCuration = jest.fn();
    render(
      <MyStreamWaveTabs
        wave={{ id: "w1" } as ApiWave}
        viewMode="chat"
        onToggleViewMode={jest.fn()}
        showGalleryToggle={false}
        onSelectCuration={onSelectCuration}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Search messages" }));
    fireEvent.click(screen.getByRole("button", { name: "Result" }));
    expect(onSelectCuration).toHaveBeenCalledWith(null);
    expect(mockSetTab).toHaveBeenCalledWith(MyStreamWaveTab.CHAT);
    expect(mockRequestScroll).toHaveBeenCalledWith({
      waveId: "w1",
      serialNo: 42,
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("uses the current competition route and query after a header transition instead of scrolling", () => {
    mockScroll = { requestScrollToSerialNo: mockRequestScroll };
    (useWave as jest.Mock).mockReturnValue({ isMemesWave: true });
    const onSelectCuration = jest.fn();
    const tabs = (ready: boolean) => (
      <MyStreamWaveTabs
        wave={{ id: "w2" } as ApiWave}
        viewMode="chat"
        onToggleViewMode={jest.fn()}
        showGalleryToggle={false}
        competitionSubmissionReady={ready}
        onSelectCuration={onSelectCuration}
      />
    );
    const { rerender } = render(tabs(false));
    fireEvent.click(screen.getByRole("button", { name: "Search messages" }));
    mockPathname = "/waves/w2/competitions/current";
    mockSearchParams = "curation=current&divider=latest";
    rerender(tabs(true));
    fireEvent.click(screen.getByRole("button", { name: "Result" }));
    expect(onSelectCuration).toHaveBeenCalledWith(null);
    expect(mockSetTab).toHaveBeenCalledWith(MyStreamWaveTab.CHAT);
    expect(mockRequestScroll).not.toHaveBeenCalled();
    expect(mockReplace).toHaveBeenCalledWith(
      "/waves/w2?divider=latest&serialNo=42",
      { scroll: false }
    );
  });
});
