import { render, screen } from "@testing-library/react";
import CreateWavesMainSteps from "@/components/waves/create-wave/main-steps/CreateWavesMainSteps";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { getCreateWaveMainSteps } from "@/helpers/waves/waves.constants";
import { CreateWaveStep } from "@/types/waves.types";

jest.mock(
  "@/components/waves/create-wave/main-steps/CreateWavesMainStep",
  () => (props: any) => (
    <div data-testid="step" data-step={props.step}>
      {props.label}
    </div>
  )
);

describe("CreateWavesMainSteps", () => {
  it("renders a step component for each configured step", () => {
    render(
      <CreateWavesMainSteps
        waveType={ApiWaveType.Rank}
        activeStep={CreateWaveStep.OVERVIEW}
        onStep={jest.fn()}
      />
    );
    const steps = screen.getAllByTestId("step");
    expect(steps).toHaveLength(
      getCreateWaveMainSteps({
        waveType: ApiWaveType.Rank,
        ongoingRanking: false,
      }).length
    );
    expect(steps[0]).toHaveAttribute("data-step", CreateWaveStep.OVERVIEW);
  });

  it("does not render approval as a separate approve wave step", () => {
    render(
      <CreateWavesMainSteps
        waveType={ApiWaveType.Approve}
        activeStep={CreateWaveStep.VOTING}
        onStep={jest.fn()}
      />
    );

    expect(screen.queryByText("Approval")).not.toBeInTheDocument();
  });

  it("renders rules in the chat wave step list", () => {
    render(
      <CreateWavesMainSteps
        waveType={ApiWaveType.Chat}
        activeStep={CreateWaveStep.RULES}
        onStep={jest.fn()}
      />
    );

    expect(screen.getByText("Rules")).toBeInTheDocument();
  });
});
