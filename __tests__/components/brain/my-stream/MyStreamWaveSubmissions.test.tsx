import { render } from "@testing-library/react";
import MyStreamWaveSubmissions from "@/components/brain/my-stream/MyStreamWaveSubmissions";
import {
  useWaveDropsLeaderboard,
  WaveDropsLeaderboardSort,
} from "@/hooks/useWaveDropsLeaderboard";
import { useWaveCurationGroups } from "@/hooks/waves/useWaveCurationGroups";

let searchParamsString = "";
const push = jest.fn();

jest.mock("@/hooks/useWaveDropsLeaderboard");
jest.mock("@/hooks/waves/useWaveCurationGroups");
jest.mock("@/hooks/useIntersectionObserver", () => ({
  useIntersectionObserver: jest.fn(() => ({ current: null })),
}));
jest.mock("@/components/brain/my-stream/layout/LayoutContext", () => ({
  useLayout: () => ({ leaderboardViewStyle: {} }),
}));
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  usePathname: () => "/waves",
  useSearchParams: () => {
    const params = new URLSearchParams(searchParamsString);

    return {
      get: (key: string) => params.get(key),
      toString: () => searchParamsString,
    };
  },
}));
jest.mock("@/components/waves/drops/participation/ParticipationDrop", () => ({
  __esModule: true,
  default: (props: any) => <div data-testid="drop">{props.drop.id}</div>,
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
const useWaveCurationGroupsMock = useWaveCurationGroups as jest.Mock;

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
    useWaveCurationGroupsMock.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    });
  });

  it("forwards a valid curated_by_group filter to the submissions query", () => {
    searchParamsString = "curated_by_group=group-1";
    useWaveCurationGroupsMock.mockReturnValue({
      data: [{ id: "group-1", name: "Curators", group_id: "g1" }],
      isLoading: false,
      isError: false,
    });

    render(<MyStreamWaveSubmissions wave={wave} onDropClick={jest.fn()} />);

    expect(useWaveDropsLeaderboardMock).toHaveBeenCalledWith({
      waveId: "1",
      sort: WaveDropsLeaderboardSort.RANK,
      curatedByGroupId: "group-1",
    });
  });

  it("drops an unknown curated_by_group filter after groups load", () => {
    searchParamsString = "curated_by_group=group-1";
    useWaveCurationGroupsMock.mockReturnValue({
      data: [{ id: "group-2", name: "Other Curators", group_id: "g2" }],
      isLoading: false,
      isError: false,
    });

    render(<MyStreamWaveSubmissions wave={wave} onDropClick={jest.fn()} />);

    expect(useWaveDropsLeaderboardMock).toHaveBeenCalledWith({
      waveId: "1",
      sort: WaveDropsLeaderboardSort.RANK,
      curatedByGroupId: undefined,
    });
  });

  it("keeps the raw curated_by_group filter while groups are loading", () => {
    searchParamsString = "curated_by_group=group-1";
    useWaveCurationGroupsMock.mockReturnValue({
      data: [],
      isLoading: true,
      isError: false,
    });

    render(<MyStreamWaveSubmissions wave={wave} onDropClick={jest.fn()} />);

    expect(useWaveDropsLeaderboardMock).toHaveBeenCalledWith({
      waveId: "1",
      sort: WaveDropsLeaderboardSort.RANK,
      curatedByGroupId: "group-1",
    });
  });
});
