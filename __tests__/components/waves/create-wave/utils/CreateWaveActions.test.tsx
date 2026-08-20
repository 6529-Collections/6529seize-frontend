import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import CreateWaveActions from "@/components/waves/create-wave/utils/CreateWaveActions";
import type CreateWaveBackStep from "@/components/waves/create-wave/utils/CreateWaveBackStep";
import type CreateWaveNextStep from "@/components/waves/create-wave/utils/CreateWaveNextStep";
import { CreateWaveStep } from "@/types/waves.types";

jest.mock(
  "@/components/waves/create-wave/utils/CreateWaveBackStep",
  () => (props: ComponentProps<typeof CreateWaveBackStep>) => (
    <button
      data-testid="back"
      onClick={props.onPreviousStep}
      disabled={props.disabled}
    >
      back
    </button>
  )
);
jest.mock(
  "@/components/waves/create-wave/utils/CreateWaveNextStep",
  () => (props: ComponentProps<typeof CreateWaveNextStep>) => (
    <>
      <button
        data-testid="next"
        onClick={props.onClick}
        disabled={props.disabled || props.submitting}
      >
        next
      </button>
      <button data-testid="force-next" onClick={props.onClick}>
        force next callback
      </button>
    </>
  )
);

jest.mock("@/helpers/waves/create-wave.helpers", () => ({
  getCreateWaveNextStep: jest.fn(() => CreateWaveStep.DATES),
  getCreateWavePreviousStep: jest.fn(() => CreateWaveStep.OVERVIEW),
}));

describe("CreateWaveActions", () => {
  const config: any = { overview: { type: "Rank" } };

  it("navigates to next step", async () => {
    const user = userEvent.setup();
    const setStep = jest.fn();
    render(
      <CreateWaveActions
        config={config}
        step={CreateWaveStep.GROUPS}
        submitting={false}
        setStep={setStep}
        onComplete={jest.fn()}
      />
    );
    await user.click(screen.getByTestId("next"));
    expect(setStep).toHaveBeenCalledWith(CreateWaveStep.DATES, "forward");
  });

  it("calls onComplete when no next step", async () => {
    const helpers = require("@/helpers/waves/create-wave.helpers");
    helpers.getCreateWaveNextStep.mockReturnValue(null);
    const user = userEvent.setup();
    const onComplete = jest.fn();
    render(
      <CreateWaveActions
        config={config}
        step={CreateWaveStep.DESCRIPTION}
        submitting={false}
        setStep={jest.fn()}
        onComplete={onComplete}
      />
    );
    await user.click(screen.getByTestId("next"));
    expect(onComplete).toHaveBeenCalled();
  });

  it("renders back step when previous exists", () => {
    render(
      <CreateWaveActions
        config={config}
        step={CreateWaveStep.GROUPS}
        submitting={false}
        setStep={jest.fn()}
        onComplete={jest.fn()}
      />
    );
    expect(screen.getByTestId("back")).toBeInTheDocument();
  });

  it("disables both navigation directions while submitting", () => {
    render(
      <CreateWaveActions
        config={config}
        step={CreateWaveStep.GROUPS}
        submitting={true}
        setStep={jest.fn()}
        onComplete={jest.fn()}
      />
    );

    expect(screen.getByTestId("back")).toBeDisabled();
    expect(screen.getByTestId("next")).toBeDisabled();
  });

  it("disables only Next while a criteria replacement is pending", async () => {
    const user = userEvent.setup();
    const setStep = jest.fn();
    render(
      <CreateWaveActions
        config={config}
        step={CreateWaveStep.GROUPS}
        submitting={false}
        nextDisabled={true}
        setStep={setStep}
        onComplete={jest.fn()}
      />
    );

    expect(screen.getByTestId("back")).toBeEnabled();
    expect(screen.getByTestId("next")).toBeDisabled();
    await user.click(screen.getByTestId("next"));
    expect(setStep).not.toHaveBeenCalled();

    await user.click(screen.getByTestId("force-next"));
    expect(setStep).not.toHaveBeenCalled();
  });
});
