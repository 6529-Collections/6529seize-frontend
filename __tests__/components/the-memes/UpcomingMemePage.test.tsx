import UpcomingMemePage from "@/components/the-memes/UpcomingMemePage";
import type { ApiDropV2View } from "@/services/api/drop-v2-view.types";
import { render, screen } from "@testing-library/react";

const mockGetCanonicalNextMintNumber = jest.fn();
const mockUseNextMintDrop = jest.fn();
const mockUseNowMintingStatus = jest.fn();

jest.mock("@/components/meme-calendar/meme-calendar.helpers", () => ({
  ...jest.requireActual("@/components/meme-calendar/meme-calendar.helpers"),
  getCanonicalNextMintNumber: () => mockGetCanonicalNextMintNumber(),
}));

jest.mock("@/hooks/useNextMintDrop", () => ({
  useNextMintDrop: () => mockUseNextMintDrop(),
}));

jest.mock("@/hooks/useNowMintingStatus", () => ({
  useNowMintingStatus: () => mockUseNowMintingStatus(),
}));

jest.mock("@/components/meme-calendar/MemeCalendarOverview", () => ({
  MemeCalendarOverviewNextMint: ({ id }: { readonly id?: number }) => (
    <div data-testid="upcoming-mint-calendar" data-token-id={id} />
  ),
}));

jest.mock("@/components/home/now-minting/LatestDropNextMintSubscribe", () => ({
  __esModule: true,
  default: ({ tokenId }: { readonly tokenId?: number }) => (
    <div data-testid="upcoming-subscription-widget" data-token-id={tokenId} />
  ),
}));

jest.mock("@/components/home/now-minting/LatestDropNextMintPanel", () => ({
  __esModule: true,
  default: ({
    drop,
    linkMemeCard,
  }: {
    readonly drop: ApiDropV2View;
    readonly linkMemeCard?: boolean;
  }) => (
    <div
      data-testid="revealed-next-mint-panel"
      data-drop-id={drop.id}
      data-link-meme-card={String(linkMemeCard)}
    />
  ),
  LatestDropNextMintPanelSkeleton: () => (
    <div data-testid="revealed-next-mint-panel-skeleton" />
  ),
}));

const createDrop = (memeCardId: number): ApiDropV2View =>
  ({
    id: "drop-1",
    submission_context: { meme_card_id: memeCardId },
  }) as ApiDropV2View;

describe("UpcomingMemePage", () => {
  beforeEach(() => {
    mockGetCanonicalNextMintNumber.mockReturnValue(520);
    mockUseNowMintingStatus.mockReturnValue({
      isFetching: false,
      isDropComplete: false,
      isStatusLoading: false,
    });
    mockUseNextMintDrop.mockReturnValue({
      nextMint: null,
      waveId: "main-stage-wave",
      isFetching: false,
      isSettingsLoaded: true,
    });
  });

  it("shows mint timing and subscription awareness for unresolved meme ids", () => {
    const { container } = render(<UpcomingMemePage id="519" />);

    expect(screen.getByTestId("upcoming-mint-calendar")).toHaveAttribute(
      "data-token-id",
      "519"
    );
    expect(screen.getByTestId("upcoming-subscription-widget")).toHaveAttribute(
      "data-token-id",
      "519"
    );
    expect(
      [...container.querySelectorAll("[data-testid]")].map((element) =>
        element.getAttribute("data-testid")
      )
    ).toEqual(["upcoming-subscription-widget", "upcoming-mint-calendar"]);
  });

  it("shows the revealed drop and calendar for the mapped canonical next meme", () => {
    mockGetCanonicalNextMintNumber.mockReturnValue(519);
    mockUseNowMintingStatus.mockReturnValue({
      isFetching: false,
      isDropComplete: true,
      isStatusLoading: false,
    });
    mockUseNextMintDrop.mockReturnValue({
      nextMint: createDrop(519),
      waveId: "main-stage-wave",
      isFetching: false,
      isSettingsLoaded: true,
    });

    const { container } = render(<UpcomingMemePage id="519" />);

    expect(screen.getByTestId("revealed-next-mint-panel")).toHaveAttribute(
      "data-link-meme-card",
      "false"
    );
    expect(
      screen.queryByTestId("upcoming-subscription-widget")
    ).not.toBeInTheDocument();
    expect(
      [...container.querySelectorAll("[data-testid]")].map((element) =>
        element.getAttribute("data-testid")
      )
    ).toEqual(["revealed-next-mint-panel", "upcoming-mint-calendar"]);
  });

  it("keeps the generic view when the revealed drop maps to another meme", () => {
    mockGetCanonicalNextMintNumber.mockReturnValue(519);
    mockUseNowMintingStatus.mockReturnValue({
      isFetching: false,
      isDropComplete: true,
      isStatusLoading: false,
    });
    mockUseNextMintDrop.mockReturnValue({
      nextMint: createDrop(520),
      waveId: "main-stage-wave",
      isFetching: false,
      isSettingsLoaded: true,
    });

    render(<UpcomingMemePage id="519" />);

    expect(
      screen.getByTestId("upcoming-subscription-widget")
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId("revealed-next-mint-panel")
    ).not.toBeInTheDocument();
  });

  it("reserves the artwork panel while the canonical reveal state loads", () => {
    mockGetCanonicalNextMintNumber.mockReturnValue(519);
    mockUseNowMintingStatus.mockReturnValue({
      isFetching: true,
      isDropComplete: false,
      isStatusLoading: false,
    });

    render(<UpcomingMemePage id="519" />);

    expect(
      screen.getByTestId("revealed-next-mint-panel-skeleton")
    ).toBeInTheDocument();
    expect(screen.getByTestId("upcoming-mint-calendar")).toBeInTheDocument();
  });

  it("reserves the artwork panel until the Main Stage settings load", () => {
    mockGetCanonicalNextMintNumber.mockReturnValue(519);
    mockUseNextMintDrop.mockReturnValue({
      nextMint: null,
      waveId: null,
      isFetching: false,
      isSettingsLoaded: false,
    });

    render(<UpcomingMemePage id="519" />);

    expect(
      screen.getByTestId("revealed-next-mint-panel-skeleton")
    ).toBeInTheDocument();
    expect(screen.getByTestId("upcoming-mint-calendar")).toBeInTheDocument();
  });
});
