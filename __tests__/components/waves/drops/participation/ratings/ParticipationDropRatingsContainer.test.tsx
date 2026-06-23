import { render } from "@testing-library/react";
import React from "react";
import ParticipationDropRatingsContainer from "@/components/waves/drops/participation/ratings/ParticipationDropRatingsContainer";
import { getThemeColors } from "@/components/waves/drops/participation/ratings/ParticipationDropRatingsTheme";

let totalProps: any;
let voterProps: any;
let userProps: any;
let approvalProps: any;

jest.mock("@/components/waves/drops/ApprovalDropVoteSummary", () => ({
  __esModule: true,
  default: (props: any) => {
    approvalProps = props;
    return <div data-testid="approval-summary" />;
  },
}));

jest.mock(
  "@/components/waves/drops/participation/ratings/ParticipationDropRatingsTotalSection",
  () => (props: any) => {
    totalProps = props;
    return <div data-testid="total" />;
  }
);

jest.mock(
  "@/components/waves/drops/participation/ratings/ParticipationDropRatingsVoterSection",
  () => (props: any) => {
    voterProps = props;
    return <div data-testid="voter" />;
  }
);

jest.mock(
  "@/components/waves/drops/participation/ratings/ParticipationDropRatingsUserSection",
  () => (props: any) => {
    userProps = props;
    return <div data-testid="user" />;
  }
);

jest.mock(
  "@/components/waves/drops/participation/ratings/ParticipationDropRatingsTheme",
  () => ({
    getThemeColors: jest.fn(() => ({ ring: "r", text: "t" })),
  })
);

describe("ParticipationDropRatingsContainer", () => {
  beforeEach(() => {
    totalProps = undefined;
    voterProps = undefined;
    userProps = undefined;
    approvalProps = undefined;
    jest.clearAllMocks();
  });

  it("passes computed props to sections", () => {
    const drop = {
      top_raters: [],
      context_profile_context: null,
      rating: 5,
      wave: {},
    } as any;
    render(<ParticipationDropRatingsContainer drop={drop} rank={2} />);

    expect(getThemeColors).toHaveBeenCalled();
    expect(totalProps.drop).toBe(drop);
    expect(voterProps.drop).toBe(drop);
    expect(userProps.drop).toBe(drop);
    expect(totalProps.ratingsData.currentRating).toBe(5);
    expect(approvalProps).toBeUndefined();
  });

  it("uses the shared approval summary for approval drops", () => {
    const drop = {
      top_raters: [],
      context_profile_context: null,
      rating: 5,
      wave: {},
    } as any;
    render(
      <ParticipationDropRatingsContainer
        drop={drop}
        rank={2}
        winningThreshold={9}
        winningThresholdMinDurationMs={120_000}
      />
    );

    expect(getThemeColors).not.toHaveBeenCalled();
    expect(totalProps).toBeUndefined();
    expect(voterProps).toBeUndefined();
    expect(userProps).toBeUndefined();
    expect(approvalProps.drop).toBe(drop);
    expect(approvalProps.winningThreshold).toBe(9);
    expect(approvalProps.winningThresholdMinDurationMs).toBe(120_000);
    expect(approvalProps.variant).toBe("chat");
  });
});
