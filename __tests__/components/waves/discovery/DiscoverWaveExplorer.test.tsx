import { fireEvent, render, screen, within } from "@testing-library/react";
import { DiscoverWaveExplorer } from "@/components/waves/discovery/DiscoverWaveExplorer";
import { ApiWaveScoreSort } from "@/generated/models/ApiWaveScoreSort";
import { ApiWavesOverviewType } from "@/generated/models/ApiWavesOverviewType";
import { ApiWavesV2ListType } from "@/generated/models/ApiWavesV2ListType";

const replaceMock = jest.fn();
let searchParams: string | null = "";
let latestExploreProps: Record<string, any> | null = null;
let mockCanUseCollections = false;
jest.mock("@/hooks/useWaveDiscoveryViewer", () => ({
  useWaveDiscoveryViewer: () => ({ canUseCollections: mockCanUseCollections }),
}));

jest.mock("next/navigation", () => ({
  usePathname: () => "/discover",
  useRouter: () => ({ replace: replaceMock }),
  useSearchParams: () =>
    searchParams === null ? null : new URLSearchParams(searchParams),
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
    mockCanUseCollections = false;
  });

  it("uses combined score discovery by default", () => {
    render(<DiscoverWaveExplorer />);

    expect(latestExploreProps).toMatchObject({
      title: "Active discussions",
      excludeFollowed: true,
      view: ApiWavesV2ListType.Overview,
      overviewType: ApiWavesOverviewType.ScoredRecentlyDroppedTo,
      scoreSort: ApiWaveScoreSort.Balanced,
      statusLabel: "Balanced waves",
    });
  });

  it("personalizes discussion copy for an authenticated viewer", () => {
    mockCanUseCollections = true;
    render(<DiscoverWaveExplorer />);
    expect(latestExploreProps?.["title"]).toBe(
      "Active discussions you are not yet following"
    );
  });

  it("defaults to recommendations and permits navigation when search params are unavailable", () => {
    searchParams = null;
    render(<DiscoverWaveExplorer />);

    expect(
      screen.getByRole("tab", { name: "Worth Checking Out" })
    ).toHaveAttribute("aria-selected", "true");
    expect(latestExploreProps).toMatchObject({
      scoreSort: ApiWaveScoreSort.Balanced,
      statusLabel: "Balanced waves",
    });

    fireEvent.click(screen.getByRole("tab", { name: "Active Votes" }));
    expect(replaceMock).toHaveBeenLastCalledWith(
      "/discover?view=active-votes",
      {
        scroll: false,
      }
    );
    fireEvent.click(screen.getByRole("tab", { name: "Worth Checking Out" }));
    expect(replaceMock).toHaveBeenLastCalledWith(
      "/discover?view=recommendations",
      {
        scroll: false,
      }
    );
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

it("associates discovery view controls with the rendered panel", () => {
  searchParams = "";
  render(<DiscoverWaveExplorer />);
  const votes = screen.getByRole("tab", { name: "Active Votes" });
  const recommendations = screen.getByRole("tab", {
    name: "Worth Checking Out",
  });
  expect(screen.getByRole("tabpanel")).toHaveAttribute(
    "id",
    recommendations.getAttribute("aria-controls")
  );
  expect(
    within(
      screen.getByRole("tablist", { name: "Wave discovery" })
    ).getAllByRole("tab")
  ).toEqual([recommendations, votes]);
  expect(recommendations).toHaveAttribute("aria-selected", "true");
  fireEvent.keyDown(recommendations, { key: "ArrowLeft" });
  expect(votes).toHaveFocus();
  expect(replaceMock).toHaveBeenLastCalledWith("/discover?view=active-votes", {
    scroll: false,
  });
  fireEvent.keyDown(votes, { key: "Home" });
  expect(recommendations).toHaveFocus();
  expect(replaceMock).toHaveBeenLastCalledWith(
    "/discover?view=recommendations",
    { scroll: false }
  );
});
