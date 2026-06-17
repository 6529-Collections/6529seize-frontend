import { render, screen } from "@testing-library/react";
import UserPageStatsActivityDistributionsTableItem from "@/components/user/stats/activity/distributions/UserPageStatsActivityDistributionsTableItem";
import { DistributionCollection } from "@/components/user/stats/activity/distributions/distributions.types";
import { formatInteger } from "@/i18n/format";

beforeEach(() => {
  jest
    .spyOn(Date, "now")
    .mockReturnValue(new Date("2020-01-02T00:00:00.000Z").getTime());
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("UserPageStatsActivityDistributionsTableItem", () => {
  const item = {
    collection: DistributionCollection.MEMES,
    tokenId: 1000,
    name: "Test",
    wallet: "0x1",
    phases: [
      { phase: "phase1", amount: 1000 },
      { phase: "phase2", amount: 2000 },
    ],
    amountMinted: 3000,
    amountTotal: 4000,
    date: "2020-01-01T00:00:00.000Z",
  };

  it("renders info", () => {
    render(
      <table>
        <tbody>
          <UserPageStatsActivityDistributionsTableItem
            item={item}
            formatNumber={(value) => `n-${value}`}
          />
        </tbody>
      </table>
    );
    expect(screen.getByText("The Memes")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View The Memes token #1000" })
    ).toHaveAttribute("href", "/the-memes/1000");
    expect(screen.getByText("# 1000")).toBeInTheDocument();
    expect(screen.getByText("Test")).toBeInTheDocument();
    expect(screen.getByText("0x1")).toBeInTheDocument();
    expect(screen.getByText("n-1000")).toBeInTheDocument();
    expect(screen.getByText("n-2000")).toBeInTheDocument();
    expect(screen.getByText("n-3000")).toBeInTheDocument();
    expect(screen.getByText("n-4000")).toBeInTheDocument();
    expect(screen.getByText("yesterday")).toBeInTheDocument();
  });

  it("uses active locale for row numbers and relative time", () => {
    const locale = "de-DE";

    render(
      <table>
        <tbody>
          <UserPageStatsActivityDistributionsTableItem
            item={item}
            formatNumber={(value) => formatInteger(locale, value)}
            locale={locale}
          />
        </tbody>
      </table>
    );

    expect(screen.getByText(formatInteger(locale, 1000))).toBeInTheDocument();
    expect(screen.getByText("gestern")).toBeInTheDocument();
  });
});
