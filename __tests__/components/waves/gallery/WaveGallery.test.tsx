import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { WaveGallery } from "@/components/waves/gallery/WaveGallery";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

interface GalleryState {
  drops: ExtendedDrop[];
  hasNextPage: boolean;
  isError: boolean;
  isFetching: boolean;
  isFetchingNextPage: boolean;
}

const mockFetchNextPage = jest.fn();
const mockGalleryState: GalleryState = {
  drops: [],
  hasNextPage: false,
  isError: false,
  isFetching: false,
  isFetchingNextPage: false,
};
let mockIntersecting = false;

jest.mock("@/hooks/useWaveGalleryDrops", () => ({
  useWaveGalleryDrops: () => ({
    ...mockGalleryState,
    fetchNextPage: mockFetchNextPage,
  }),
}));
jest.mock("@/components/utils/infinite-scroll/InfiniteScrollTrigger", () => ({
  __esModule: true,
  default: ({
    onIntersection,
  }: {
    readonly onIntersection: (isIntersecting: boolean) => void;
  }) => {
    onIntersection(mockIntersecting);
    return <div data-testid="scroll-trigger" />;
  },
}));
jest.mock("@/components/waves/gallery/WaveGalleryItem", () => ({
  WaveGalleryItem: ({ drop }: { readonly drop: { readonly id: string } }) => (
    <div data-testid="gallery-item">{drop.id}</div>
  ),
}));
jest.mock(
  "@/components/content-moderation/ContentModerationDropGate",
  () => ({
    __esModule: true,
    default: ({ children }: { readonly children: ReactNode }) => children,
  })
);

const wave = { id: "wave-1" } as ApiWave;

const renderGallery = (state: Partial<GalleryState>) => {
  Object.assign(mockGalleryState, {
    drops: [],
    hasNextPage: false,
    isError: false,
    isFetching: false,
    isFetchingNextPage: false,
    ...state,
  });
  return render(<WaveGallery wave={wave} onDropClick={jest.fn()} />);
};

beforeEach(() => {
  jest.clearAllMocks();
  mockIntersecting = false;
  mockFetchNextPage.mockResolvedValue(undefined);
});

describe("WaveGallery", () => {
  it("reports an empty gallery once nothing older is left to scan", () => {
    renderGallery({ hasNextPage: false });

    expect(screen.getByText("No media drops yet")).toBeInTheDocument();
    expect(screen.queryByTestId("scroll-trigger")).not.toBeInTheDocument();
  });

  it("keeps paging when a bounded scan ended without media but older drops remain", () => {
    mockIntersecting = true;
    renderGallery({ hasNextPage: true });

    expect(screen.getByText("Loading gallery...")).toBeInTheDocument();
    expect(screen.queryByText("No media drops yet")).not.toBeInTheDocument();
    expect(screen.getByTestId("scroll-trigger")).toBeInTheDocument();
    expect(mockFetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("does not start another scan while one is running", () => {
    renderGallery({ hasNextPage: true, isFetching: true });

    expect(screen.getByText("Loading gallery...")).toBeInTheDocument();
    expect(screen.queryByTestId("scroll-trigger")).not.toBeInTheDocument();
  });

  it("stops scanning after a failed request instead of retrying in a loop", () => {
    renderGallery({ hasNextPage: true, isError: true });

    expect(screen.getByText("No media drops yet")).toBeInTheDocument();
    expect(screen.queryByTestId("scroll-trigger")).not.toBeInTheDocument();
  });

  it("renders loaded media with a load-more trigger", () => {
    renderGallery({
      drops: [{ id: "drop-1", stableKey: "drop-1" } as ExtendedDrop],
      hasNextPage: true,
    });

    expect(screen.getByTestId("gallery-item")).toHaveTextContent("drop-1");
    expect(screen.getByTestId("scroll-trigger")).toBeInTheDocument();
  });
});
