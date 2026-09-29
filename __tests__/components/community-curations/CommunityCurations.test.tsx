import { render, screen } from "@testing-library/react";
import CommunityCurations from "@/components/community-curations/CommunityCurations";

const mockUseCommunityCurationsDrops = jest.fn();

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
  default: () => <div data-testid="profile-feed-masonry" />,
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
    mockUseCommunityCurationsDrops.mockReturnValue(loadingState);
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
});
