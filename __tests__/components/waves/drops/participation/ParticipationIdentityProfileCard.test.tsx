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
  it("renders inline profile content with the profile link and stats", () => {
    render(
      <ParticipationIdentityProfileCard profile={buildProfile() as any} />
    );

    expect(
      screen.getByRole("link", { name: /view simo's profile/i })
    ).toHaveAttribute("href", "/simo");
    expect(
      screen.queryByText("0x3a867c9b39c940e9467f5b3b43fa0e5a2bd1e6e")
    ).not.toBeInTheDocument();
    expect(screen.getByText("+21")).toBeInTheDocument();
    expect(screen.getByText("TDH")).toBeInTheDocument();
    expect(screen.getByText("xTDH")).toBeInTheDocument();
    expect(screen.getByText("NIC")).toBeInTheDocument();
    expect(screen.getByText("Rep")).toBeInTheDocument();
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

  it("does not render deprecated archived or activity chips", () => {
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

    expect(
      screen.getByRole("link", { name: /view simo's profile/i })
    ).toHaveAttribute("href", "/simo");
    expect(screen.queryByText("Archived")).not.toBeInTheDocument();
    expect(screen.queryByText("2 submissions")).not.toBeInTheDocument();
  });

  it("keeps the four stat links with their existing destinations", () => {
    render(
      <ParticipationIdentityProfileCard profile={buildProfile() as any} />
    );

    const statLinks = screen.getAllByRole("link");
    expect(
      statLinks.find((link) => {
        const text = link.textContent ?? "";
        return text.includes("TDH") && !text.includes("xTDH");
      })
    ).toHaveAttribute("href", "/simo/collected");
    expect(
      statLinks.find((link) => link.textContent?.includes("xTDH"))
    ).toHaveAttribute("href", "/simo/xtdh");
    expect(
      statLinks.find((link) => link.textContent?.includes("NIC"))
    ).toHaveAttribute("href", "/simo");
    expect(
      statLinks.find((link) => link.textContent?.includes("Rep"))
    ).toHaveAttribute("href", "/simo");
  });
});
