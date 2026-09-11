import { render, screen } from "@testing-library/react";
import CreateWaveDates from "@/components/waves/create-wave/dates/CreateWaveDates";
import { CREATE_WAVE_VALIDATION_ERROR } from "@/helpers/waves/create-wave.validation";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { CreateWaveDatesConfig } from "@/types/waves.types";

jest.mock(
  "@/components/waves/create-wave/dates/CreateWaveDatesApprove",
  () => () => <div data-testid="approve-dates" />
);

jest.mock(
  "@/components/waves/create-wave/dates/CreateWaveDatesRank",
  () => (props: any) => (
    <div
      data-testid="rank-dates"
      data-error-count={String(props.errors.length)}
    />
  )
);

const baseDates: CreateWaveDatesConfig = {
  submissionStartDate: 10,
  votingStartDate: 20,
  endDate: null,
  firstDecisionTime: 30,
  subsequentDecisions: [],
  isRolling: false,
};

describe("CreateWaveDates", () => {
  it("shows the schedule controls as the primary step content", () => {
    const now = Date.now();
    render(
      <CreateWaveDates
        waveType={ApiWaveType.Rank}
        dates={{
          ...baseDates,
          submissionStartDate: now,
          votingStartDate: now,
        }}
        errors={[]}
        setDates={jest.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: "Schedule" })).toBeVisible();
    expect(screen.getByTestId("rank-dates")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /Advanced settings/ })
    ).not.toBeInTheDocument();
  });

  it("renders approve dates flow for approve waves", () => {
    render(
      <CreateWaveDates
        waveType={ApiWaveType.Approve}
        dates={baseDates}
        errors={[]}
        setDates={jest.fn()}
      />
    );

    expect(screen.getByTestId("approve-dates")).toBeInTheDocument();
    expect(screen.queryByTestId("rank-dates")).toBeNull();
    expect(
      screen.getByText(
        "Review when this wave opens, voting begins, and winners are announced."
      )
    ).toBeVisible();
  });

  it("renders rank dates flow for rank waves", () => {
    render(
      <CreateWaveDates
        waveType={ApiWaveType.Rank}
        dates={baseDates}
        errors={[]}
        setDates={jest.fn()}
      />
    );

    expect(screen.getByTestId("rank-dates")).toBeInTheDocument();
    expect(screen.queryByTestId("approve-dates")).toBeNull();
  });

  it("keeps the existing schedule description for perpetual ranking", () => {
    render(
      <CreateWaveDates
        waveType={ApiWaveType.Rank}
        dates={{ ...baseDates, ongoingRanking: true }}
        errors={[]}
        setDates={jest.fn()}
      />
    );

    expect(
      screen.getByText(
        "Review when this wave opens, voting begins, and winners are announced."
      )
    ).toBeVisible();
  });

  it("passes validation errors to the rank dates flow", () => {
    render(
      <CreateWaveDates
        waveType={ApiWaveType.Rank}
        dates={baseDates}
        errors={[
          CREATE_WAVE_VALIDATION_ERROR.RANK_DECISION_TIME_MUST_BE_IN_FUTURE,
        ]}
        setDates={jest.fn()}
      />
    );

    expect(screen.getByTestId("rank-dates")).toHaveAttribute(
      "data-error-count",
      "1"
    );
    expect(screen.getByTestId("rank-dates")).toBeVisible();
  });

  it("keeps non-approve waves on the rank flow", () => {
    render(
      <CreateWaveDates
        waveType={ApiWaveType.Chat}
        dates={baseDates}
        errors={[]}
        setDates={jest.fn()}
      />
    );

    expect(screen.getByTestId("rank-dates")).toBeInTheDocument();
  });
});
