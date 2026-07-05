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

    expect(
      screen.getByRole("link", {
        name: "View bob's collected TDH: 1,234",
      })
    ).toHaveAttribute("href", "/bob/collected");
    expect(
      screen.getByRole("link", { name: "View bob's xTDH: 56" })
    ).toHaveAttribute("href", "/bob/xtdh");
    expect(
      screen.getByRole("link", { name: "View bob's NIC: 7" })
    ).toHaveAttribute("href", "/bob");
    expect(
      screen.getByRole("link", { name: "View bob's Rep: 8" })
    ).toHaveAttribute("href", "/bob");
    expect(
      screen.getByRole("link", {
        name: "View bob's followers: 9 Followers",
      })
    ).toHaveAttribute("href", "/bob");
  });

  it("uses a localized followers button label when followers open a modal", () => {
    const onFollowersClick = jest.fn();

    render(
      <UserStatsRow
        handle="bob"
        tdh={1234}
        tdh_rate={5}
        xtdh={56}
        xtdh_rate={2}
        cic={7}
        rep={8}
        followersCount={1}
        onFollowersClick={onFollowersClick}
      />
    );

    expect(
      screen.getByRole("link", {
        name: "View bob's collected TDH: 1,234, +5",
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View bob's xTDH: 56, +2" })
    ).toBeInTheDocument();
    expect(screen.getByText("Follower")).toHaveClass("tw-font-medium");
    expect(
      screen.getByRole("button", {
        name: "Open bob's followers: 1 Follower",
      })
    ).toBeInTheDocument();
  });

  it("treats null follower counts as zero", () => {
    render(
      <UserStatsRow
        handle="bob"
        tdh={1234}
        tdh_rate={0}
        xtdh={56}
        xtdh_rate={0}
        cic={7}
        rep={8}
        followersCount={null}
      />
    );

    expect(
      screen.getByRole("link", {
        name: "View bob's followers: 0 Followers",
      })
    ).toBeInTheDocument();
  });

  it("formats numbers with the provided locale's grouping", () => {
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
        locale="de-DE"
      />
    );

    expect(screen.getByText("1.234")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "View bob's collected TDH: 1.234",
      })
    ).toHaveAttribute("href", "/bob/collected");
  });
});
