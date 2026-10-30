import { fireEvent, render, screen } from "@testing-library/react";
import { SingleWaveDropInfoPanel } from "@/components/waves/drop/SingleWaveDropInfoPanel";
import { ApiDropType } from "@/generated/models/ApiDropType";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";

const mockUseDropInteractionRules = jest.fn();

jest.mock(
  "@/components/waves/memes/collaborations/MemeCollaborationPanel",
  () => ({
    MemeCollaborationPanel: ({
      dropId,
      authorId,
    }: {
      dropId: string;
      authorId: string;
    }) => (
      <div
        data-testid="collaboration-panel"
        data-drop-id={dropId}
        data-author-id={authorId}
      />
    ),
  })
);

jest.mock("@fortawesome/react-fontawesome", () => ({
  FontAwesomeIcon: (props: any) => <svg data-testid="fa" {...props} />,
}));

jest.mock("react-tooltip", () => ({
  Tooltip: ({ children }: any) => <div>{children}</div>,
}));

jest.mock("@/components/waves/drop/SingleWaveDropContent", () => ({
  SingleWaveDropContent: () => <div data-testid="content" />,
}));

jest.mock("@/components/waves/drop/SingleWaveDropInfoDetails", () => ({
  SingleWaveDropInfoDetails: () => <div data-testid="details" />,
}));

jest.mock("@/components/waves/drop/WaveDropMetaRow", () => ({
  WaveDropMetaRow: () => <div data-testid="meta" />,
}));

jest.mock("@/components/utils/button/WaveDropDeleteButton", () => ({
  __esModule: true,
  default: () => <div data-testid="delete" />,
}));

jest.mock("@/components/voting/VotingModal", () => ({
  __esModule: true,
  default: ({ isOpen }: any) => (
    <div data-testid="voting-modal" data-open={String(isOpen)} />
  ),
}));

jest.mock("@/hooks/drops/useDropInteractionRules", () => ({
  useDropInteractionRules: (drop: any) => mockUseDropInteractionRules(drop),
}));

const baseDrop: any = {
  id: "drop-1",
  author: { id: "A" },
  drop_type: ApiDropType.Participatory,
  rank: 1,
  rating: 10,
  realtime_rating: 25,
  rating_prediction: 10,
  context_profile_context: {
    rating: 5,
  },
  wave: {
    id: "w1",
    voting_credit_type: ApiWaveCreditType.Rep,
  },
  metadata: [],
  parts: [],
};

describe("SingleWaveDropInfoPanel", () => {
  beforeEach(() => {
    mockUseDropInteractionRules.mockReset();
    mockUseDropInteractionRules.mockReturnValue({
      canDelete: false,
      canShowVote: true,
      isVotingEnded: false,
      isWinner: false,
    });
  });

  it.each([
    { submission_artist: "", collaborators: [] },
    { submission_artist: "Artist A", collaborators: [] },
    {
      submission_artist: undefined,
      collaborators: [
        { id: "B", handle: "artistB", display: "artistB", pfp: null },
      ],
    },
  ])(
    "mounts managed invitation controls with credit marker $submission_artist and accepted profiles $collaborators",
    (collaboration) => {
      render(
        <SingleWaveDropInfoPanel drop={{ ...baseDrop, ...collaboration }} />
      );
      expect(screen.getByTestId("collaboration-panel")).toHaveAttribute(
        "data-drop-id",
        "drop-1"
      );
      expect(screen.getByTestId("collaboration-panel")).toHaveAttribute(
        "data-author-id",
        "A"
      );
    }
  );

  it.each([ApiDropType.Chat, ApiDropType.Winner])(
    "does not load invitations for an ordinary %s drop",
    (drop_type) => {
      render(
        <SingleWaveDropInfoPanel
          drop={{ ...baseDrop, drop_type, collaborators: [] }}
        />
      );
      expect(
        screen.queryByTestId("collaboration-panel")
      ).not.toBeInTheDocument();
    }
  );

  it("loads eligibility for lightweight submissions without credit or metadata", () => {
    render(
      <SingleWaveDropInfoPanel
        drop={{
          ...baseDrop,
          drop_type: ApiDropType.Participatory,
          collaborators: [],
        }}
      />
    );
    expect(screen.getByTestId("collaboration-panel")).toBeInTheDocument();
  });

  it("does not mount invitation controls for restricted artwork", () => {
    render(
      <SingleWaveDropInfoPanel
        drop={{
          ...baseDrop,
          submission_artist: "",
          collaborators: [{ id: "B", handle: "artistB" }],
          moderation: { can_view: false },
        }}
      />
    );
    expect(screen.queryByTestId("collaboration-panel")).not.toBeInTheDocument();
  });

  it("shows Vote and opens the modal when voting is unlocked", () => {
    render(<SingleWaveDropInfoPanel drop={baseDrop} />);

    fireEvent.click(screen.getByRole("button", { name: "Vote" }));

    expect(screen.getByTestId("voting-modal")).toHaveAttribute(
      "data-open",
      "true"
    );
  });

  it("hides Vote and keeps the modal closed when voting is locked", () => {
    render(
      <SingleWaveDropInfoPanel drop={baseDrop} isVotingControlsLocked={true} />
    );

    expect(
      screen.queryByRole("button", { name: "Vote" })
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("voting-modal")).toHaveAttribute(
      "data-open",
      "false"
    );
    expect(screen.queryByText("Your votes:")).not.toBeInTheDocument();
  });

  it("closes an open modal when voting becomes locked", () => {
    const { rerender } = render(<SingleWaveDropInfoPanel drop={baseDrop} />);

    fireEvent.click(screen.getByRole("button", { name: "Vote" }));
    expect(screen.getByTestId("voting-modal")).toHaveAttribute(
      "data-open",
      "true"
    );

    rerender(
      <SingleWaveDropInfoPanel drop={baseDrop} isVotingControlsLocked={true} />
    );

    expect(screen.getByTestId("voting-modal")).toHaveAttribute(
      "data-open",
      "false"
    );
  });

  it("treats a closed approval wave as voting ended for the summary", () => {
    render(<SingleWaveDropInfoPanel drop={baseDrop} isVotingClosed={true} />);

    expect(
      screen.queryByRole("button", { name: "Vote" })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Your votes:")).toBeInTheDocument();
  });

  it("uses realtime votes for approve detail progress", () => {
    render(
      <SingleWaveDropInfoPanel drop={baseDrop} winningThreshold={42_000_000} />
    );

    expect(screen.getByText("25")).toBeInTheDocument();
    expect(screen.getByText("Votes given now: 25")).toBeInTheDocument();
  });
});
