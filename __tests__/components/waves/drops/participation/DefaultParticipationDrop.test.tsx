import { render, screen } from "@testing-library/react";
import React from "react";
import ParticipationDrop from "@/components/waves/drops/participation/DefaultParticipationDrop";
import { DropLocation } from "@/components/waves/drops/Drop";

jest.mock("@/hooks/drops/useDropInteractionRules", () => ({
  useDropInteractionRules: jest.fn(),
}));

const mockOngoingParticipationDrop = jest.fn((props: any) => (
  <div
    data-testid="ongoing"
    data-is-voting-closed={String(props.isVotingClosed)}
  />
));
const mockEndedParticipationDrop = jest.fn(() => <div data-testid="ended" />);

jest.mock(
  "@/components/waves/drops/participation/OngoingParticipationDrop",
  () => (props: any) => mockOngoingParticipationDrop(props)
);
jest.mock(
  "@/components/waves/drops/participation/EndedParticipationDrop",
  () => (props: any) => mockEndedParticipationDrop(props)
);

const {
  useDropInteractionRules,
} = require("@/hooks/drops/useDropInteractionRules");

describe("DefaultParticipationDrop", () => {
  const baseProps = {
    drop: {} as any,
    showWaveInfo: false,
    activeDrop: null,
    showReplyAndQuote: true,
    location: DropLocation.MY_STREAM,
    onReply: jest.fn(),
    onQuote: jest.fn(),
    onQuoteClick: jest.fn(),
  };

  beforeEach(() => {
    mockOngoingParticipationDrop.mockClear();
    mockEndedParticipationDrop.mockClear();
  });

  it("renders ongoing component when voting ongoing", () => {
    (useDropInteractionRules as jest.Mock).mockReturnValue({
      isVotingEnded: false,
    });
    render(<ParticipationDrop {...baseProps} />);
    expect(screen.getByTestId("ongoing")).toBeInTheDocument();
  });

  it("renders ended component when voting finished", () => {
    (useDropInteractionRules as jest.Mock).mockReturnValue({
      isVotingEnded: true,
    });
    render(<ParticipationDrop {...baseProps} />);
    expect(screen.getByTestId("ended")).toBeInTheDocument();
  });

  it("keeps approve drops in the ongoing UI when voting finished", () => {
    (useDropInteractionRules as jest.Mock).mockReturnValue({
      isVotingEnded: true,
    });
    render(<ParticipationDrop {...baseProps} winningThreshold={10} />);
    expect(screen.getByTestId("ongoing")).toBeInTheDocument();
    expect(screen.queryByTestId("ended")).toBeNull();
  });

  it("marks ended approve drops as voting closed", () => {
    (useDropInteractionRules as jest.Mock).mockReturnValue({
      isVotingEnded: true,
    });
    render(<ParticipationDrop {...baseProps} winningThreshold={10} />);
    expect(mockOngoingParticipationDrop.mock.calls[0][0].isVotingClosed).toBe(
      true
    );
  });
});
