import { render, screen } from "@testing-library/react";
import CommunityCurations from "@/components/community-curations/CommunityCurations";

const mockUseCommunityCurationsDrops = jest.fn();
const mockCommitWaveNavigationContent = jest.fn();
let mockIsApp = false;
let mockRestoreScrollOffset = () => true;

jest.mock("@/helpers/waves/wave-navigation-transition", () => ({
  commitWaveNavigationContent: (...args: unknown[]) =>
    mockCommitWaveNavigationContent(...args),
}));

jest.mock("@/hooks/useDeviceInfo", () => ({
  __esModule: true,
  default: () => ({ isApp: mockIsApp }),
}));

jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ waveViewStyle: { height: "600px" } }),
}));

jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));

jest.mock("@/hooks/useCommunityCurationsDrops", () => ({
  useCommunityCurationsDrops: () => mockUseCommunityCurationsDrops(),
}));

jest.mock("@/components/token-list/hooks/usePersistentScrollOffset", () => ({
  usePersistentScrollOffset: () => 240,
}));

jest.mock("@/components/community-curations/CommunityCurationsMasonry", () => ({
  __esModule: true,
  default: ({
    restoreScrollOffset,
  }: {
    restoreScrollOffset: () => boolean;
  }) => {
    mockRestoreScrollOffset = restoreScrollOffset;
    return <div data-testid="profile-feed-masonry" />;
  },
}));

const loadingState = {
  allDrops: [],
  drops: [],
  fetchNextPage: jest.fn(),
  hasNextPage: false,
  isError: false,
  isFetchingNextPage: false,
  isLoading: true,
};

describe("CommunityCurations", () => {
  const scrollTo = jest.fn();

  beforeAll(() => {
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: scrollTo,
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockIsApp = false;
    mockUseCommunityCurationsDrops.mockReturnValue(loadingState);
  });

  it("offers discovery from the feed header even while loading", () => {
    render(<CommunityCurations />);
    expect(
      screen.getByRole("link", { name: "Discover Waves" })
    ).toHaveAttribute("href", "/discover");
  });

  it("restores the saved offset after asynchronous feed content renders", () => {
    const { rerender } = render(<CommunityCurations />);

    expect(scrollTo).not.toHaveBeenCalled();

    const drop = { stableKey: "drop-1" };
    mockUseCommunityCurationsDrops.mockReturnValue({
      ...loadingState,
      allDrops: [drop],
      drops: [drop],
      isLoading: false,
    });
    rerender(<CommunityCurations />);

    expect(screen.getByTestId("profile-feed-masonry")).toBeInTheDocument();
    expect(scrollTo).toHaveBeenCalledWith({ top: 240 });
  });

  it("keeps a native feed return destination on Discover Waves", () => {
    mockIsApp = true;
    render(<CommunityCurations />);
    const href = screen
      .getByRole("link", { name: "Discover Waves" })
      .getAttribute("href");
    const destination = new URL(href!, "http://localhost");
    expect(destination.pathname).toBe("/discover");
    expect(destination.searchParams.get("returnTo")).toBe(
      "/waves?view=profile-feed"
    );
  });

  it("retries a clamped saved offset as later Feed rows grow, then stops", () => {
    let availableTop = 100;
    scrollTo.mockImplementation(function (
      this: HTMLElement,
      { top }: ScrollToOptions
    ) {
      this.scrollTop = Math.min(top ?? 0, availableTop);
    });
    const drop = { stableKey: "drop-1" };
    mockUseCommunityCurationsDrops.mockReturnValue({
      ...loadingState,
      allDrops: [drop],
      drops: [drop],
      isLoading: false,
    });
    const { container } = render(<CommunityCurations />);
    expect(mockRestoreScrollOffset()).toBe(false);
    availableTop = 500;
    expect(mockRestoreScrollOffset()).toBe(true);
    const scroll = container.querySelector("section")!;
    expect(scroll.scrollTop).toBe(240);
    scroll.scrollTop = 200;
    expect(mockRestoreScrollOffset()).toBe(true);
    expect(scroll.scrollTop).toBe(200);
    scrollTo.mockReset();
  });

  it("releases a pagination-only Feed without waiting for absent cards", () => {
    mockUseCommunityCurationsDrops.mockReturnValue({
      ...loadingState,
      isLoading: false,
      hasNextPage: true,
      isFetchingNextPage: true,
    });
    render(<CommunityCurations />);
    expect(screen.getByTestId("profile-feed-masonry")).toBeInTheDocument();
    expect(mockCommitWaveNavigationContent).toHaveBeenCalledWith("feed");
  });
});
