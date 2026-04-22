import { render, screen } from "@testing-library/react";
import CreateWaveDates from "@/components/waves/create-wave/dates/CreateWaveDates";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import type { CreateWaveDatesConfig } from "@/types/waves.types";

jest.mock(
  "@/components/waves/create-wave/dates/CreateWaveDatesApprove",
  () => () => <div data-testid="approve-dates" />
);

jest.mock(
  "@/components/waves/create-wave/dates/CreateWaveDatesRank",
  () => () => <div data-testid="rank-dates" />
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
  it("renders approve dates flow for approve waves", () => {
    render(
      <CreateWaveDates
        waveType={ApiWaveType.Approve}
        dates={baseDates}
        setDates={jest.fn()}
      />
    );

    expect(screen.getByTestId("approve-dates")).toBeInTheDocument();
    expect(screen.queryByTestId("rank-dates")).toBeNull();
  });

  it("renders rank dates flow for rank waves", () => {
    render(
      <CreateWaveDates
        waveType={ApiWaveType.Rank}
        dates={baseDates}
        setDates={jest.fn()}
      />
    );

    expect(screen.getByTestId("rank-dates")).toBeInTheDocument();
    expect(screen.queryByTestId("approve-dates")).toBeNull();
  });

  it("keeps non-approve waves on the rank flow", () => {
    render(
      <CreateWaveDates
        waveType={ApiWaveType.Chat}
        dates={baseDates}
        setDates={jest.fn()}
      />
    );

    expect(screen.getByTestId("rank-dates")).toBeInTheDocument();
  });
});
