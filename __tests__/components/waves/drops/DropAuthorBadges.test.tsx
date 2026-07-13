import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import type { ArtistPreviewTab } from "@/hooks/useArtistPreviewModal";
import { DropAuthorBadges } from "@/components/waves/drops/DropAuthorBadges";

const mockCloseAllCustomTooltips = jest.fn();
const mockArtistHandleBadgeClick = jest.fn();
const mockArtistHandleModalClose = jest.fn();
const mockRouterPush = jest.fn();
const mockIsMemesWave = jest.fn(() => false);

const mockUseArtistPreviewModal = jest.fn();

type ArtistActivityBadgeProps = {
  readonly submissionCount: number;
  readonly trophyCount: number;
  readonly onBadgeClick: (tab: ArtistPreviewTab) => void;
  readonly tooltipId?: string;
};

type CurationWaveBadgeProps = {
  readonly waveId: string;
  readonly tooltipId?: string;
  readonly onBadgeClick?: () => void;
  readonly waveName?: string | null;
  readonly wavePfp?: string | null;
};

type ArtistPreviewModalProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly user: ApiProfileMin;
  readonly activeTab: ArtistPreviewTab;
  readonly onTabChange: (tab: ArtistPreviewTab) => void;
};

type WaveCompetitionBadgesProps = {
  readonly isParticipant: boolean;
  readonly isWinner: boolean;
  readonly onBadgeClick: (tab: "active" | "winners") => void;
};

type WaveCompetitionPreviewModalProps = {
  readonly isOpen: boolean;
  readonly activeTab: "active" | "winners";
  readonly hasActiveEntries: boolean;
  readonly hasWinningEntries: boolean;
};

jest.mock("@/hooks/useArtistPreviewModal", () => ({
  useArtistPreviewModal: () => mockUseArtistPreviewModal(),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

jest.mock("@/contexts/SeizeSettingsContext", () => ({
  useSeizeSettingsOptional: () => ({
    isMemesWave: mockIsMemesWave,
  }),
}));

jest.mock("@/helpers/tooltip.helpers", () => ({
  ...jest.requireActual("@/helpers/tooltip.helpers"),
  closeAllCustomTooltips: () => mockCloseAllCustomTooltips(),
}));

jest.mock("@/components/waves/drops/ArtistActivityBadge", () => ({
  ArtistActivityBadge: ({
    submissionCount,
    trophyCount,
    onBadgeClick,
    tooltipId,
  }: ArtistActivityBadgeProps) => (
    <button
      type="button"
      data-testid="artist-activity-badge"
      data-submission-count={submissionCount}
      data-trophy-count={trophyCount}
      data-tooltip-id={tooltipId}
      onClick={() => onBadgeClick("active")}
    >
      Artist Activity
    </button>
  ),
}));

jest.mock("@/components/waves/drops/CurationWaveBadge", () => ({
  CurationWaveBadge: ({
    waveId,
    tooltipId,
    onBadgeClick,
    waveName,
    wavePfp,
  }: CurationWaveBadgeProps) => (
    <button
      type="button"
      data-testid="profile-wave-badge"
      data-wave-id={waveId}
      data-tooltip-id={tooltipId}
      data-wave-name={waveName ?? ""}
      data-wave-pfp={wavePfp ?? ""}
      onClick={onBadgeClick}
    >
      Profile Wave
    </button>
  ),
}));

jest.mock("@/components/waves/drops/ArtistPreviewModal", () => ({
  ArtistPreviewModal: ({
    isOpen,
    user,
    activeTab,
  }: ArtistPreviewModalProps) => (
    <div
      data-testid="artist-preview-modal"
      data-open={String(isOpen)}
      data-user-primary-address={user.primary_address}
      data-active-tab={activeTab}
    />
  ),
}));

jest.mock("@/components/waves/drops/WaveCompetitionBadges", () => ({
  WaveCompetitionBadges: ({
    isParticipant,
    isWinner,
    onBadgeClick,
  }: WaveCompetitionBadgesProps) => (
    <div data-testid="wave-competition-badges">
      {isParticipant && (
        <button type="button" onClick={() => onBadgeClick("active")}>
          Participant
        </button>
      )}
      {isWinner && (
        <button type="button" onClick={() => onBadgeClick("winners")}>
          Winner
        </button>
      )}
    </div>
  ),
}));

jest.mock("@/components/waves/drops/WaveCompetitionPreviewModal", () => ({
  WaveCompetitionPreviewModal: ({
    isOpen,
    activeTab,
    hasActiveEntries,
    hasWinningEntries,
  }: WaveCompetitionPreviewModalProps) => (
    <div
      data-testid="wave-competition-preview-modal"
      data-open={String(isOpen)}
      data-active-tab={activeTab}
      data-has-active={String(hasActiveEntries)}
      data-has-winners={String(hasWinningEntries)}
    />
  ),
}));

const baseProfile = {
  id: "profile-1",
  handle: "artist",
  pfp: null,
  primary_address: "0xabc",
  active_main_stage_submission_ids: [],
  winner_main_stage_drop_ids: [],
  artist_of_prevote_cards: [],
  is_wave_creator: false,
};

const competitionWave = {
  id: "wave-1",
  name: "Cool Comp",
} as ApiWaveMin;

describe("DropAuthorBadges", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouterPush.mockClear();
    mockIsMemesWave.mockReturnValue(false);
    mockUseArtistPreviewModal.mockReturnValue({
      isModalOpen: false,
      activeTab: "active",
      handleBadgeClick: mockArtistHandleBadgeClick,
      handleTabChange: jest.fn(),
      handleModalClose: mockArtistHandleModalClose,
    });
  });

  it("returns null when profile has no activity and no profile wave", () => {
    const { container } = render(<DropAuthorBadges profile={baseProfile} />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId("artist-activity-badge")).toBeNull();
    expect(screen.queryByTestId("profile-wave-badge")).toBeNull();
  });

  it("renders activity badge and derives submission/trophy counts from profile", () => {
    render(
      <DropAuthorBadges
        profile={{
          ...baseProfile,
          active_main_stage_submission_ids: ["s1", "s2"],
          winner_main_stage_drop_ids: ["w1"],
          artist_of_prevote_cards: [12],
        }}
      />
    );

    const badge = screen.getByTestId("artist-activity-badge");
    expect(badge).toHaveAttribute("data-submission-count", "2");
    expect(badge).toHaveAttribute("data-trophy-count", "2");
    expect(screen.queryByTestId("profile-wave-badge")).toBeNull();
  });

  it("renders competition badges from contextual participation booleans", () => {
    render(
      <DropAuthorBadges
        profile={{
          ...baseProfile,
          wave_participation: {
            is_participant: true,
            is_winner: true,
          },
        }}
        wave={competitionWave}
      />
    );

    expect(screen.getByText("Participant")).toBeInTheDocument();
    expect(screen.getByText("Winner")).toBeInTheDocument();
    const previewModal = screen.getByTestId("wave-competition-preview-modal");
    expect(previewModal).toHaveAttribute("data-has-active", "true");
    expect(previewModal).toHaveAttribute("data-has-winners", "true");

    fireEvent.click(screen.getByText("Winner"));

    expect(mockCloseAllCustomTooltips).toHaveBeenCalledTimes(1);
    expect(previewModal).toHaveAttribute("data-open", "true");
    expect(previewModal).toHaveAttribute("data-active-tab", "winners");
  });

  it("does not render competition badges when both contextual flags are false", () => {
    render(
      <DropAuthorBadges
        profile={{
          ...baseProfile,
          wave_participation: {
            is_participant: false,
            is_winner: false,
          },
        }}
        wave={competitionWave}
      />
    );

    expect(screen.queryByTestId("wave-competition-badges")).toBeNull();
  });

  it("does not render competition badges in Main Stage", () => {
    mockIsMemesWave.mockReturnValue(true);

    render(
      <DropAuthorBadges
        profile={{
          ...baseProfile,
          wave_participation: {
            is_participant: true,
            is_winner: true,
          },
        }}
        wave={{ ...competitionWave, id: "main-stage", name: "Main Stage" }}
      />
    );

    expect(screen.queryByTestId("wave-competition-badges")).toBeNull();
  });

  it("renders activity and profile wave badges from V2 count-only badges", () => {
    const onArtistPreviewOpen = jest.fn();

    render(
      <DropAuthorBadges
        profile={{
          ...baseProfile,
          badges: {
            artist_of_main_stage_submissions: 1,
            artist_of_memes: 1,
            profile_wave_id: "profile-wave-1",
            profile_wave_name: "Profile Wave",
            profile_wave_pfp: "https://example.com/wave.png",
          },
        }}
        onArtistPreviewOpen={onArtistPreviewOpen}
      />
    );

    const badge = screen.getByTestId("artist-activity-badge");
    expect(badge).toHaveAttribute("data-submission-count", "1");
    expect(badge).toHaveAttribute("data-trophy-count", "1");
    expect(screen.getByTestId("profile-wave-badge")).toHaveAttribute(
      "data-wave-id",
      "profile-wave-1"
    );

    fireEvent.click(badge);

    expect(onArtistPreviewOpen).toHaveBeenCalledWith({
      user: expect.objectContaining({
        active_main_stage_submission_ids: [],
        artist_of_prevote_cards: [],
        badges: {
          artist_of_main_stage_submissions: 1,
          artist_of_memes: 1,
          profile_wave_id: "profile-wave-1",
          profile_wave_name: "Profile Wave",
          profile_wave_pfp: "https://example.com/wave.png",
        },
        is_wave_creator: false,
        profile_wave_id: "profile-wave-1",
      }),
      initialTab: "active",
    });
  });

  it("does not render a wave badge when profile is a wave creator without a profile wave", () => {
    render(
      <DropAuthorBadges
        profile={{
          ...baseProfile,
          is_wave_creator: true,
        }}
      />
    );

    expect(screen.queryByTestId("profile-wave-badge")).toBeNull();
    expect(screen.queryByTestId("artist-activity-badge")).toBeNull();
  });

  it("passes profile wave details to the badge and opens the wave", () => {
    render(
      <DropAuthorBadges
        profile={{
          ...baseProfile,
          badges: {
            artist_of_main_stage_submissions: 0,
            artist_of_memes: 0,
            profile_wave_id: "profile-wave-1",
            profile_wave_name: "Profile Wave",
            profile_wave_pfp: "https://example.com/wave.png",
          },
        }}
      />
    );

    const badge = screen.getByTestId("profile-wave-badge");
    expect(badge).toHaveAttribute("data-wave-id", "profile-wave-1");
    expect(badge).toHaveAttribute("data-wave-name", "Profile Wave");
    expect(badge).toHaveAttribute(
      "data-wave-pfp",
      "https://example.com/wave.png"
    );

    fireEvent.click(badge);

    expect(mockCloseAllCustomTooltips).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledWith("/waves/profile-wave-1");
  });

  it("renders both badges and forwards tooltip id prefix", () => {
    render(
      <DropAuthorBadges
        profile={{
          ...baseProfile,
          active_main_stage_submission_ids: ["s1"],
          profile_wave_id: "profile-wave-1",
        }}
        tooltipIdPrefix="custom-badges"
      />
    );

    expect(screen.getByTestId("artist-activity-badge")).toHaveAttribute(
      "data-tooltip-id",
      "custom-badges-activity"
    );
    expect(screen.getByTestId("profile-wave-badge")).toHaveAttribute(
      "data-tooltip-id",
      "custom-badges-profile-wave"
    );
  });

  it("wires activity to the modal hook and profile wave to navigation", () => {
    render(
      <DropAuthorBadges
        profile={{
          ...baseProfile,
          active_main_stage_submission_ids: ["s1"],
          profile_wave_id: "profile-wave-1",
        }}
      />
    );

    fireEvent.click(screen.getByTestId("artist-activity-badge"));
    fireEvent.click(screen.getByTestId("profile-wave-badge"));

    expect(mockCloseAllCustomTooltips).toHaveBeenCalledTimes(2);
    expect(mockArtistHandleBadgeClick).toHaveBeenCalledWith("active");
    expect(mockRouterPush).toHaveBeenCalledWith("/waves/profile-wave-1");
  });

  it("delegates artist preview opening to external handlers when provided", () => {
    const onArtistPreviewOpen = jest.fn();

    render(
      <DropAuthorBadges
        profile={{
          ...baseProfile,
          active_main_stage_submission_ids: ["s1"],
          profile_wave_id: "profile-wave-1",
        }}
        onArtistPreviewOpen={onArtistPreviewOpen}
      />
    );

    fireEvent.click(screen.getByTestId("artist-activity-badge"));

    expect(mockCloseAllCustomTooltips).toHaveBeenCalledTimes(1);
    expect(mockArtistHandleBadgeClick).not.toHaveBeenCalled();
    expect(onArtistPreviewOpen).toHaveBeenCalledWith({
      user: expect.objectContaining({
        id: "profile-1",
        handle: "artist",
        primary_address: "0xabc",
      }),
      initialTab: "active",
    });
    expect(screen.queryByTestId("artist-preview-modal")).toBeNull();
  });

  it("normalizes ApiIdentity-like primary_wallet for modal user profile", () => {
    render(
      <DropAuthorBadges
        profile={{
          id: "identity-1",
          handle: "identity-user",
          primary_wallet: "0xwallet",
          active_main_stage_submission_ids: ["submission-1"],
          winner_main_stage_drop_ids: [],
          artist_of_prevote_cards: [],
        }}
      />
    );

    expect(screen.getByTestId("artist-preview-modal")).toHaveAttribute(
      "data-user-primary-address",
      "0xwallet"
    );
  });
});
