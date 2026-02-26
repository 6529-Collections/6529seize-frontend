import { render } from "@testing-library/react";
import React from "react";
import UserPageHeaderStats from "@/components/user/user-page-header/stats/UserPageHeaderStats";

let statsRowProps: any = null;
let followersModalProps: any = null;

jest.mock("@/components/user/utils/stats/UserStatsRow", () => (props: any) => {
  statsRowProps = props;
  return <div data-testid="stats-row" />;
});

jest.mock(
  "@/components/user/followers/UserPageFollowersModal",
  () => (props: any) => {
    followersModalProps = props;
    return <div data-testid="followers-modal" />;
  }
);

describe("UserPageHeaderStats", () => {
  beforeEach(() => {
    statsRowProps = null;
    followersModalProps = null;
  });

  it("passes correct props to UserStatsRow and UserPageFollowersModal", () => {
    const profile: any = {
      id: "profile-1",
      tdh: 10,
      tdh_rate: 3,
      xtdh: 5,
      xtdh_rate: 7,
      rep: 20,
      cic: 15,
    };
    const { getByTestId } = render(
      <UserPageHeaderStats
        profile={profile}
        handleOrWallet="Bob"
        followersCount={4}
      />
    );

    expect(getByTestId("stats-row")).toBeInTheDocument();
    expect(statsRowProps).toEqual(
      expect.objectContaining({
        handle: "bob",
        tdh: 10,
        tdh_rate: 3,
        xtdh: 5,
        xtdh_rate: 7,
        rep: 20,
        cic: 15,
        followersCount: 4,
      })
    );
    expect(typeof statsRowProps.onFollowersClick).toBe("function");

    expect(getByTestId("followers-modal")).toBeInTheDocument();
    expect(followersModalProps).toEqual(
      expect.objectContaining({
        profileId: "profile-1",
        isOpen: false,
      })
    );
    expect(typeof followersModalProps.onClose).toBe("function");
  });

  it("returns null for empty handleOrWallet", () => {
    const profile: any = {
      id: "p1",
      tdh: 1,
      tdh_rate: 0,
      xtdh: 0,
      xtdh_rate: 0,
      rep: 0,
      cic: 0,
    };
    const { container } = render(
      <UserPageHeaderStats
        profile={profile}
        handleOrWallet=""
        followersCount={0}
      />
    );
    expect(container.innerHTML).toBe("");
  });

  it("returns null for unsafe handleOrWallet", () => {
    const profile: any = {
      id: "p1",
      tdh: 1,
      tdh_rate: 0,
      xtdh: 0,
      xtdh_rate: 0,
      rep: 0,
      cic: 0,
    };
    const { container } = render(
      <UserPageHeaderStats
        profile={profile}
        handleOrWallet="<script>"
        followersCount={0}
      />
    );
    expect(container.innerHTML).toBe("");
  });
});
