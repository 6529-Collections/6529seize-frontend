import React from "react";
import { render, screen } from "@testing-library/react";

import ParticipationIdentityProfileCard from "@/components/waves/drops/participation/ParticipationIdentityProfileCard";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({
    href,
    children,
    onClick,
    className,
    "aria-label": ariaLabel,
  }: any) => (
    <a
      href={href}
      onClick={onClick}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  ),
}));

jest.mock("@/components/common/profile/ProfileAvatar", () => ({
  __esModule: true,
  ProfileBadgeSize: {
    SMALL: "SMALL",
    MEDIUM: "MEDIUM",
    LARGE: "LARGE",
  },
  default: () => <div data-testid="profile-avatar" />,
}));

jest.mock("@/components/utils/tooltip/UserProfileTooltipWrapper", () => ({
  __esModule: true,
  default: ({ children }: any) => (
    <div data-testid="tooltip-wrapper">{children}</div>
  ),
}));

jest.mock("@/components/waves/drops/DropAuthorBadges", () => ({
  DropAuthorBadges: () => <div data-testid="identity-badges" />,
}));

jest.mock("@/components/user/utils/UserCICAndLevel", () => ({
  __esModule: true,
  UserCICAndLevelSize: {
    SMALL: "SMALL",
    MEDIUM: "MEDIUM",
  },
  default: () => <div data-testid="level-chip" />,
}));

const buildProfile = (overrides: Record<string, unknown> = {}) => ({
  id: "profile-1",
  handle: "simo",
  pfp: null,
  banner1_color: "#111111",
  banner2_color: "#222222",
  cic: 120,
  rep: 200,
  tdh: 15969,
  tdh_rate: 21,
  xtdh: 264,
  xtdh_rate: 0,
  level: 12,
  primary_address: "0x3a867c9b39c940e9467f5b3b43fa0e5a2bd1e6e",
  subscribed_actions: [],
  archived: false,
  active_main_stage_submission_ids: ["a", "b"],
  winner_main_stage_drop_ids: ["winner-1"],
  artist_of_prevote_cards: [1],
  is_wave_creator: true,
  ...overrides,
});

describe("ParticipationIdentityProfileCard", () => {
  it("removes the secondary address and keeps richer inline profile content", () => {
    render(
      <ParticipationIdentityProfileCard profile={buildProfile() as any} />
    );

    expect(screen.getByText("Identity")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /view simo's profile/i })
    ).toHaveAttribute("href", "/simo");
    expect(
      screen.queryByText("0x3a867c9b39c940e9467f5b3b43fa0e5a2bd1e6e")
    ).not.toBeInTheDocument();
    expect(screen.getByText("2 submissions")).toBeInTheDocument();
    expect(screen.getByText("2 minted memes")).toBeInTheDocument();
    expect(screen.getByText("+21")).toBeInTheDocument();
  });

  it("keeps the address as the primary label when there is no handle", () => {
    render(
      <ParticipationIdentityProfileCard
        profile={
          buildProfile({
            handle: null,
            primary_address: "0xabc123",
            active_main_stage_submission_ids: [],
            winner_main_stage_drop_ids: [],
            artist_of_prevote_cards: [],
          }) as any
        }
      />
    );

    expect(screen.getByText("0xabc123")).toBeInTheDocument();
    expect(screen.queryByText("Archived")).not.toBeInTheDocument();
  });

  it("renders the archived chip only when the profile is archived", () => {
    render(
      <ParticipationIdentityProfileCard
        profile={
          buildProfile({
            archived: true,
            active_main_stage_submission_ids: [],
            winner_main_stage_drop_ids: [],
            artist_of_prevote_cards: [],
          }) as any
        }
      />
    );

    expect(screen.getByText("Archived")).toBeInTheDocument();
    expect(screen.queryByText("2 submissions")).not.toBeInTheDocument();
  });

  it("keeps the four stat links with their existing destinations", () => {
    render(
      <ParticipationIdentityProfileCard profile={buildProfile() as any} />
    );

    expect(screen.getByRole("link", { name: /tdh/i })).toHaveAttribute(
      "href",
      "/simo/collected"
    );
    expect(screen.getByRole("link", { name: /xtdh/i })).toHaveAttribute(
      "href",
      "/simo/xtdh"
    );
    expect(screen.getByRole("link", { name: /nic/i })).toHaveAttribute(
      "href",
      "/simo"
    );
    expect(screen.getByRole("link", { name: /rep/i })).toHaveAttribute(
      "href",
      "/simo"
    );
  });
});
