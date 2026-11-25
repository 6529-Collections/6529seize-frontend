import { render, screen } from "@testing-library/react";

import UserStatsRow from "@/components/user/utils/stats/UserStatsRow";

const mockXtdhRetired = jest.fn(() => false);

jest.mock("@/hooks/useXtdhRetirement", () => ({
  useXtdhRetired: () => mockXtdhRetired(),
}));

const renderRow = () =>
  render(
    <UserStatsRow
      handle="bob"
      tdh={1234}
      tdh_rate={3}
      xtdh={56}
      xtdh_rate={2}
      cic={7}
      rep={8}
      followersCount={9}
    />
  );

describe("UserStatsRow once xTDH is retired", () => {
  it("shows xTDH while it is live", () => {
    mockXtdhRetired.mockReturnValue(false);
    renderRow();
    expect(screen.getByText("xTDH")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /View bob's xTDH: 56/ })
    ).toHaveAttribute("href", "/bob/xtdh");
  });

  it("drops the xTDH stat and keeps the others", () => {
    mockXtdhRetired.mockReturnValue(true);
    renderRow();
    expect(screen.queryByText("xTDH")).toBeNull();
    expect(screen.queryByText("56")).toBeNull();
    expect(screen.queryByRole("link", { name: /xTDH/ })).toBeNull();
    for (const value of ["1,234", "7", "8", "9"]) {
      expect(screen.getByText(value)).toBeInTheDocument();
    }
  });
});
