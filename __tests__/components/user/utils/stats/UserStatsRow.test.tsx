import { render, screen } from "@testing-library/react";

import UserStatsRow, {
  UserStatsRowSize,
} from "@/components/user/utils/stats/UserStatsRow";

describe("UserStatsRow", () => {
  it("renders hovercard stat values and labels with the intended typography", () => {
    render(
      <UserStatsRow
        handle="bob"
        tdh={1234}
        tdh_rate={0}
        xtdh={56}
        xtdh_rate={0}
        cic={7}
        rep={8}
        followersCount={9}
        size={UserStatsRowSize.SMALL}
      />
    );

    for (const value of ["1,234", "56", "7", "8", "9"]) {
      expect(screen.getByText(value)).toHaveClass(
        "tw-font-semibold",
        "tw-text-iron-300"
      );
    }

    for (const label of ["TDH", "xTDH", "NIC", "Rep", "Followers"]) {
      expect(screen.getByText(label)).toHaveClass(
        "tw-font-medium",
        "tw-text-iron-500"
      );
    }
  });
});
