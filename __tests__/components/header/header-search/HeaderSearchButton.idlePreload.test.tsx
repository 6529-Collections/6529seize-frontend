import HeaderSearchButton from "@/components/header/header-search/HeaderSearchButton";
import { fireEvent, render, screen } from "@testing-library/react";

const mockPreloadSite = jest.fn();
const mockSiteIdlePreload = jest.fn();
const mockPreloadWave = jest.fn();
const mockWaveIdlePreload = jest.fn();

jest.mock("@/components/header/header-search/LazyHeaderSearchModal", () => ({
  __esModule: true,
  default: () => null,
  preloadHeaderSearchModal: () => mockPreloadSite(),
  useHeaderSearchModalIdlePreload: (enabled?: boolean) =>
    mockSiteIdlePreload(enabled),
}));

jest.mock("@/components/waves/drops/search/LazyWaveDropsSearchModal", () => ({
  __esModule: true,
  default: () => null,
  preloadWaveDropsSearchModal: () => mockPreloadWave(),
  useWaveDropsSearchModalIdlePreload: (enabled?: boolean) =>
    mockWaveIdlePreload(enabled),
}));

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

beforeEach(() => jest.clearAllMocks());

const lastEnabled = (mock: jest.Mock) =>
  mock.mock.calls[mock.mock.calls.length - 1]?.[0];

describe("HeaderSearchButton chunk warm-up", () => {
  it("asks to warm the site modal when idle, and the scoped one only in a wave", () => {
    const { rerender } = render(<HeaderSearchButton wave={null} />);

    expect(lastEnabled(mockSiteIdlePreload)).toBe(true);
    expect(lastEnabled(mockWaveIdlePreload)).toBe(false);
    // Nothing is fetched eagerly: only the idle hook is involved.
    expect(mockPreloadSite).not.toHaveBeenCalled();
    expect(mockPreloadWave).not.toHaveBeenCalled();

    rerender(<HeaderSearchButton wave={wave} />);

    expect(lastEnabled(mockSiteIdlePreload)).toBe(false);
    expect(lastEnabled(mockWaveIdlePreload)).toBe(true);
  });

  it("warms the modal it would open on hover and on keyboard focus", () => {
    render(<HeaderSearchButton wave={null} />);
    const button = screen.getByRole("button", { name: "Search 6529" });

    fireEvent.pointerEnter(button);
    fireEvent.focus(button);

    expect(mockPreloadSite).toHaveBeenCalled();
    expect(mockPreloadWave).not.toHaveBeenCalled();
  });
});
