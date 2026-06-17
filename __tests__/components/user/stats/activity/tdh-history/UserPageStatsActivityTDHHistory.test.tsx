import { render, screen } from "@testing-library/react";
import UserPageStatsActivityTDHHistory from "@/components/user/stats/activity/tdh-history/UserPageStatsActivityTDHHistory";
import { getTdhHistoryMessage } from "@/components/user/stats/activity/tdh-history/tdh-history.messages";
import { useQuery } from "@tanstack/react-query";

jest.mock("@tanstack/react-query");

jest.mock(
  "@/components/user/stats/activity/tdh-history/UserPageStatsActivityTDHHistoryCharts",
  () => ({
    __esModule: true,
    default: (props: { locale: string }) => (
      <div data-testid="charts" data-locale={props.locale} />
    ),
  })
);
jest.mock("@/components/utils/animation/CommonCardSkeleton", () => ({
  __esModule: true,
  default: () => <div data-testid="skeleton" />,
}));

describe("UserPageStatsActivityTDHHistory", () => {
  const mockUseQuery = useQuery as jest.Mock;
  const profile = { consolidation_key: "key" } as any;

  it("shows skeleton while fetching", () => {
    mockUseQuery.mockReturnValue({ isFetching: true, data: undefined });
    render(
      <UserPageStatsActivityTDHHistory profile={profile} locale="de-DE" />
    );
    expect(
      screen.getByRole("heading", {
        name: getTdhHistoryMessage(
          "user.collected.stats.tdhHistory.title",
          undefined,
          "de-DE"
        ),
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        getTdhHistoryMessage(
          "user.collected.stats.tdhHistory.loading",
          undefined,
          "de-DE"
        )
      )
    ).toBeInTheDocument();
    expect(screen.getByTestId("skeleton")).toBeInTheDocument();
  });

  it("renders charts when data available", () => {
    mockUseQuery.mockReturnValue({ isFetching: false, data: [{}] });
    render(
      <UserPageStatsActivityTDHHistory profile={profile} locale="de-DE" />
    );
    expect(screen.getByTestId("charts")).toBeInTheDocument();
    expect(screen.getByTestId("charts")).toHaveAttribute(
      "data-locale",
      "de-DE"
    );
  });

  it("renders fallback when no data", () => {
    mockUseQuery.mockReturnValue({ isFetching: false, data: [] });
    render(
      <UserPageStatsActivityTDHHistory profile={profile} locale="de-DE" />
    );
    expect(screen.getByRole("status")).toHaveTextContent(
      getTdhHistoryMessage(
        "user.collected.stats.tdhHistory.empty",
        undefined,
        "de-DE"
      )
    );
  });
});
