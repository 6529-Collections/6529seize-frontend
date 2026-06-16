import { render, screen } from "@testing-library/react";
import UserPageStatsActivityDistributionsTableItem from "@/components/user/stats/activity/distributions/UserPageStatsActivityDistributionsTableItem";
import { DistributionCollection } from "@/components/user/stats/activity/distributions/distributions.types";

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
    tokenId: 1,
    name: "Test",
    wallet: "0x1",
    phases: [
      { phase: "phase1", amount: 1 },
      { phase: "phase2", amount: 2 },
    ],
    amountMinted: 3,
    amountTotal: 4,
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
      screen.getByRole("link", { name: "View The Memes token #1" })
    ).toHaveAttribute("href", "/the-memes/1");
    expect(screen.getByText("# 1")).toBeInTheDocument();
    expect(screen.getByText("Test")).toBeInTheDocument();
    expect(screen.getByText("0x1")).toBeInTheDocument();
    expect(screen.getByText("n-1")).toBeInTheDocument();
    expect(screen.getByText("n-2")).toBeInTheDocument();
    expect(screen.getByText("n-3")).toBeInTheDocument();
    expect(screen.getByText("n-4")).toBeInTheDocument();
    expect(screen.getByText("yesterday")).toBeInTheDocument();
  });
});
