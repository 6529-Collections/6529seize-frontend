import HeaderSearchButton from "@/components/header/header-search/HeaderSearchButton";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

// Its own file, so a modal's chunk is fetched by the first-interaction preload
// and by nothing else before search is opened. The idle fallback is stubbed so
// it cannot be the thing that fetches the chunk.
let mockSiteModalLoads = 0;
let mockWaveModalLoads = 0;

jest.mock("@/components/header/header-search/HeaderSearchModal", () => {
  mockSiteModalLoads += 1;
  const { useEffect, useRef } = require("react");
  function MockHeaderSearchModal() {
    const inputRef = useRef(null as HTMLInputElement | null);
    useEffect(() => {
      inputRef.current?.focus();
    }, []);
    return <input ref={inputRef} aria-label="Site search input" />;
  }
  return { __esModule: true, default: MockHeaderSearchModal };
});

jest.mock("@/components/waves/drops/search/WaveDropsSearchModal", () => {
  mockWaveModalLoads += 1;
  return { __esModule: true, default: () => null };
});

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn() }),
  usePathname: () => "/",
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

describe("search chunks and the visitor's first interaction", () => {
  const idleHost = globalThis as unknown as { requestIdleCallback?: unknown };
  const originalRequestIdleCallback = idleHost.requestIdleCallback;

  beforeEach(() => {
    idleHost.requestIdleCallback = jest.fn();
  });
  afterEach(() => {
    idleHost.requestIdleCallback = originalRequestIdleCallback;
  });

  it("starts fetching them on a lone Ctrl press, so the following Ctrl+K opens at once", async () => {
    render(
      <>
        <HeaderSearchButton wave={null} />
        <HeaderSearchButton wave={wave} />
      </>
    );
    // Hydration alone fetches nothing.
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Search 6529" })).toBeEnabled()
    );
    expect(mockSiteModalLoads).toBe(0);
    expect(mockWaveModalLoads).toBe(0);

    fireEvent.keyDown(window, { key: "Control", ctrlKey: true });

    await waitFor(() => expect(mockSiteModalLoads).toBe(1));
    await waitFor(() => expect(mockWaveModalLoads).toBe(1));

    // Nothing awaited after the click: the chunk is cached, so the modal is in
    // the DOM, focused, as soon as the click returns.
    fireEvent.click(screen.getByRole("button", { name: "Search 6529" }));
    expect(
      screen.getByRole("textbox", { name: "Site search input" })
    ).toHaveFocus();
  });
});
