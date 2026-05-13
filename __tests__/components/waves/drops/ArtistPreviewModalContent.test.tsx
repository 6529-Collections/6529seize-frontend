import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ArtistPreviewModalContent } from "@/components/waves/drops/ArtistPreviewModalContent";
import { ApiProfileClassification } from "@/generated/models/ApiProfileClassification";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";

const useIdentityMock = jest.fn();
const pushMock = jest.fn();

jest.mock("@/hooks/useIdentity", () => ({
  useIdentity: (props: unknown) => useIdentityMock(props),
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => "/waves/test",
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock("@/contexts/CompactModeContext", () => ({
  useCompactMode: () => false,
}));

jest.mock("@/hooks/useMediaQuery", () => ({
  useMediaQuery: () => false,
}));

jest.mock("@/components/waves/drops/ArtistPreviewModalHeader", () => ({
  ArtistPreviewModalHeader: ({
    user,
    submissionCount,
    trophyCount,
  }: {
    user: ApiProfileMin;
    submissionCount: number;
    trophyCount: number;
  }) => (
    <div
      data-testid="artist-header"
      data-active-ids={user.active_main_stage_submission_ids.join(",")}
      data-submission-count={submissionCount}
      data-trophy-count={trophyCount}
    />
  ),
}));

jest.mock("@/components/waves/drops/ArtistPreviewModalTabs", () => ({
  ArtistPreviewModalTabs: () => <div data-testid="artist-tabs" />,
}));

jest.mock("@/components/waves/drops/ArtistActiveSubmissionContent", () => ({
  ArtistActiveSubmissionContent: ({ user }: { user: ApiProfileMin }) => (
    <div
      data-testid="active-content"
      data-active-ids={user.active_main_stage_submission_ids.join(",")}
    />
  ),
}));

jest.mock("@/components/waves/drops/ArtistWinningArtworksContent", () => ({
  ArtistWinningArtworksContent: ({ user }: { user: ApiProfileMin }) => (
    <div
      data-testid="winners-content"
      data-winner-ids={user.winner_main_stage_drop_ids.join(",")}
      data-prevote-ids={user.artist_of_prevote_cards.join(",")}
    />
  ),
}));

type ProfileWithBadges = ApiProfileMin & {
  readonly badges?: {
    readonly artist_of_main_stage_submissions?: number | null;
    readonly artist_of_memes?: number | null;
  };
};

const createProfile = (
  overrides: Partial<ProfileWithBadges> = {}
): ProfileWithBadges => ({
  id: "profile-id",
  handle: "GraffitiOnGrave",
  pfp: null,
  banner1_color: null,
  banner2_color: null,
  cic: 0,
  rep: 0,
  tdh: 0,
  tdh_rate: 0,
  xtdh: 0,
  xtdh_rate: 0,
  level: 0,
  classification: ApiProfileClassification.Pseudonym,
  sub_classification: null,
  primary_address: "0xartist",
  subscribed_actions: [],
  archived: false,
  active_main_stage_submission_ids: [],
  winner_main_stage_drop_ids: [],
  artist_of_prevote_cards: [],
  profile_wave_id: null,
  is_wave_creator: false,
  ...overrides,
});

const createIdentity = (overrides: Partial<ApiIdentity> = {}): ApiIdentity =>
  ({
    id: "profile-id",
    handle: "GraffitiOnGrave",
    normalised_handle: "graffitiongrave",
    pfp: null,
    cic: 0,
    rep: 0,
    level: 0,
    tdh: 0,
    tdh_rate: 0,
    xtdh: 0,
    xtdh_rate: 0,
    consolidation_key: "0xartist",
    display: "GraffitiOnGrave",
    primary_wallet: "0xartist",
    banner1: null,
    banner2: null,
    classification: ApiProfileClassification.Pseudonym,
    sub_classification: null,
    active_main_stage_submission_ids: [],
    winner_main_stage_drop_ids: [],
    artist_of_prevote_cards: [],
    profile_wave_id: null,
    is_wave_creator: false,
    ...overrides,
  }) as ApiIdentity;

describe("ArtistPreviewModalContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useIdentityMock.mockReturnValue({ profile: null, isLoading: false });
  });

  it("hydrates artist activity ids when V2 badges have counts but no ids", () => {
    const user = createProfile({
      badges: { artist_of_main_stage_submissions: 1 },
    });
    useIdentityMock.mockReturnValue({
      profile: createIdentity({
        active_main_stage_submission_ids: ["drop-1"],
      }),
      isLoading: false,
    });

    render(
      <ArtistPreviewModalContent
        user={user}
        isOpen={true}
        onClose={jest.fn()}
        activeTab="active"
        onTabChange={jest.fn()}
        hasTrophyArtworks={false}
      />
    );

    expect(useIdentityMock).toHaveBeenCalledWith({
      handleOrWallet: "GraffitiOnGrave",
      initialProfile: null,
    });
    expect(screen.getByTestId("artist-header")).toHaveAttribute(
      "data-submission-count",
      "1"
    );
    expect(screen.getByTestId("active-content")).toHaveAttribute(
      "data-active-ids",
      "drop-1"
    );
  });

  it("does not request identity hydration when activity ids are already present", () => {
    const user = createProfile({
      active_main_stage_submission_ids: ["drop-1"],
      badges: { artist_of_main_stage_submissions: 1 },
    });

    render(
      <ArtistPreviewModalContent
        user={user}
        isOpen={true}
        onClose={jest.fn()}
        activeTab="active"
        onTabChange={jest.fn()}
        hasTrophyArtworks={false}
      />
    );

    expect(useIdentityMock).toHaveBeenCalledWith({
      handleOrWallet: undefined,
      initialProfile: null,
    });
    expect(screen.getByTestId("active-content")).toHaveAttribute(
      "data-active-ids",
      "drop-1"
    );
  });
});
