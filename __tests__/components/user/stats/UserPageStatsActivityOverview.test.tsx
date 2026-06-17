import { render, screen, waitFor, within } from "@testing-library/react";
import UserPageStatsActivityOverview from "@/components/user/stats/UserPageStatsActivityOverview";
import { formatInteger, formatNumber } from "@/i18n/format";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const profile: any = { wallets: [{ wallet: "0xabc" }] };

const activityText = (
  key: Parameters<typeof t>[1],
  params?: Parameters<typeof t>[2],
  locale: Parameters<typeof t>[0] = DEFAULT_LOCALE
) => t(locale, key, params);

function mockActivityResponses() {
  (commonApiFetch as jest.Mock)
    .mockResolvedValueOnce({
      airdrops: 1000,
      airdrops_memes: 800,
      airdrops_nextgen: 100,
      airdrops_gradients: 50,
      airdrops_memelab: 50,
      transfers_in: 25,
      transfers_in_memes: 20,
      transfers_in_nextgen: 2,
      transfers_in_gradients: 2,
      transfers_in_memelab: 1,
      primary_purchases_count: 4,
      primary_purchases_value: 1.234,
      secondary_purchases_count: 3,
      secondary_purchases_value: 2.345,
      transfers_out: 2,
      burns: 1,
      sales_count: 5,
      sales_value: 6.789,
    })
    .mockResolvedValueOnce([
      {
        consolidation_key: "wallet:0xabc",
        season: 1,
        transfers_in: 9,
        airdrops: 8,
        primary_purchases_count: 7,
        primary_purchases_value: 1.23,
        secondary_purchases_count: 6,
        secondary_purchases_value: 2.34,
        transfers_out: 5,
        burns: 4,
        sales_count: 3,
        sales_value: 4.56,
      },
    ]);
}

describe("UserPageStatsActivityOverview", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockActivityResponses();
  });

  it("calls API on mount", async () => {
    render(
      <UserPageStatsActivityOverview profile={profile} activeAddress={null} />
    );
    await waitFor(() => expect(commonApiFetch).toHaveBeenCalledTimes(2));
    expect((commonApiFetch as jest.Mock).mock.calls[0][0].endpoint).toContain(
      "aggregated-activity/wallet/0xabc"
    );
  });

  it("renders accessible activity overview tables", async () => {
    render(
      <UserPageStatsActivityOverview profile={profile} activeAddress={null} />
    );

    const overviewTable = await screen.findByRole("table", {
      name: activityText(
        "user.collected.stats.activityOverview.tables.overviewCaption"
      ),
    });
    expect(
      within(overviewTable).getByRole("rowheader", {
        name: activityText(
          "user.collected.stats.activityOverview.rows.airdrops"
        ),
      })
    ).toBeInTheDocument();
    expect(within(overviewTable).getByText("1,000")).toBeInTheDocument();
    expect(within(overviewTable).getByText("1.23")).toBeInTheDocument();

    const seasonTable = await screen.findByRole("table", {
      name: activityText(
        "user.collected.stats.activityOverview.tables.memesBySeasonCaption"
      ),
    });
    expect(
      await within(seasonTable).findByRole("rowheader", {
        name: activityText(
          "user.collected.stats.activityOverview.seasonLabel",
          { seasonNumber: 1 }
        ),
      })
    ).toBeInTheDocument();
    expect(
      within(seasonTable).getByRole("columnheader", {
        name: activityText(
          "user.collected.stats.activityOverview.rows.transfersIn"
        ),
      })
    ).toBeInTheDocument();
  });

  it("formats activity overview values with the active locale", async () => {
    const locale = "de-DE";
    render(
      <UserPageStatsActivityOverview
        profile={profile}
        activeAddress={null}
        locale={locale}
      />
    );

    const overviewTable = await screen.findByRole("table", {
      name: activityText(
        "user.collected.stats.activityOverview.tables.overviewCaption",
        undefined,
        locale
      ),
    });

    expect(
      within(overviewTable).getByText(formatInteger(locale, 1000))
    ).toBeInTheDocument();
    expect(
      within(overviewTable).getByText(
        formatNumber(locale, 1.234, { maximumFractionDigits: 2 })
      )
    ).toBeInTheDocument();
  });

  it("shows an empty state instead of an empty season table", async () => {
    (commonApiFetch as jest.Mock)
      .mockReset()
      .mockResolvedValueOnce({
        airdrops: 0,
        transfers_in: 0,
        primary_purchases_count: 0,
        primary_purchases_value: 0,
        secondary_purchases_count: 0,
        secondary_purchases_value: 0,
        transfers_out: 0,
        burns: 0,
        sales_count: 0,
        sales_value: 0,
      })
      .mockResolvedValueOnce([]);

    render(
      <UserPageStatsActivityOverview profile={profile} activeAddress={null} />
    );

    expect(
      await screen.findByText(
        activityText(
          "user.collected.stats.activityOverview.tables.memesBySeasonEmpty"
        )
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("table", {
        name: activityText(
          "user.collected.stats.activityOverview.tables.memesBySeasonCaption"
        ),
      })
    ).not.toBeInTheDocument();
  });
});
