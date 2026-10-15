import HeaderSearchButton from "@/components/header/header-search/HeaderSearchButton";
import LazyHeaderSearchModal from "@/components/header/header-search/LazyHeaderSearchModal";
import LazyWaveDropsSearchModal from "@/components/waves/drops/search/LazyWaveDropsSearchModal";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

// These tests share one module registry on purpose: whether a modal chunk has
// resolved yet is the behavior under test, so each modal's race test must run
// before anything else loads that modal. The order below is meaningful.
let mockSiteModalLoads = 0;
let mockSiteModalMounts = 0;
let mockWaveModalLoads = 0;

// Like the real modals, once mounted they own Escape themselves.
jest.mock("@/components/header/header-search/HeaderSearchModal", () => {
  mockSiteModalLoads += 1;
  const { useEffect } = require("react");

  function MockHeaderSearchModal({ onClose }: { onClose: () => void }) {
    useEffect(() => {
      mockSiteModalMounts += 1;
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") onClose();
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose]);
    return <div role="dialog" aria-label="Site search" />;
  }

  return { __esModule: true, default: MockHeaderSearchModal };
});

jest.mock("@/components/waves/drops/search/WaveDropsSearchModal", () => {
  mockWaveModalLoads += 1;
  const { useEffect } = require("react");

  function MockWaveDropsSearchModal({
    isOpen,
    onClose,
  }: {
    isOpen: boolean;
    onClose: () => void;
  }) {
    useEffect(() => {
      const onKeyDown = (event: KeyboardEvent) => {
        if (isOpen && event.key === "Escape") onClose();
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [isOpen, onClose]);
    return isOpen ? <div role="dialog" aria-label="Wave search" /> : null;
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

// Lets the dynamic import resolve and React commit whatever it renders.
const settleLazyLoad = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

const pressEscape = () => fireEvent.keyDown(window, { key: "Escape" });

describe("Escape while the search modal chunk is still loading", () => {
  it("cancels site search opened just before its chunk arrives, so the modal never appears", async () => {
    render(<HeaderSearchButton wave={null} />);
    const trigger = screen.getByRole("button", { name: "Search 6529" });
    await waitFor(() => expect(trigger).toBeEnabled());

    // No awaiting between the two events: the chunk cannot have arrived.
    fireEvent.click(trigger);
    expect(screen.queryByRole("dialog")).toBeNull();
    pressEscape();

    await waitFor(() => expect(mockSiteModalLoads).toBe(1));
    await settleLazyLoad();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(mockSiteModalMounts).toBe(0);
    // Same as a normal close: focus returns to the trigger.
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("cancels wave search opened just before its chunk arrives, and it opens normally afterwards", async () => {
    render(<HeaderSearchButton wave={wave} />);
    const trigger = screen.getByRole("button", {
      name: "Search messages in Design Wave",
    });
    await waitFor(() => expect(trigger).toBeEnabled());
    expect(mockWaveModalLoads).toBe(0);

    fireEvent.click(trigger);
    expect(screen.queryByRole("dialog")).toBeNull();
    pressEscape();

    await waitFor(() => expect(mockWaveModalLoads).toBe(1));
    await settleLazyLoad();
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(trigger).toHaveFocus());

    fireEvent.click(trigger);
    expect(
      await screen.findByRole("dialog", { name: "Wave search" })
    ).toBeInTheDocument();
  });

  it("leaves Escape to the site modal once it has loaded", async () => {
    const onClose = jest.fn();
    render(<LazyHeaderSearchModal onClose={onClose} wave={null} />);
    await screen.findByRole("dialog", { name: "Site search" });

    pressEscape();

    // Exactly once: the loading fallback no longer listens.
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("leaves Escape to the wave modal once it has loaded", async () => {
    const onClose = jest.fn();
    render(
      <LazyWaveDropsSearchModal
        isOpen
        onClose={onClose}
        wave={wave}
        onSelectSerialNo={jest.fn()}
      />
    );
    await screen.findByRole("dialog", { name: "Wave search" });

    pressEscape();

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
