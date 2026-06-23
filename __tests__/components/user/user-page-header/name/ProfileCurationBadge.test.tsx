import { render, screen } from "@testing-library/react";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import ProfileCurationBadge from "@/components/user/user-page-header/name/ProfileCurationBadge";
import { useWaveById } from "@/hooks/useWaveById";

jest.mock("@/hooks/useWaveById", () => ({
  useWaveById: jest.fn(),
}));

jest.mock("@/components/waves/drops/DropAuthorBadges", () => ({
  DropAuthorBadges: (props: any) => (
    <div
      data-testid="drop-author-badges"
      data-profile-wave-id={props.profile.profile_wave_id ?? ""}
      data-profile-wave-name={props.profile.profile_wave_name ?? ""}
      data-profile-wave-pfp={props.profile.profile_wave_pfp ?? ""}
      data-active-submissions={
        props.profile.active_main_stage_submission_ids?.length ?? 0
      }
      data-tooltip-id-prefix={props.tooltipIdPrefix}
    />
  ),
}));

const useWaveByIdMock = useWaveById as jest.Mock;

const baseProfile: ApiIdentity = {
  id: "profile-1",
  handle: "alice",
  normalised_handle: "alice",
  pfp: null,
  cic: 0,
  rep: 0,
  level: 0,
  tdh: 0,
  consolidation_key: "",
  display: "Alice",
  primary_wallet: "0xabc",
  banner1: null,
  banner2: null,
  classification: ApiProfileClassification.Pseudonym,
  sub_classification: null,
  active_main_stage_submission_ids: [],
  winner_main_stage_drop_ids: [],
  artist_of_prevote_cards: [],
  profile_wave_id: "wave-1",
  is_wave_creator: false,
};

describe("ProfileCurationBadge", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes fetched curation wave name and picture to author badges", () => {
    useWaveByIdMock.mockReturnValue({
      wave: {
        id: "wave-1",
        name: "Actual Curation Wave",
        picture: "https://example.com/wave.png",
      },
    });

    render(<ProfileCurationBadge profile={baseProfile} />);

    expect(useWaveByIdMock).toHaveBeenCalledWith("wave-1", {
      enabled: true,
    });
    expect(screen.getByTestId("drop-author-badges")).toHaveAttribute(
      "data-profile-wave-id",
      "wave-1"
    );
    expect(screen.getByTestId("drop-author-badges")).toHaveAttribute(
      "data-profile-wave-name",
      "Actual Curation Wave"
    );
    expect(screen.getByTestId("drop-author-badges")).toHaveAttribute(
      "data-profile-wave-pfp",
      "https://example.com/wave.png"
    );
  });

  it("fetches with the trimmed profile wave id", () => {
    useWaveByIdMock.mockReturnValue({
      wave: {
        id: "wave-1",
        name: "Actual Curation Wave",
        picture: "https://example.com/wave.png",
      },
    });

    render(
      <ProfileCurationBadge
        profile={{ ...baseProfile, profile_wave_id: "  wave-1  " }}
      />
    );

    expect(useWaveByIdMock).toHaveBeenCalledWith("wave-1", {
      enabled: true,
    });
    expect(screen.getByTestId("drop-author-badges")).toHaveAttribute(
      "data-profile-wave-id",
      "wave-1"
    );
  });

  it("does not render stale generic curation wave data while the wave is loading", () => {
    useWaveByIdMock.mockReturnValue({ wave: undefined });

    render(<ProfileCurationBadge profile={baseProfile} />);

    expect(screen.getByTestId("drop-author-badges")).toHaveAttribute(
      "data-profile-wave-id",
      ""
    );
    expect(screen.getByTestId("drop-author-badges")).toHaveAttribute(
      "data-profile-wave-name",
      ""
    );
  });

  it("does not show stale placeholder wave data for another wave id", () => {
    useWaveByIdMock.mockReturnValue({
      wave: {
        id: "other-wave",
        name: "Other Wave",
        picture: "https://example.com/other.png",
      },
    });

    render(<ProfileCurationBadge profile={baseProfile} />);

    expect(screen.getByTestId("drop-author-badges")).toHaveAttribute(
      "data-profile-wave-id",
      ""
    );
    expect(screen.getByTestId("drop-author-badges")).toHaveAttribute(
      "data-profile-wave-name",
      ""
    );
  });

  it("does not fetch when the profile has no curation wave", () => {
    useWaveByIdMock.mockReturnValue({ wave: undefined });

    render(
      <ProfileCurationBadge
        profile={{ ...baseProfile, profile_wave_id: null }}
      />
    );

    expect(useWaveByIdMock).toHaveBeenCalledWith(null, {
      enabled: false,
    });
  });

  it("keeps activity badge data available through author badges", () => {
    useWaveByIdMock.mockReturnValue({ wave: undefined });

    render(
      <ProfileCurationBadge
        profile={{
          ...baseProfile,
          active_main_stage_submission_ids: ["submission-1"],
        }}
      />
    );

    expect(screen.getByTestId("drop-author-badges")).toHaveAttribute(
      "data-active-submissions",
      "1"
    );
  });
});
