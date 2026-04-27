import { render, screen } from "@testing-library/react";
import ParticipationDropRatingsTotalSection from "@/components/waves/drops/participation/ratings/ParticipationDropRatingsTotalSection";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";

jest.mock(
  "@/components/waves/drops/participation/ratings/tooltips/VoteBreakdownTooltip",
  () => ({
    __esModule: true,
    default: () => <div data-testid="tooltip" />,
  })
);

jest.mock("@/components/drops/view/utils/DropVoteProgressing", () => ({
  __esModule: true,
  default: (props: any) => (
    <div
      data-testid="progress"
      data-current={props.current}
      data-projected={props.projected}
    />
  ),
}));

describe("ParticipationDropRatingsTotalSection", () => {
  const drop: any = {
    id: "d1",
    wave: { voting_credit_type: ApiWaveCreditType.Tdh },
    rating_prediction: 10,
  };
  const theme = { text: "t", ring: "r", indicator: "i" };
  const ratingsData = { currentRating: 5, hasRaters: true, userRating: 0 };
  it("renders rating text and passes values to progress component", () => {
    render(
      <ParticipationDropRatingsTotalSection
        drop={drop}
        theme={theme}
        ratingsData={ratingsData}
        rank={1}
      />
    );
    expect(screen.getByText("TDH Total")).toBeInTheDocument();
    const progress = screen.getByTestId("progress");
    expect(progress.getAttribute("data-current")).toBe("5");
    expect(progress.getAttribute("data-projected")).toBe("10");
  });

  it("renders approve threshold progress", () => {
    render(
      <ParticipationDropRatingsTotalSection
        drop={drop}
        theme={theme}
        ratingsData={ratingsData}
        rank={1}
        winningThreshold={8}
      />
    );

    expect(screen.getByText("/")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(screen.getByText("to approve")).toBeInTheDocument();
  });
});
