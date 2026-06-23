import { render, screen } from "@testing-library/react";
import UserPageStatsActivityTDHHistoryCharts from "@/components/user/stats/activity/tdh-history/UserPageStatsActivityTDHHistoryCharts";
import { getTdhHistoryMessage } from "@/components/user/stats/activity/tdh-history/tdh-history.messages";
import type { TDHHistory } from "@/entities/ITDH";
import { formatDate } from "@/i18n/format";

jest.mock(
  "@/components/user/stats/activity/tdh-history/UserPageStatsActivityTDHHistoryChart",
  () => ({
    __esModule: true,
    default: (props: any) => (
      <div
        aria-label={props.data.ariaLabel}
        data-testid="chart"
        data-locale={props.locale}
      >
        {props.data.title}:{props.data.datasets[0].label}:
        {props.data.labels.join("|")}
      </div>
    ),
  })
);

describe("UserPageStatsActivityTDHHistoryCharts", () => {
  it("renders no charts when history is empty", () => {
    render(<UserPageStatsActivityTDHHistoryCharts tdhHistory={[]} />);
    expect(
      screen.getByRole("list", {
        name: getTdhHistoryMessage(
          "user.collected.stats.tdhHistory.chartListLabel"
        ),
      })
    ).toBeInTheDocument();
    expect(screen.queryByTestId("chart")).toBeNull();
  });

  it("creates charts from history data", () => {
    const history: TDHHistory[] = [
      {
        date: new Date("2024-01-01T12:00:00.000Z"),
        boosted_tdh: 1,
        net_boosted_tdh: 2,
        created_boosted_tdh: 3,
        destroyed_boosted_tdh: 4,
      } as TDHHistory,
      {
        date: new Date("2024-01-02T12:00:00.000Z"),
        boosted_tdh: 2,
        net_boosted_tdh: 3,
        created_boosted_tdh: 4,
        destroyed_boosted_tdh: 5,
      } as TDHHistory,
    ];
    const locale = "de-DE";
    render(
      <UserPageStatsActivityTDHHistoryCharts
        tdhHistory={history}
        locale={locale}
      />
    );
    const charts = screen.getAllByTestId("chart");
    expect(charts).toHaveLength(4);
    expect(charts[0]).toHaveAttribute("data-locale", locale);
    expect(charts[0]).toHaveTextContent(
      getTdhHistoryMessage(
        "user.collected.stats.tdhHistory.charts.totalTdh.title",
        undefined,
        locale
      )
    );
    expect(charts[0]).toHaveTextContent(
      getTdhHistoryMessage(
        "user.collected.stats.tdhHistory.charts.totalTdh.totalBoosted",
        undefined,
        locale
      )
    );
    expect(charts[0]).toHaveAccessibleName(
      getTdhHistoryMessage(
        "user.collected.stats.tdhHistory.chartAriaLabel",
        {
          title: getTdhHistoryMessage(
            "user.collected.stats.tdhHistory.charts.totalTdh.title",
            undefined,
            locale
          ),
        },
        locale
      )
    );
    expect(charts[0]).toHaveTextContent(
      `${formatDate(locale, history[1]!.date)}|${formatDate(
        locale,
        history[0]!.date
      )}`
    );
  });
});
