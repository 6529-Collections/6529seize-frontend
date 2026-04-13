import { fireEvent, render, screen } from "@testing-library/react";
import MyStreamWaveSubmissions from "@/components/brain/my-stream/MyStreamWaveSubmissions";
import {
  useWaveDropsLeaderboard,
  WaveDropsLeaderboardSort,
} from "@/hooks/useWaveDropsLeaderboard";

let searchParamsString = "";
const push = jest.fn();
const replace = jest.fn();

jest.mock("@/hooks/useWaveDropsLeaderboard");
jest.mock("@/hooks/useIntersectionObserver", () => ({
  useIntersectionObserver: jest.fn(() => ({ current: null })),
}));
jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ leaderboardViewStyle: {} }),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace }),
  usePathname: () => "/waves",
  useSearchParams: () => {
    const params = new URLSearchParams(searchParamsString);

    return {
      get: (key: string) => params.get(key),
      has: (key: string) => params.has(key),
      toString: () => searchParamsString,
    };
  },
}));
jest.mock("@/components/waves/drops/participation/ParticipationDrop", () => ({
  __esModule: true,
  default: (props: any) => (
    <button data-testid="drop" onClick={() => props.onQuoteClick(props.drop)}>
      {props.drop.id}
    </button>
  ),
}));
jest.mock(
  "@/components/waves/leaderboard/drops/WaveLeaderboardLoading",
  () => ({
    WaveLeaderboardLoading: () => <div data-testid="loading" />,
  })
);
jest.mock(
  "@/components/waves/leaderboard/drops/WaveLeaderboardLoadingBar",
  () => ({
    WaveLeaderboardLoadingBar: () => <div data-testid="loading-bar" />,
  })
);

const useWaveDropsLeaderboardMock = useWaveDropsLeaderboard as jest.Mock;

describe("MyStreamWaveSubmissions", () => {
  const wave = { id: "1", wave: { type: "RANK" } } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    searchParamsString = "";
    useWaveDropsLeaderboardMock.mockReturnValue({
      drops: [],
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
    });
  });

  it("does not forward curation_id to the submissions query", () => {
    searchParamsString = "curation_id=group-1";

    render(<MyStreamWaveSubmissions wave={wave} onDropClick={jest.fn()} />);

    expect(useWaveDropsLeaderboardMock).toHaveBeenCalledWith({
      waveId: "1",
      sort: WaveDropsLeaderboardSort.RANK,
      curatedByGroupId: undefined,
    });
  });

  it("removes curation_id from the URL and preserves other params", () => {
    searchParamsString = "wave=wave-1&curation_id=group-1&drop=drop-1";

    render(<MyStreamWaveSubmissions wave={wave} onDropClick={jest.fn()} />);

    expect(replace).toHaveBeenCalledWith("/waves?wave=wave-1&drop=drop-1", {
      scroll: false,
    });
  });

  it("does not replace the URL when curation_id is absent", () => {
    searchParamsString = "wave=wave-1";

    render(<MyStreamWaveSubmissions wave={wave} onDropClick={jest.fn()} />);

    expect(replace).not.toHaveBeenCalled();
  });

  it("does not preserve curation_id when opening a drop", () => {
    searchParamsString = "wave=wave-1&curation_id=group-1";
    useWaveDropsLeaderboardMock.mockReturnValue({
      drops: [{ id: "drop-1" }],
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isFetching: false,
      isFetchingNextPage: false,
    });

    render(<MyStreamWaveSubmissions wave={wave} onDropClick={jest.fn()} />);
    fireEvent.click(screen.getByTestId("drop"));

    expect(push).toHaveBeenCalledWith("/waves?wave=wave-1&drop=drop-1", {
      scroll: false,
    });
  });
});
