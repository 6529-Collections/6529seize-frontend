import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveNextStep from "@/components/waves/create-wave/utils/CreateWaveNextStep";
import { CreateWaveStep } from "@/types/waves.types";

jest.mock("@/components/utils/button/PrimaryButton", () => {
  return function PrimaryButton({ onClicked, children, disabled }: any) {
    return (
      <button onClick={onClicked} disabled={disabled}>
        {children}
      </button>
    );
  };
});

describe("CreateWaveNextStep", () => {
  it("renders Next before the final review", async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    render(
      <CreateWaveNextStep
        disabled={false}
        submitting={false}
        step={CreateWaveStep.DATES}
        onClick={onClick}
      />
    );
    await user.click(screen.getByText("Next"));
    expect(onClick).toHaveBeenCalled();
  });

  it("renders confirmation only on final review", () => {
    render(
      <CreateWaveNextStep
        disabled={false}
        submitting={true}
        step={CreateWaveStep.REVIEW}
        onClick={jest.fn()}
      />
    );
    expect(screen.getByText("Confirm and create")).toBeInTheDocument();
    expect(screen.getByText("Confirm and create")).toBeDisabled();
  });

  it("disables Next while its step is submitting", () => {
    render(
      <CreateWaveNextStep
        disabled={false}
        submitting={true}
        step={CreateWaveStep.GROUPS}
        onClick={jest.fn()}
      />
    );
    expect(screen.getByText("Next")).toBeDisabled();
  });
});
