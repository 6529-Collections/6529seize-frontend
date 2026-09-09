import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateWaveBackStep from "@/components/waves/create-wave/utils/CreateWaveBackStep";

describe("CreateWaveBackStep", () => {
  it("calls onPreviousStep when clicked", async () => {
    const user = userEvent.setup();
    const onPreviousStep = jest.fn();
    render(<CreateWaveBackStep onPreviousStep={onPreviousStep} />);
    await user.click(screen.getByRole("button", { name: /previous/i }));
    expect(onPreviousStep).toHaveBeenCalled();
  });

  it("is disabled while navigation is busy", () => {
    render(<CreateWaveBackStep onPreviousStep={jest.fn()} disabled={true} />);
    expect(screen.getByRole("button", { name: /previous/i })).toBeDisabled();
  });
});
