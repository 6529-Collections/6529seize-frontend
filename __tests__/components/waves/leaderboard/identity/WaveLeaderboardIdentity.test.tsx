import React from "react";
import { render, screen } from "@testing-library/react";
import { WaveLeaderboardIdentity } from "@/components/waves/leaderboard/identity/WaveLeaderboardIdentity";
import type { ApiDropResolvedIdentityProfile } from "@/generated/models/ApiDropResolvedIdentityProfile";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import { ApiWaveParticipationSubmissionStrategyType } from "@/generated/models/ApiWaveParticipationSubmissionStrategyType";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

jest.mock(
  "@/components/waves/drops/participation/ParticipationIdentityProfileCard",
  () => ({
    __esModule: true,
    default: ({ profile }: any) => (
      <div data-testid="identity-full-card">{profile.handle}</div>
    ),
  })
);

jest.mock("@/components/waves/drops/DropAuthorBadges", () => ({
  DropAuthorBadges: () => <div data-testid="identity-badges" />,
}));

describe("WaveLeaderboardIdentity", () => {
  const resolvedProfile: ApiDropResolvedIdentityProfile = {
    id: "p1",
    handle: "alice",
    primary_address: "0xabc",
    pfp: null,
    banner1_color: null,
    banner2_color: null,
    cic: 1,
    rep: 2,
    tdh: 3,
    tdh_rate: 4,
    xtdh: 5,
    xtdh_rate: 6,
    level: 7,
    classification: ApiProfileClassification.Pseudonym,
    sub_classification: null,
    subscribed_actions: [],
    archived: false,
    active_main_stage_submission_ids: [],
    winner_main_stage_drop_ids: [],
    artist_of_prevote_cards: [],
    profile_wave_id: null,
    is_wave_creator: false,
    bio: null,
    top_rep_categories: [],
  };

  it("renders the condensed summary for resolved identities", () => {
    render(
      <WaveLeaderboardIdentity
        drop={
          {
            id: "d1",
            wave: {
              submission_type:
                ApiWaveParticipationSubmissionStrategyType.Identity,
            },
            metadata: [
              {
                data_key: "identity",
                data_value: "0xabc",
                resolved_profile: resolvedProfile,
              },
            ],
          } as any
        }
        variant="condensed"
      />
    );

    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View alice's profile" })
    ).toHaveAttribute("href", "/alice");
    expect(screen.getByText("0xabc")).toBeInTheDocument();
    expect(screen.getByTestId("identity-badges")).toBeInTheDocument();
  });

  it("renders the full card in responsive mode when a profile is resolved", () => {
    render(
      <WaveLeaderboardIdentity
        drop={
          {
            id: "d1",
            wave: {
              submission_type:
                ApiWaveParticipationSubmissionStrategyType.Identity,
            },
            metadata: [
              {
                data_key: "identity",
                data_value: "0xabc",
                resolved_profile: resolvedProfile,
              },
            ],
          } as any
        }
        variant="responsive"
      />
    );

    expect(screen.getByTestId("identity-full-card")).toHaveTextContent("alice");
    expect(
      screen.getByTestId("wave-leaderboard-identity-summary")
    ).toBeInTheDocument();
  });

  it("keeps condensed identity content readable without profile navigation", () => {
    render(
      <WaveLeaderboardIdentity
        drop={
          {
            id: "d1",
            wave: {
              submission_type:
                ApiWaveParticipationSubmissionStrategyType.Identity,
            },
            metadata: [
              {
                data_key: "identity",
                data_value: "0xabc",
                resolved_profile: {
                  ...resolvedProfile,
                  pfp: "https://example.com/avatar.png",
                  bio: "Identity bio",
                  top_rep_categories: [{ category: "Art", rep: 12 }],
                } satisfies ApiDropResolvedIdentityProfile,
              },
            ],
          } as ExtendedDrop
        }
        variant="condensed"
        disableNavigation
      />
    );

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "alice avatar" })
    ).toBeInTheDocument();
    for (const text of ["alice", "0xabc", "7", "Identity bio", "Art"]) {
      expect(screen.getByText(text)).toBeInTheDocument();
      expect(screen.getByText(text).closest("[inert]")).toBeNull();
    }
    expect(screen.getByTestId("identity-badges").parentElement).toHaveAttribute(
      "inert"
    );
  });

  it("renders a plain fallback when the identity is unresolved", () => {
    render(
      <WaveLeaderboardIdentity
        drop={
          {
            id: "d1",
            wave: {
              submission_type:
                ApiWaveParticipationSubmissionStrategyType.Identity,
            },
            metadata: [
              {
                data_key: "identity",
                data_value: "0xdef",
              },
            ],
          } as any
        }
        variant="condensed"
      />
    );

    expect(screen.getByText("0xdef")).toBeInTheDocument();
    expect(screen.queryByTestId("identity-badges")).not.toBeInTheDocument();
    expect(screen.queryByTestId("identity-full-card")).not.toBeInTheDocument();
  });
});
