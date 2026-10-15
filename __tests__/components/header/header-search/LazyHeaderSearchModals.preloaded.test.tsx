import HeaderSearchButton from "@/components/header/header-search/HeaderSearchButton";
import { preloadHeaderSearchModal } from "@/components/header/header-search/LazyHeaderSearchModal";
import { preloadWaveDropsSearchModal } from "@/components/waves/drops/search/LazyWaveDropsSearchModal";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

// Its own file, so a modal's chunk is fetched by a preload and by nothing
// else before it is opened: the warm-up path (hover, focus or idle).
jest.mock("@/components/header/header-search/HeaderSearchModal", () => {
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
  const { useEffect, useRef } = require("react");
  function MockWaveDropsSearchModal({ isOpen }: { isOpen: boolean }) {
    const inputRef = useRef(null as HTMLInputElement | null);
    useEffect(() => {
      if (isOpen) inputRef.current?.focus();
    }, [isOpen]);
    return isOpen ? (
      <input ref={inputRef} aria-label="Wave search input" />
    ) : null;
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

const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

// Nothing below awaits after the click: with the chunk already fetched, the
// modal must be in the DOM, and focused, as soon as the click returns. A
// next/dynamic loader still suspended here on the first render even though the
// module was cached, and React throttled the reveal by about 300 ms.
describe("opening search after its chunk was preloaded", () => {
  it("shows site search in the same commit as the click", async () => {
    preloadHeaderSearchModal();
    await settle();
    render(<HeaderSearchButton wave={null} />);
    const trigger = screen.getByRole("button", { name: "Search 6529" });
    await waitFor(() => expect(trigger).toBeEnabled());

    fireEvent.click(trigger);

    expect(
      screen.getByRole("textbox", { name: "Site search input" })
    ).toHaveFocus();
  });

  it("shows wave search in the same commit as the click", async () => {
    preloadWaveDropsSearchModal();
    await settle();
    render(<HeaderSearchButton wave={wave} />);
    const trigger = screen.getByRole("button", {
      name: "Search messages in Design Wave",
    });
    await waitFor(() => expect(trigger).toBeEnabled());

    fireEvent.click(trigger);

    expect(
      screen.getByRole("textbox", { name: "Wave search input" })
    ).toHaveFocus();
  });
});
