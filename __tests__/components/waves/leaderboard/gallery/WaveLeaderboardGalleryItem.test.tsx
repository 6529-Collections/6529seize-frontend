import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WaveLeaderboardGalleryItem } from "@/components/waves/leaderboard/gallery/WaveLeaderboardGalleryItem";
import { ApiWaveParticipationSubmissionStrategyType } from "@/generated/models/ApiWaveParticipationSubmissionStrategyType";
import { useDropVoteLogs } from "@/hooks/useDropVoteLogs";
import { useDropVoters } from "@/hooks/useDropVoters";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";

jest.mock(
  "@/components/drops/view/item/content/media/MediaDisplay",
  () => (props: any) => <div data-testid="media" data-url={props.media_url} />
);
jest.mock(
  "@/components/waves/leaderboard/gallery/WaveLeaderboardGalleryItemVotes",
  () => (props: any) => (
    <div
      data-testid="votes"
      data-variant={props.variant}
      data-winning-threshold={props.winningThreshold ?? ""}
      data-winning-threshold-min-duration={
        props.winningThresholdMinDurationMs ?? ""
      }
      data-is-voting-closed={String(props.isVotingClosed)}
    />
  )
);
jest.mock(
  "@/components/waves/leaderboard/identity/WaveLeaderboardIdentity",
  () => ({
    WaveLeaderboardIdentity: ({ drop, variant }: any) =>
      drop.wave?.submission_type === "IDENTITY" ? (
        <div data-testid="identity" data-variant={variant} />
      ) : null,
  })
);
jest.mock("@/components/waves/drops/winner/WinnerDropBadge", () => () => (
  <div data-testid="badge" />
));
jest.mock("@/components/voting", () => ({
  VotingModal: (props: any) => (
    <div data-testid="modal" data-open={props.isOpen} />
  ),
  MobileVotingModal: (props: any) => (
    <div data-testid="mobile-modal" data-open={props.isOpen} />
  ),
}));
jest.mock("@/components/voting/VotingModalButton", () => (props: any) => (
  <button data-testid="vote-btn" onClick={props.onClick} />
));
jest.mock("@/hooks/isMobileScreen", () => () => false);
jest.mock("@/hooks/useIsTouchDevice");
jest.mock("@/hooks/useDropVoters");
jest.mock("@/hooks/useDropVoteLogs");
jest.mock("@/hooks/useIntersectionObserver", () => ({
  useIntersectionObserver: () => ({ current: null }),
}));
jest.mock("@/components/utils/tooltip/UserProfileTooltipWrapper", () => ({
  __esModule: true,
  default: ({ children }: { readonly children: React.ReactNode }) => (
    <>{children}</>
  ),
}));
jest.mock("@/hooks/drops/useDropInteractionRules", () => ({
  useDropInteractionRules: () => ({ canShowVote: true }),
}));
jest.mock("@/helpers/image.helpers", () => ({
  getScaledImageUri: (u: string) => `scaled:${u}`,
  ImageScale: { AUTOx450: "x", AUTOx1080: "y" },
}));

const mockUseDropVoters = useDropVoters as jest.Mock;
const mockUseDropVoteLogs = useDropVoteLogs as jest.Mock;
const mockUseIsTouchDevice = useIsTouchDevice as jest.Mock;

describe("WaveLeaderboardGalleryItem", () => {
  const drop: any = {
    id: "d1",
    metadata: [],
    parts: [{ media: [{ url: "img", mime_type: "image/png" }] }],
    raters_count: 3,
    rank: 1,
    wave: { id: "w1", voting_credit_type: "NIC", submission_type: null },
    context_profile_context: { rating: 1 },
    author: { handle: "alice" },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsTouchDevice.mockReturnValue(false);
    mockUseDropVoters.mockReturnValue({
      voters: [],
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
    mockUseDropVoteLogs.mockReturnValue({
      logs: [],
      isFetchingNextPage: false,
      fetchNextPage: jest.fn(),
      hasNextPage: false,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });
  });

  it("handles click and keyboard events", async () => {
    const onDropClick = jest.fn();
    const { container } = render(
      <WaveLeaderboardGalleryItem drop={drop} onDropClick={onDropClick} />
    );
    const mainButton = container.querySelector("button:first-of-type")!;
    expect(mainButton).toHaveClass("tw-touch-pan-y");
    expect(mainButton).not.toHaveClass("tw-touch-none");
    await userEvent.click(mainButton);
    expect(onDropClick).toHaveBeenCalledWith(drop);
    fireEvent.keyDown(mainButton, { key: "Enter" });
    expect(onDropClick).toHaveBeenCalledTimes(2);
  });

  it("opens voting modal when vote button clicked", async () => {
    render(<WaveLeaderboardGalleryItem drop={drop} onDropClick={jest.fn()} />);
    expect(screen.getByTestId("modal")).toHaveAttribute("data-open", "false");
    await userEvent.click(screen.getByTestId("vote-btn"));
    expect(screen.getByTestId("modal")).toHaveAttribute("data-open", "true");
  });

  it("renders the compact vote-details chip in the gallery footer", () => {
    render(<WaveLeaderboardGalleryItem drop={drop} onDropClick={jest.fn()} />);

    const trigger = screen.getByRole("button", {
      name: "View voters and vote log for 3 voters",
    });

    expect(trigger).toHaveTextContent(/3\s*voters/);
    expect(trigger).toHaveClass(
      "tw-border-iron-700",
      "tw-bg-iron-900/40",
      "tw-px-1.5",
      "tw-py-0.5"
    );
    expect(trigger.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("does not open the drop when the vote-details chip is clicked", async () => {
    const onDropClick = jest.fn();

    render(
      <WaveLeaderboardGalleryItem drop={drop} onDropClick={onDropClick} />
    );

    await userEvent.click(
      screen.getByRole("button", {
        name: "View voters and vote log for 3 voters",
      })
    );

    expect(onDropClick).not.toHaveBeenCalled();
  });

  it("closes voting modal when voting closes", async () => {
    const { rerender } = render(
      <WaveLeaderboardGalleryItem drop={drop} onDropClick={jest.fn()} />
    );

    await userEvent.click(screen.getByTestId("vote-btn"));
    expect(screen.getByTestId("modal")).toHaveAttribute("data-open", "true");

    rerender(
      <WaveLeaderboardGalleryItem
        drop={drop}
        onDropClick={jest.fn()}
        isVotingClosed={true}
      />
    );

    expect(screen.getByTestId("modal")).toHaveAttribute("data-open", "false");
    expect(screen.queryByTestId("vote-btn")).toBeNull();
  });

  it("hides vote action while controls are locked without passing closed state to votes", () => {
    render(
      <WaveLeaderboardGalleryItem
        drop={drop}
        onDropClick={jest.fn()}
        winningThreshold={10}
        isVotingClosed={false}
        isVotingControlsLocked={true}
      />
    );

    expect(screen.queryByTestId("vote-btn")).toBeNull();
    expect(screen.getByTestId("votes")).toHaveAttribute(
      "data-winning-threshold",
      "10"
    );
    expect(screen.getByTestId("votes")).toHaveAttribute(
      "data-is-voting-closed",
      "false"
    );
  });

  it("closes voting modal when controls become locked", async () => {
    const { rerender } = render(
      <WaveLeaderboardGalleryItem drop={drop} onDropClick={jest.fn()} />
    );

    await userEvent.click(screen.getByTestId("vote-btn"));
    expect(screen.getByTestId("modal")).toHaveAttribute("data-open", "true");

    rerender(
      <WaveLeaderboardGalleryItem
        drop={drop}
        onDropClick={jest.fn()}
        isVotingControlsLocked={true}
      />
    );

    expect(screen.getByTestId("modal")).toHaveAttribute("data-open", "false");
    expect(screen.queryByTestId("vote-btn")).toBeNull();
  });

  it("hides voting button when voting is closed", () => {
    render(
      <WaveLeaderboardGalleryItem
        drop={drop}
        onDropClick={jest.fn()}
        isVotingClosed={true}
      />
    );

    expect(screen.queryByTestId("vote-btn")).toBeNull();
  });

  it("passes approve status props to the vote display", () => {
    render(
      <WaveLeaderboardGalleryItem
        drop={drop}
        onDropClick={jest.fn()}
        winningThreshold={10}
        winningThresholdMinDurationMs={120_000}
        isVotingClosed={true}
      />
    );

    expect(screen.getByTestId("votes")).toHaveAttribute(
      "data-winning-threshold",
      "10"
    );
    expect(screen.getByTestId("votes")).toHaveAttribute(
      "data-winning-threshold-min-duration",
      "120000"
    );
    expect(screen.getByTestId("votes")).toHaveAttribute(
      "data-is-voting-closed",
      "true"
    );
  });

  it("applies artFocused styles", () => {
    const { container } = render(
      <WaveLeaderboardGalleryItem
        drop={drop}
        onDropClick={jest.fn()}
        artFocused={false}
      />
    );
    expect(container.firstChild).not.toHaveClass("active:tw-bg-iron-900");
  });

  it("renders a condensed identity summary for identity waves", () => {
    render(
      <WaveLeaderboardGalleryItem
        drop={{
          ...drop,
          wave: {
            ...drop.wave,
            submission_type:
              ApiWaveParticipationSubmissionStrategyType.Identity,
          },
        }}
        onDropClick={jest.fn()}
      />
    );

    expect(screen.getByTestId("identity")).toHaveAttribute(
      "data-variant",
      "condensed"
    );
  });
});
