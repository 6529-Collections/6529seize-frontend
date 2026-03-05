import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { ArtistPreviewTab } from "@/hooks/useArtistPreviewModal";
import { DropAuthorBadges } from "@/components/waves/drops/DropAuthorBadges";

const mockArtistHandleBadgeClick = jest.fn();
const mockArtistHandleModalClose = jest.fn();
const mockWaveCreatorHandleBadgeClick = jest.fn();
const mockWaveCreatorHandleModalClose = jest.fn();

const mockUseArtistPreviewModal = jest.fn();
const mockUseWaveCreatorPreviewModal = jest.fn();

type ArtistActivityBadgeProps = {
  readonly submissionCount: number;
  readonly trophyCount: number;
  readonly onBadgeClick: (tab: ArtistPreviewTab) => void;
  readonly tooltipId?: string;
};

type WaveCreatorBadgeProps = {
  readonly tooltipId?: string;
  readonly onBadgeClick?: () => void;
};

type ArtistPreviewModalProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly user: ApiProfileMin;
  readonly initialTab?: ArtistPreviewTab;
};

type WaveCreatorPreviewModalProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly user: ApiProfileMin;
};

jest.mock("@/hooks/useArtistPreviewModal", () => ({
  useArtistPreviewModal: () => mockUseArtistPreviewModal(),
}));

jest.mock("@/hooks/useWaveCreatorPreviewModal", () => ({
  useWaveCreatorPreviewModal: () => mockUseWaveCreatorPreviewModal(),
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

jest.mock("@/components/waves/drops/WaveCreatorBadge", () => ({
  WaveCreatorBadge: ({ tooltipId, onBadgeClick }: WaveCreatorBadgeProps) => (
    <button
      type="button"
      data-testid="wave-creator-badge"
      data-tooltip-id={tooltipId}
      onClick={onBadgeClick}
    >
      Wave Creator
    </button>
  ),
}));

jest.mock("@/components/waves/drops/ArtistPreviewModal", () => ({
  ArtistPreviewModal: ({
    isOpen,
    user,
    initialTab,
  }: ArtistPreviewModalProps) => (
    <div
      data-testid="artist-preview-modal"
      data-open={String(isOpen)}
      data-user-primary-address={user.primary_address}
      data-initial-tab={initialTab ?? "active"}
    />
  ),
}));

jest.mock("@/components/waves/drops/WaveCreatorPreviewModal", () => ({
  WaveCreatorPreviewModal: ({ isOpen, user }: WaveCreatorPreviewModalProps) => (
    <div
      data-testid="wave-creator-preview-modal"
      data-open={String(isOpen)}
      data-user-primary-address={user.primary_address}
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

describe("DropAuthorBadges", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseArtistPreviewModal.mockReturnValue({
      isModalOpen: false,
      modalInitialTab: "active",
      handleBadgeClick: mockArtistHandleBadgeClick,
      handleModalClose: mockArtistHandleModalClose,
    });
    mockUseWaveCreatorPreviewModal.mockReturnValue({
      isModalOpen: false,
      handleBadgeClick: mockWaveCreatorHandleBadgeClick,
      handleModalClose: mockWaveCreatorHandleModalClose,
    });
  });

  it("returns null when profile has no activity and is not wave creator", () => {
    const { container } = render(<DropAuthorBadges profile={baseProfile} />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByTestId("artist-activity-badge")).toBeNull();
    expect(screen.queryByTestId("wave-creator-badge")).toBeNull();
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
    expect(screen.queryByTestId("wave-creator-badge")).toBeNull();
  });

  it("renders wave creator badge when profile is wave creator", () => {
    render(
      <DropAuthorBadges
        profile={{
          ...baseProfile,
          is_wave_creator: true,
        }}
      />
    );

    expect(screen.getByTestId("wave-creator-badge")).toBeInTheDocument();
    expect(screen.queryByTestId("artist-activity-badge")).toBeNull();
  });

  it("renders both badges and forwards tooltip id prefix", () => {
    render(
      <DropAuthorBadges
        profile={{
          ...baseProfile,
          active_main_stage_submission_ids: ["s1"],
          is_wave_creator: true,
        }}
        tooltipIdPrefix="custom-badges"
      />
    );

    expect(screen.getByTestId("artist-activity-badge")).toHaveAttribute(
      "data-tooltip-id",
      "custom-badges-activity"
    );
    expect(screen.getByTestId("wave-creator-badge")).toHaveAttribute(
      "data-tooltip-id",
      "custom-badges-wave-creator"
    );
  });

  it("wires badge click handlers to modal hooks", () => {
    render(
      <DropAuthorBadges
        profile={{
          ...baseProfile,
          active_main_stage_submission_ids: ["s1"],
          is_wave_creator: true,
        }}
      />
    );

    fireEvent.click(screen.getByTestId("artist-activity-badge"));
    fireEvent.click(screen.getByTestId("wave-creator-badge"));

    expect(mockArtistHandleBadgeClick).toHaveBeenCalledWith("active");
    expect(mockWaveCreatorHandleBadgeClick).toHaveBeenCalledTimes(1);
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
          is_wave_creator: true,
        }}
      />
    );

    expect(screen.getByTestId("artist-preview-modal")).toHaveAttribute(
      "data-user-primary-address",
      "0xwallet"
    );
    expect(screen.getByTestId("wave-creator-preview-modal")).toHaveAttribute(
      "data-user-primary-address",
      "0xwallet"
    );
  });
});
