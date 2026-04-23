import { render, screen } from "@testing-library/react";
import QuorumParticipationDrop from "@/components/waves/quorum/QuorumParticipationDrop";

const useDropInteractionRules = jest.fn();

jest.mock("@/hooks/drops/useDropInteractionRules", () => ({
  useDropInteractionRules: (...args: any[]) => useDropInteractionRules(...args),
}));

const OngoingParticipationDropMock = jest.fn(() => (
  <div data-testid="ongoing-drop" />
));
jest.mock(
  "@/components/waves/drops/participation/OngoingParticipationDrop",
  () => (props: any) => {
    OngoingParticipationDropMock(props);
    return <div data-testid="ongoing-drop" />;
  }
);

const EndedParticipationDropMock = jest.fn(() => (
  <div data-testid="ended-drop" />
));
jest.mock(
  "@/components/waves/drops/participation/EndedParticipationDrop",
  () => (props: any) => {
    EndedParticipationDropMock(props);
    return <div data-testid="ended-drop" />;
  }
);

const baseProps: any = {
  drop: { id: "drop-1" },
  showWaveInfo: false,
  activeDrop: null,
  showReplyAndQuote: false,
  location: "wave",
  onReply: jest.fn(),
  onQuoteClick: jest.fn(),
};

describe("QuorumParticipationDrop", () => {
  beforeEach(() => {
    OngoingParticipationDropMock.mockClear();
    EndedParticipationDropMock.mockClear();
  });

  it("renders the ongoing card with compact quorum presentation by default", () => {
    useDropInteractionRules.mockReturnValue({ isVotingEnded: false });

    render(<QuorumParticipationDrop {...baseProps} />);

    expect(screen.getByTestId("ongoing-drop")).toBeInTheDocument();
    expect(
      OngoingParticipationDropMock.mock.calls[0][0]?.contentPresentation
    ).toBe("quorumCompact");
  });

  it("renders the ended card with compact quorum presentation after voting closes", () => {
    useDropInteractionRules.mockReturnValue({ isVotingEnded: true });

    render(<QuorumParticipationDrop {...baseProps} />);

    expect(screen.getByTestId("ended-drop")).toBeInTheDocument();
    expect(
      EndedParticipationDropMock.mock.calls[0][0]?.contentPresentation
    ).toBe("quorumCompact");
  });
});
