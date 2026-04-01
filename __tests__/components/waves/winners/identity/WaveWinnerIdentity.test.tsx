import React from "react";
import { render, screen } from "@testing-library/react";
import { ApiWaveParticipationSubmissionStrategyType } from "@/generated/models/ApiWaveParticipationSubmissionStrategyType";
import { WaveWinnerIdentity } from "@/components/waves/winners/identity/WaveWinnerIdentity";

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, onClick, className }: any) => (
    <a href={href} onClick={onClick} className={className}>
      {children}
    </a>
  ),
}));

jest.mock(
  "@/components/waves/drops/participation/ParticipationIdentityProfileCard",
  () => ({
    __esModule: true,
    default: ({ profile }: any) => (
      <div data-testid="identity-profile-card">{profile.handle}</div>
    ),
  })
);

describe("WaveWinnerIdentity", () => {
  const resolvedProfile = {
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
    subscribed_actions: [],
    archived: false,
    active_main_stage_submission_ids: [],
    winner_main_stage_drop_ids: [],
    artist_of_prevote_cards: [],
    is_wave_creator: false,
  };

  const identityWave = {
    submission_type: ApiWaveParticipationSubmissionStrategyType.Identity,
  } as any;

  it("renders the full profile card when the identity resolves", () => {
    render(
      <WaveWinnerIdentity
        drop={{
          id: "drop-1",
          wave: identityWave,
          metadata: [
            {
              data_key: "identity",
              data_value: "0xabc",
              resolved_profile: resolvedProfile,
            },
          ],
        }}
        variant="full"
      />
    );

    expect(screen.getByTestId("identity-profile-card")).toHaveTextContent(
      "alice"
    );
  });

  it("renders a fallback card when the identity is unresolved", () => {
    render(
      <WaveWinnerIdentity
        drop={{
          id: "drop-1",
          wave: identityWave,
          metadata: [{ data_key: "identity", data_value: "0xdef" }],
        }}
        variant="full"
      />
    );

    expect(screen.getByTestId("wave-winner-identity-full")).toHaveTextContent(
      "0xdef"
    );
  });

  it("renders a compact linked identity row for resolved identities", () => {
    render(
      <WaveWinnerIdentity
        drop={{
          id: "drop-1",
          wave: identityWave,
          metadata: [
            {
              data_key: "identity",
              data_value: "0xabc",
              resolved_profile: resolvedProfile,
            },
          ],
        }}
        variant="compact"
      />
    );

    expect(
      screen.getByTestId("wave-winner-identity-compact")
    ).toHaveTextContent("Identity");
    expect(screen.getByRole("link", { name: "alice" })).toHaveAttribute(
      "href",
      "/alice"
    );
  });

  it("renders nothing for non-identity waves", () => {
    const { container } = render(
      <WaveWinnerIdentity
        drop={{
          id: "drop-1",
          wave: { submission_type: null } as any,
          metadata: [{ data_key: "identity", data_value: "0xdef" }],
        }}
        variant="compact"
      />
    );

    expect(container).toBeEmptyDOMElement();
  });
});
