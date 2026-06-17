import { render, screen, within } from "@testing-library/react";
import UserPageStatsBoostBreakdown from "@/components/user/stats/UserPageStatsBoostBreakdown";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";

jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: () => <svg data-testid="icon" />,
}));

const boostText = (
  key: Parameters<typeof t>[1],
  params?: Parameters<typeof t>[2]
) => t(DEFAULT_LOCALE, key, params);

function makeTDH() {
  return {
    boost: 1.5,
    boost_breakdown: {
      memes_card_sets: {
        available: 2,
        available_info: ["info"],
        acquired: 1,
        acquired_info: [],
      },
      gradients: {
        available: 1,
        available_info: [],
        acquired: 0.5,
        acquired_info: [],
      },
      memes_szn1: undefined,
      memes_szn2: undefined,
      memes_szn3: undefined,
      memes_szn4: undefined,
      memes_szn5: undefined,
      memes_szn6: undefined,
      memes_szn7: undefined,
      memes_szn8: undefined,
      memes_szn9: undefined,
      memes_szn10: undefined,
      memes_szn11: undefined,
      memes_genesis: undefined,
      memes_nakamoto: undefined,
    },
  } as any;
}

describe("UserPageStatsBoostBreakdown", () => {
  it("renders nothing without boost data", () => {
    const { container } = render(
      <UserPageStatsBoostBreakdown tdh={undefined} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows boost rows when data present", () => {
    render(<UserPageStatsBoostBreakdown tdh={makeTDH()} locale="de-DE" />);
    expect(
      screen.getByText(boostText("user.collected.stats.boostBreakdown.title"))
    ).toBeInTheDocument();

    const table = screen.getByRole("table", {
      name: boostText("user.collected.stats.boostBreakdown.tableCaption"),
    });
    expect(
      within(table).getByRole("rowheader", {
        name: boostText("user.collected.stats.boostBreakdown.rows.total"),
      })
    ).toBeInTheDocument();
    expect(within(table).getByText("3,00")).toBeInTheDocument();
    expect(within(table).getAllByText("0,50").length).toBeGreaterThanOrEqual(2);
  });
});
