import { render, screen } from "@testing-library/react";
import { DiscoverWaveExplorer } from "@/components/waves/discovery/DiscoverWaveExplorer";
import { ApiWaveScoreSort } from "@/generated/models/ApiWaveScoreSort";
import { ApiWavesOverviewType } from "@/generated/models/ApiWavesOverviewType";
import { ApiWavesV2ListType } from "@/generated/models/ApiWavesV2ListType";

const replaceMock = jest.fn();
let searchParams = "";
let latestExploreProps: Record<string, any> | null = null;

jest.mock("next/navigation", () => ({
  usePathname: () => "/discover",
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () => new URLSearchParams(searchParams),
}));

jest.mock("@/components/home/explore-waves/ExploreWavesSection", () => ({
  ExploreWavesSection: (props: Record<string, any>) => {
    latestExploreProps = props;
    return <div>{props.headerControls}</div>;
  },
}));

describe("DiscoverWaveExplorer", () => {
  beforeEach(() => {
    replaceMock.mockClear();
    searchParams = "";
    latestExploreProps = null;
  });

  it("uses combined score discovery by default", () => {
    render(<DiscoverWaveExplorer />);

    expect(latestExploreProps).toMatchObject({
      title: "Active discussions you are not yet following",
      excludeFollowed: true,
      view: ApiWavesV2ListType.Overview,
      overviewType: ApiWavesOverviewType.ScoredRecentlyDroppedTo,
      scoreSort: ApiWaveScoreSort.Balanced,
      statusLabel: "Balanced waves",
    });
  });

  it("uses the latest-post backend overview without score filters", () => {
    searchParams = "sort=LATEST_POSTS&filter=REP_60";

    render(<DiscoverWaveExplorer />);

    expect(latestExploreProps).toMatchObject({
      excludeFollowed: true,
      view: ApiWavesV2ListType.Overview,
      overviewType: ApiWavesOverviewType.RecentlyDroppedTo,
      scoreSort: undefined,
      minRepSortScore: undefined,
      statusLabel: "Latest Posts waves",
    });
    expect(screen.getByRole("radio", { name: "All" })).toHaveAttribute(
      "aria-checked",
      "true"
    );
    expect(screen.getByRole("radio", { name: "REP 60+" })).toBeDisabled();
  });

  it("uses search order for newest waves without client-side score filters", () => {
    searchParams = "sort=NEWEST&filter=SCORE_50";

    render(<DiscoverWaveExplorer />);

    expect(latestExploreProps).toMatchObject({
      title: "Newest waves",
      excludeFollowed: false,
      view: ApiWavesV2ListType.Search,
      directMessage: false,
      scoreSort: undefined,
      minVisibilityScore: undefined,
      statusLabel: "Newest waves",
    });
  });
});
